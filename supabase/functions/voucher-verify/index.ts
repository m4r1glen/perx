// PERX voucher-verify — verifies a scanned voucher token and atomically redeems it.
// VOUCHER_SIGNING_SECRET is a Supabase secret; never sent to the client.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function b64urlDecodeToString(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}
function b64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return b64urlEncode(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SIGNING_SECRET = Deno.env.get("VOUCHER_SIGNING_SECRET");

    if (!SIGNING_SECRET) {
      console.error("[voucher-verify] VOUCHER_SIGNING_SECRET missing");
      return jsonResp({ ok: false, reason: "server_misconfigured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResp({ ok: false, reason: "unauthenticated" }, 401);
    }

    // Identify caller (must be a provider owner)
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResp({ ok: false, reason: "unauthenticated" }, 401);
    }
    const uid = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const token: string | undefined = body?.token;
    const manualCode: string | undefined = body?.code;

    const admin0 = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    let payload: { v: string; o: string; e: string; p: string; x: number };

    if (token && typeof token === "string" && token.includes(".")) {
      const [payloadB64, providedSig] = token.split(".", 2);
      const expectedSig = await hmacSign(SIGNING_SECRET, payloadB64);
      if (!timingSafeEqual(providedSig, expectedSig)) {
        console.warn("[voucher-verify] signature mismatch");
        return jsonResp({ ok: false, reason: "invalid_signature" }, 400);
      }
      try {
        payload = JSON.parse(b64urlDecodeToString(payloadB64));
      } catch {
        return jsonResp({ ok: false, reason: "invalid_payload" }, 400);
      }
      if (typeof payload?.x === "number" && payload.x * 1000 < Date.now()) {
        return jsonResp({ ok: false, reason: "expired" }, 400);
      }
    } else if (manualCode && typeof manualCode === "string") {
      // Manual fallback: look up by human-readable code. Signature not required
      // because the code is unique and the DB is the source of truth; provider
      // ownership + atomic redeem still gate the action.
      const normalized = manualCode.trim().toUpperCase();
      const { data: byCode, error: bcErr } = await admin0
        .from("vouchers")
        .select("id, offer_id, employee_id, provider_id, expires_at")
        .eq("code", normalized)
        .maybeSingle();
      if (bcErr || !byCode) {
        return jsonResp({ ok: false, reason: "not_found" }, 404);
      }
      payload = {
        v: byCode.id,
        o: byCode.offer_id,
        e: byCode.employee_id,
        p: byCode.provider_id,
        x: Math.floor(new Date(byCode.expires_at).getTime() / 1000),
      };
    } else {
      return jsonResp({ ok: false, reason: "invalid_token_format" }, 400);
    }

    const admin = admin0;

    // Resolve scanning provider — caller must own a provider record
    const { data: scanningProvider, error: provErr } = await admin
      .from("providers")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (provErr || !scanningProvider) {
      return jsonResp({ ok: false, reason: "not_a_provider" }, 403);
    }

    // Load voucher with offer + employee for response context
    const { data: voucher, error: vErr } = await admin
      .from("vouchers")
      .select(
        "id, offer_id, employee_id, provider_id, status, value_l, expires_at, redeemed_at, code",
      )
      .eq("id", payload.v)
      .maybeSingle();

    if (vErr || !voucher) {
      return jsonResp({ ok: false, reason: "not_found" }, 404);
    }

    // Payload-vs-DB consistency
    if (
      voucher.offer_id !== payload.o ||
      voucher.employee_id !== payload.e ||
      voucher.provider_id !== payload.p
    ) {
      console.warn("[voucher-verify] payload mismatch with db");
      return jsonResp({ ok: false, reason: "tampered" }, 400);
    }

    // Provider ownership check — scanner must own the offer's provider
    if (voucher.provider_id !== scanningProvider.id) {
      return jsonResp({ ok: false, reason: "wrong_provider" }, 403);
    }

    // Fetch context
    const [{ data: offer }, { data: emp }] = await Promise.all([
      admin.from("offers").select("title_sq, title_en").eq("id", voucher.offer_id).maybeSingle(),
      admin.from("profiles").select("full_name, email").eq("id", voucher.employee_id).maybeSingle(),
    ]);

    if (voucher.status === "redeemed") {
      return jsonResp({
        ok: false,
        reason: "already_redeemed",
        redeemed_at: voucher.redeemed_at,
        voucher: {
          id: voucher.id,
          code: voucher.code,
          value_l: voucher.value_l,
          offer_title_sq: offer?.title_sq,
          offer_title_en: offer?.title_en,
          employee_name: emp?.full_name ?? emp?.email,
        },
      });
    }
    if (voucher.status === "cancelled") {
      return jsonResp({ ok: false, reason: "cancelled" });
    }
    if (new Date(voucher.expires_at).getTime() < Date.now()) {
      return jsonResp({ ok: false, reason: "expired" });
    }
    if (voucher.status !== "valid") {
      return jsonResp({ ok: false, reason: "not_valid" });
    }

    // ATOMIC flip: only succeeds if status is still 'valid'
    const { data: redeemed, error: rErr } = await admin.rpc("redeem_voucher", {
      _voucher_id: voucher.id,
      _provider_id: scanningProvider.id,
    });

    if (rErr) {
      console.error("[voucher-verify] redeem rpc error", rErr);
      return jsonResp({ ok: false, reason: "server_error" }, 500);
    }

    if (!redeemed) {
      // Re-read for fresh status (lost the race or other condition)
      const { data: fresh } = await admin
        .from("vouchers")
        .select("status, redeemed_at")
        .eq("id", voucher.id)
        .maybeSingle();
      if (fresh?.status === "redeemed") {
        return jsonResp({
          ok: false,
          reason: "already_redeemed",
          redeemed_at: fresh.redeemed_at,
        });
      }
      return jsonResp({ ok: false, reason: "not_redeemable" });
    }

    console.log("[voucher-verify] redeemed", voucher.id, "by provider", scanningProvider.id);

    return jsonResp({
      ok: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        value_l: voucher.value_l,
        offer_title_sq: offer?.title_sq,
        offer_title_en: offer?.title_en,
        employee_name: emp?.full_name ?? emp?.email,
        redeemed_at: redeemed.redeemed_at,
      },
    });
  } catch (e) {
    console.error("[voucher-verify] error", e);
    return jsonResp({ ok: false, reason: "server_error" }, 500);
  }
});
