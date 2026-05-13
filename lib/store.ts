import { create } from "zustand";

export type EmploymentType = "internship" | "fulltime";
export type TaxRegime = "old" | "new";

export interface InternshipData {
  name: string;
  fullName: string;
  role: string;
  joiningDate: string;
  duration: string;
  timings: string;
  letterDate: string;
  shortDesc: string;
  responsibilities: string;
}

export interface FulltimeData {
  name: string;
  fullName: string;
  email: string;
  role: string;
  reportingTo: string;
  joiningDate: string;
  letterDate: string;
  probationPeriod: string;
  shortDesc: string;
  responsibilities: string;
}

export interface CompensationData {
  annualGross: number;
  basicSalaryPct: number;
  hraAmount: number;
  otherAllowance: number;
  bonus: number;
  pfEmployee: number;
  pfEmployer: number;
  professionalTax: number;
  // Annual total tax (including cess) for each regime
  incomeTax_old: number;
  incomeTax_new: number;
  // Monthly TDS = IF(annualTax > 0, annualTax / 12, 0)  — matches Excel formula
  tds_old: number;
  tds_new: number;
  selectedRegime: TaxRegime;
  // Derived salary components
  basicSalaryMonthly: number;
  basicSalaryAnnual: number;
  hraMonthly: number;
  hraAnnual: number;
  otherAllowanceMonthly: number;
  otherAllowanceAnnual: number;
  totalGrossMonthly: number;
  totalGrossAnnual: number;
  totalDeductionsMonthly: number;
  totalDeductionsAnnual: number;
  netSalaryMonthly: number;
  netSalaryAnnual: number;
}

interface HRStore {
  step: number;
  employmentType: EmploymentType;
  internshipData: Partial<InternshipData>;
  fulltimeData: Partial<FulltimeData>;
  compensation: Partial<CompensationData>;
  finalContent: string;

  setStep: (s: number) => void;
  setEmploymentType: (t: EmploymentType) => void;
  setInternshipData: (d: Partial<InternshipData>) => void;
  setFulltimeData: (d: Partial<FulltimeData>) => void;
  setCompensation: (d: Partial<CompensationData>) => void;
  setFinalContent: (c: string) => void;
  reset: () => void;
}

const defaultComp: Partial<CompensationData> = {
  annualGross: 1400000,
  basicSalaryPct: 50,
  hraAmount: 8000,
  bonus: 0,
  pfEmployee: 1800,
  pfEmployer: 1800,
  professionalTax: 200,
  selectedRegime: "new",
};

export const useHRStore = create<HRStore>((set) => ({
  step: 1,
  employmentType: "fulltime",
  internshipData: {},
  fulltimeData: {},
  compensation: defaultComp,
  finalContent: "",

  setStep: (s) => set({ step: s }),
  setEmploymentType: (t) => set({ employmentType: t }),
  setInternshipData: (d) =>
    set((state) => ({ internshipData: { ...state.internshipData, ...d } })),
  setFulltimeData: (d) =>
    set((state) => ({ fulltimeData: { ...state.fulltimeData, ...d } })),
  setCompensation: (d) =>
    set((state) => ({ compensation: { ...state.compensation, ...d } })),
  setFinalContent: (c) => set({ finalContent: c }),
  reset: () =>
    set({
      step: 1,
      internshipData: {},
      fulltimeData: {},
      compensation: defaultComp,
      finalContent: "",
    }),
}));

// ── Old Regime Tax (FY 2026-27) ────────────────────────────────────────────
// Slabs: 0-2.5L = 0%, 2.5-5L = 5%, 5-10L = 20%, >10L = 30%
// Standard deduction: ₹50,000
// Cess: 4% on tax
export function calcTaxOldRegime(annualGross: number): number {
  const stdDeduction = 50000;
  const taxable = Math.max(0, annualGross - stdDeduction);

  let tax = 0;
  if (taxable > 1000000) {
    tax += (taxable - 1000000) * 0.30;
    tax += (1000000 - 500000) * 0.20;
    tax += (500000 - 250000) * 0.05;
  } else if (taxable > 500000) {
    tax += (taxable - 500000) * 0.20;
    tax += (500000 - 250000) * 0.05;
  } else if (taxable > 250000) {
    tax += (taxable - 250000) * 0.05;
  }

  // Rebate u/s 87A: if taxable income ≤ 5L, full rebate (tax = 0)
  if (taxable <= 500000) tax = 0;

  // 4% Health & Education Cess
  const totalTax = Math.round(tax * 1.04);
  return totalTax;
}

// ── New Regime Tax (FY 2026-27, Budget 2025) ──────────────────────────────
// Slabs: 0-4L=0%, 4-8L=5%, 8-12L=10%, 12-16L=15%, 16-20L=20%, 20-24L=25%, >24L=30%
// Standard deduction: ₹75,000
// Rebate u/s 87A: if taxable ≤ 7L, tax = 0
// Cess: 4% on tax
export function calcTaxNewRegime(annualGross: number): number {
  const stdDeduction = 75000;
  const taxable = Math.max(0, annualGross - stdDeduction);

  let tax = 0;
  const slabs: [number, number, number][] = [
    // [from, to, rate]
    [0,       400000,  0.00],
    [400000,  800000,  0.05],
    [800000,  1200000, 0.10],
    [1200000, 1600000, 0.15],
    [1600000, 2000000, 0.20],
    [2000000, 2400000, 0.25],
    [2400000, Infinity, 0.30],
  ];

  for (const [from, to, rate] of slabs) {
    if (taxable > from) {
      const taxableInSlab = Math.min(taxable, to) - from;
      tax += taxableInSlab * rate;
    }
  }

  // Rebate u/s 87A: if taxable income ≤ 7L, full rebate
  if (taxable <= 700000) tax = 0;

  // 4% Health & Education Cess
  const totalTax = Math.round(tax * 1.04);
  return totalTax;
}

// ── Monthly TDS (matches Excel: =IF(TAX!D28>0, TAX!D28/12, "0")) ──────────
// TAX!D28 = annual total tax (old regime)
// TAX!H28 = annual total tax (new regime)
export function calcMonthlyTDS(annualTax: number): number {
  if (annualTax > 0) return Math.round(annualTax / 12);
  return 0;
}

// ── Derive full compensation breakdown ────────────────────────────────────
export function deriveCompensation(
  annualGross: number,
  basicPct: number,
  hraFixed: number,
  bonus: number,
  pfEmp: number,
  pfEmpR: number,
  pt: number,
  regime: TaxRegime
): Partial<CompensationData> {
  // Salary components
  const basicAnnual   = Math.round(annualGross * (basicPct / 100));
  const basicMonthly  = Math.round(basicAnnual / 12);
  const hraMonthly    = hraFixed;
  const hraAnnual     = hraFixed * 12;
  const otherAnnual   = annualGross - basicAnnual - hraAnnual;
  const otherMonthly  = Math.round(otherAnnual / 12);
  const grossMonthly  = Math.round(annualGross / 12);

  // Tax for both regimes
  const taxOld = calcTaxOldRegime(annualGross);
  const taxNew = calcTaxNewRegime(annualGross);

  // Monthly TDS — Excel formula: =IF(TAX!D28>0, TAX!D28, "0") then /12
  const tdsOldMonthly = calcMonthlyTDS(taxOld);
  const tdsNewMonthly = calcMonthlyTDS(taxNew);

  // Use selected regime's TDS for net calc
  const tdsMonthly = regime === "old" ? tdsOldMonthly : tdsNewMonthly;

  const totalDeductionsMonthly = pfEmp + pfEmpR + pt + tdsMonthly;
  const netMonthly = grossMonthly - totalDeductionsMonthly;

  return {
    annualGross,
    basicSalaryPct: basicPct,
    hraAmount: hraFixed,
    bonus,
    pfEmployee: pfEmp,
    pfEmployer: pfEmpR,
    professionalTax: pt,
    incomeTax_old: taxOld,
    incomeTax_new: taxNew,
    tds_old: tdsOldMonthly,
    tds_new: tdsNewMonthly,
    selectedRegime: regime,
    basicSalaryMonthly:    basicMonthly,
    basicSalaryAnnual:     basicAnnual,
    hraMonthly,
    hraAnnual,
    otherAllowanceMonthly: otherMonthly,
    otherAllowanceAnnual:  otherAnnual,
    totalGrossMonthly:     grossMonthly,
    totalGrossAnnual:      annualGross,
    totalDeductionsMonthly,
    totalDeductionsAnnual: totalDeductionsMonthly * 12,
    netSalaryMonthly:      netMonthly,
    netSalaryAnnual:       netMonthly * 12,
  };
}