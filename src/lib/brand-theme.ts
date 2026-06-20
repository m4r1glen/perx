/**
 * Per-tenant brand application.
 *
 * NOTE: PERX has ONE primary accent across the entire product — the green
 * defined by --brand in src/styles.css. We intentionally do NOT override the
 * global --brand token with a per-company hex anymore: doing so produced
 * inconsistent accents across screens (indigo on the employer dashboard,
 * green on the landing page, etc.) and broke the single-identity feel.
 *
 * Multi-tenant theming is still proven via the TeamSystem demo preset
 * (`[data-theme="teamsystem"]` in src/styles.css), which cleanly re-skins the
 * whole app from green to TeamSystem blue.
 *
 * The functions below are kept as no-ops so existing call sites continue to
 * work without changes to logic, routing, or data.
 */

export function applyCompanyBrand(_primary: string | null | undefined): void {
  // intentional no-op — see file header.
}

export function clearCompanyBrand(): void {
  // intentional no-op — see file header.
  if (typeof document === "undefined") return;
  document.getElementById("perx-company-brand")?.remove();
}
