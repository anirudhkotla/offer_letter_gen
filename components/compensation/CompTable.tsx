import { CompensationData } from "@/lib/store";
import { fmt } from "@/lib/utils";

interface Props {
  comp: Partial<CompensationData>;
  forPrint?: boolean;
}

export default function CompensationTable({ comp, forPrint = false }: Props) {
  const isOld   = comp.selectedRegime === "old";

  // Monthly TDS — matches Excel: =IF(TAX!D28>0, TAX!D28, "0") for old
  //                               =IF(TAX!H28>0, TAX!H28, "0") for new
  const tdsMonthly = isOld
    ? (comp.tds_old ?? 0)
    : (comp.tds_new ?? 0);
  const tdsAnnual  = tdsMonthly * 12;

  const cell = forPrint ? "px-2.5 py-1.5 text-[10px]" : "px-4 py-2.5 text-sm";
  const shell = forPrint
    ? "w-full overflow-hidden border border-gray-400 bg-white"
    : "w-full overflow-hidden rounded-lg border border-gray-300 shadow-sm";

  const salaryRows = [
    {
      label: "Basic Salary",
      pct:   `${comp.basicSalaryPct ?? 50}% of Gross`,
      mo:    comp.basicSalaryMonthly  ?? 0,
      pa:    comp.basicSalaryAnnual   ?? 0,
      type:  "normal",
    },
    {
      label: "HRA",
      pct:   "40% of Basic or 8k",
      mo:    comp.hraMonthly  ?? 0,
      pa:    comp.hraAnnual   ?? 0,
      type:  "normal",
    },
    {
      label: "Other Allowance",
      pct:   "Remaining amount",
      mo:    comp.otherAllowanceMonthly ?? 0,
      pa:    comp.otherAllowanceAnnual  ?? 0,
      type:  "normal",
    },
    {
      label: "Total Gross Salary",
      pct:   "",
      mo:    comp.totalGrossMonthly ?? 0,
      pa:    comp.totalGrossAnnual  ?? 0,
      type:  "subtotal",
    },
    {
      label: "Bonus",
      pct:   "",
      mo:    comp.bonus ?? 0,
      pa:    (comp.bonus ?? 0) * 12,
      type:  "normal",
    },
    {
      label: "On Target Earnings",
      pct:   "",
      mo:    (comp.totalGrossMonthly ?? 0) + (comp.bonus ?? 0),
      pa:    (comp.totalGrossAnnual  ?? 0) + (comp.bonus ?? 0) * 12,
      type:  "highlight",
    },
  ];

  const deductionRows = [
    {
      label: "PF Contribution by Employee",
      mo:    comp.pfEmployee ?? 0,
      pa:    (comp.pfEmployee ?? 0) * 12,
      type:  "normal",
    },
    {
      label: "PF Contribution by Employer",
      mo:    comp.pfEmployer ?? 0,
      pa:    (comp.pfEmployer ?? 0) * 12,
      type:  "normal",
    },
    {
      label: "Professional Tax",
      mo:    comp.professionalTax ?? 0,
      pa:    (comp.professionalTax ?? 0) * 12,
      type:  "normal",
    },
    {
      // Label matches compensation letter: "Income Tax deduction"
      // Value = Monthly TDS per Excel formula =IF(TAX!D28>0,TAX!D28,"0") / 12
      label: "Income Tax deduction",
      mo:    tdsMonthly,
      pa:    tdsAnnual,
      type:  "normal",
    },
    {
      label: "Total Net Salary",
      mo:    comp.netSalaryMonthly ?? 0,
      pa:    comp.netSalaryAnnual  ?? 0,
      type:  "total",
    },
  ];

  return (
    <div className={shell}>

      {/* Title row */}
        <div className="bg-[#1A3C6B] text-white text-center font-bold py-2.5 text-sm tracking-wide">
        COMPENSATION LETTER
      </div>

      {/* AGF row */}
      <div className="flex border-b border-gray-300 bg-[#E8EEF7]">
        <div className={`flex-1 font-bold text-[#1A3C6B] border-r border-gray-300 ${cell}`}>
          Annual Gross Fixed (AGF) Salary
        </div>
        <div className={`${forPrint ? "w-40" : "w-52"} text-right font-bold text-[#1A3C6B] ${cell}`}>
          {fmt(comp.annualGross ?? comp.totalGrossAnnual ?? 0)}
        </div>
      </div>

      {/* Column headers */}
        <div className="grid grid-cols-[1.35fr_1fr_1fr_1fr] bg-[#1A3C6B] text-white font-semibold text-xs">
        <div className={`border-r border-white/20 ${cell}`}>Components In Salary</div>
        <div className={`border-r border-white/20 text-center ${cell}`}>Percentage</div>
        <div className={`border-r border-white/20 text-right ${cell}`}>Per Month</div>
        <div className={`text-right ${cell}`}>Per Annum</div>
      </div>

      {/* Salary rows */}
      {salaryRows.map((r, i) => (
        <div
          key={r.label}
          className={`grid grid-cols-[1.35fr_1fr_1fr_1fr] border-b border-gray-200 ${
            r.type === "highlight"
              ? "bg-orange-50 font-bold text-orange-700"
              : r.type === "subtotal"
              ? "bg-gray-50 font-semibold"
              : i % 2 === 0 ? "bg-white" : "bg-gray-50"
          }`}
        >
          <div className={`border-r border-gray-200 ${cell}`}>{r.label}</div>
          <div className={`border-r border-gray-200 text-center text-gray-500 ${cell}`}>{r.pct}</div>
          <div className={`border-r border-gray-200 text-right ${cell}`}>
            {r.mo > 0 ? fmt(r.mo) : "–"}
          </div>
          <div className={`text-right ${cell}`}>
            {r.pa > 0 ? fmt(r.pa) : "–"}
          </div>
        </div>
      ))}

      {/* Deductions header */}
      <div className={`bg-gray-600 text-white text-center font-semibold ${cell}`}>
        Deduction
      </div>

      {/* Deduction rows */}
      {deductionRows.map((d, i) => (
        <div
          key={d.label}
          className={`grid grid-cols-[1.35fr_1fr_1fr_1fr] border-b border-gray-200 ${
            d.type === "total"
              ? "bg-[#E8EEF7] font-bold text-[#1A3C6B]"
              : i % 2 === 0 ? "bg-white" : "bg-gray-50"
          }`}
        >
          <div className={`col-span-2 border-r border-gray-200 ${cell}`}>{d.label}</div>
          <div className={`border-r border-gray-200 text-right ${cell}`}>{fmt(d.mo)}</div>
          <div className={`text-right ${cell}`}>{fmt(d.pa)}</div>
        </div>
      ))}
    </div>
  );
}
