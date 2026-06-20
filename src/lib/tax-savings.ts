// Simplified Albania-context illustrative model.
// Personal income tax brackets (monthly, Lek):
//   0%   up to 50,000
//   13%  on portion 50,001 – 200,000
//   23%  on portion above 200,000
// Plus a simplified 9.5% employee social/health contribution on the raise.
//
// Same value X delivered as a tax-free benefit arrives at full face value.

export type TaxBreakdown = {
  benefitNet: number; // = X
  raiseNet: number; // what the employee actually keeps from a cash raise of X
  taxPaid: number; // PIT
  socialPaid: number; // simplified contribution
  difference: number; // benefitNet - raiseNet
  effectiveRate: number; // 0..1
};

export function computeTaxSavings(value: number): TaxBreakdown {
  const x = Math.max(0, Math.round(value));
  // PIT on the raise itself, treated as marginal income on top of existing salary
  // For illustration we apply brackets to X as if it were standalone monthly income.
  let pit = 0;
  if (x > 200_000) {
    pit += (x - 200_000) * 0.23;
    pit += (200_000 - 50_000) * 0.13;
  } else if (x > 50_000) {
    pit += (x - 50_000) * 0.13;
  }
  const social = x * 0.095;
  const raiseNet = Math.max(0, x - pit - social);
  const difference = x - raiseNet;
  return {
    benefitNet: x,
    raiseNet: Math.round(raiseNet),
    taxPaid: Math.round(pit),
    socialPaid: Math.round(social),
    difference: Math.round(difference),
    effectiveRate: x === 0 ? 0 : difference / x,
  };
}
