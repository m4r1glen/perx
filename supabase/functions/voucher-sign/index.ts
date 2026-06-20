// PERX voucher-sign — returns an HMAC-SHA256 signed token for a voucher.
// VOUCHER_SIGNING_SECRET is a Supabase secret; never sent to the client.
// The token format is: base64url(payloadJSON).base64url(hmacSig)
// Payload covers { v: voucher_id, o: offer_id, e: employee_id, p: provider_id, x: expires_at_unix }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function b64urlEncode(bytes: Uint8Array): string {
  const s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlEncodeStr(s: string): string {
  return b64urlEncode(new TextEncoder().encode(s));
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SIGNING_SECRET = Deno.env.get("VOUCHER_SIGNING_SECRET");

    if (!SIGNING_SECRET) {
      console.error("[voucher-sign] VOUCHER_SIGNING_SECRET missing");
      return new Response(JSON.stringify({ ok: false, reason: "server_misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ ok: false, reason: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller identity
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, reason: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const uid = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const voucherId: string | undefined = body?.voucher_id;
    if (!voucherId) {
      return new Response(JSON.stringify({ ok: false, reason: "missing_voucher_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role read; we'll enforce ownership ourselves
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: voucher, error: vErr } = await admin
      .from("vouchers")
      .select("id, offer_id, employee_id, provider_id, expires_at, status, code, value_l")
      .eq("id", voucherId)
      .maybeSingle();

    if (vErr || !voucher) {
      return new Response(JSON.stringify({ ok: false, reason: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only the owning employee may request a sign token for their voucher
    if (voucher.employee_id !== uid) {
      return new Response(JSON.stringify({ ok: false, reason: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      v: voucher.id,
      o: voucher.offer_id,
      e: voucher.employee_id,
      p: voucher.provider_id,
      x: Math.floor(new Date(voucher.expires_at).getTime() / 1000),
    };
    const payloadStr = JSON.stringify(payload);
    const payloadB64 = b64urlEncodeStr(payloadStr);
    const sig = await hmacSign(SIGNING_SECRET, payloadB64);
    const token = `${payloadB64}.${sig}`;

    console.log("[voucher-sign] issued token for voucher", voucher.id);

    return new Response(
      JSON.stringify({
        ok: true,
        token,
        code: voucher.code,
        status: voucher.status,
        value_l: voucher.value_l,
        expires_at: voucher.expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[voucher-sign] error", e);
    return new Response(JSON.stringify({ ok: false, reason: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
