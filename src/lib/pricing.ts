/**
 * PERX platform pricing — kept in one place so it can be tuned later.
 * Values are in Lek (the smallest user-facing currency unit we use everywhere).
 */
export const ANNUAL_LICENSE_PER_EMPLOYEE_L = 3600; // ≈ €36 / employee / year ≈ €3 / mo

/** Roughly 1 EUR = 100 L for display purposes only. */
export const LEK_PER_EUR = 100;

/** Default benefits budget per employee, per month (Lek). */
export const DEFAULT_MONTHLY_BUDGET_PER_EMPLOYEE_L = 3000;

export function annualLicenseTotalL(employees: number): number {
  const n = Math.max(0, Math.floor(employees || 0));
  return n * ANNUAL_LICENSE_PER_EMPLOYEE_L;
}

export function monthlyLicensePerEmployeeL(): number {
  return Math.round(ANNUAL_LICENSE_PER_EMPLOYEE_L / 12);
}

export function lekToEur(l: number): number {
  return Math.round(l / LEK_PER_EUR);
}
