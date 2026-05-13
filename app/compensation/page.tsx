"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHRStore, deriveCompensation, calcTaxOldRegime, calcTaxNewRegime, CompensationData } from "@/lib/store";
import Layout from "@/components/ui/Layout";
import Card from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import CompensationTable from "@/components/compensation/CompTable";
import { fmt } from "@/lib/utils";

export default function CompensationPage() {
  const router = useRouter();
  const { compensation, setCompensation, setStep } = useHRStore();

  // Local editable state — every field is independently editable
  const [annualGross, setAnnualGross] = useState(compensation.annualGross || 1400000);
  const [basicPct, setBasicPct] = useState(compensation.basicSalaryPct || 50);
  const [hraFixed, setHraFixed] = useState(compensation.hraAmount || 8000);
  const [bonus, setBonus] = useState(compensation.bonus || 0);
  const [pfEmp, setPfEmp] = useState(compensation.pfEmployee || 1800);
  const [pt, setPt] = useState(compensation.professionalTax || 200);
  const [regime, setRegime] = useState<"old" | "new">(compensation.selectedRegime || "new");

  // Override fields — allow HR to manually override any calculated value
  const [overrides, setOverrides] = useState<Partial<CompensationData>>({});

  // Derived values
  const [derived, setDerived] = useState<Partial<CompensationData>>({});

  useEffect(() => {
    const pfEmpR = overrides.pfEmployer ?? compensation.pfEmployer ?? 1800;
    const d = deriveCompensation(annualGross, basicPct, hraFixed, bonus, pfEmp, pfEmpR, pt, regime);
    setDerived({ ...d, ...overrides });
  }, [annualGross, basicPct, hraFixed, bonus, pfEmp, pt, regime, overrides]);

  const merged = { ...derived, ...overrides };

  function setOverride(key: keyof CompensationData, val: number) {
    setOverrides((prev) => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    setCompensation(merged);
    setStep(3);
    router.push("/editor");
  }

  const taxOld = calcTaxOldRegime(annualGross);
  const taxNew = calcTaxNewRegime(annualGross);
  const saved = Math.abs(taxOld - taxNew);
  const betterRegime = taxNew < taxOld ? "New" : "Old";

  return (
    <Layout step={2}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Compensation Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">All fields are editable. Calculations update live.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Inputs */}
          <div className="space-y-5">
            {/* Base salary inputs */}
            <Card title="Salary Structure">
              <div className="space-y-4">
                <EditableField
                  label="Annual Gross Fixed (AGF) Salary (INR)"
                  value={annualGross}
                  onChange={setAnnualGross}
                  hint={`Monthly: ₹${fmt(Math.round(annualGross / 12))}`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <EditableField
                    label="Basic Salary %"
                    value={basicPct}
                    onChange={setBasicPct}
                    hint={`₹${fmt(merged.basicSalaryMonthly || 0)}/mo`}
                    max={100}
                  />
                  <EditableField
                    label="HRA (monthly, INR)"
                    value={hraFixed}
                    onChange={setHraFixed}
                    hint={`Annual: ₹${fmt(hraFixed * 12)}`}
                  />
                </div>
                <EditableField
                  label="Other Allowance (auto-calculated)"
                  value={overrides.otherAllowanceMonthly ?? (merged.otherAllowanceMonthly || 0)}
                  onChange={(v) => setOverride("otherAllowanceMonthly", v)}
                  hint="Override if needed"
                  accent
                />
                <EditableField
                  label="Bonus (annual, INR)"
                  value={bonus}
                  onChange={setBonus}
                />
              </div>
            </Card>

            {/* Deductions */}
            <Card title="Deductions">
              <div className="space-y-4">
                <EditableField
                  label="PF – Employee Contribution (monthly)"
                  value={pfEmp}
                  onChange={setPfEmp}
                  hint={`Annual: ₹${fmt(pfEmp * 12)}`}
                />
                <EditableField
                  label="PF – Employer Contribution (monthly)"
                  value={overrides.pfEmployer ?? (compensation.pfEmployer || 1800)}
                  onChange={(v) => setOverride("pfEmployer", v)}
                />
                <EditableField
                  label="Professional Tax (monthly)"
                  value={pt}
                  onChange={setPt}
                />
              </div>
            </Card>

            {/* Tax regime */}
            <Card title="Tax Regime">
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-amber-800">💡 Regime Recommendation</p>
                  <p className="text-amber-700 mt-1">
                    <strong>{betterRegime} Regime</strong> saves ₹{fmt(saved)}/year
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-amber-600">
                    <div>Old Regime Tax: ₹{fmt(taxOld)}/yr (₹{fmt(Math.round(taxOld/12))}/mo)</div>
                    <div>New Regime Tax: ₹{fmt(taxNew)}/yr (₹{fmt(Math.round(taxNew/12))}/mo)</div>
                  </div>
                </div>
                <Select
                  label="Select Tax Regime for Offer Letter"
                  value={regime}
                  onChange={(e) => setRegime(e.target.value as "old" | "new")}
                >
                  <option value="new">New Tax Regime (FY 2026-27)</option>
                  <option value="old">Old Tax Regime</option>
                </Select>
                <EditableField
                  label={`Annual Income Tax – ${regime === "old" ? "Old" : "New"} Regime`}
                  value={regime === "old"
                    ? (overrides.incomeTax_old ?? derived.incomeTax_old ?? 0)
                    : (overrides.incomeTax_new ?? derived.incomeTax_new ?? 0)}
                  onChange={(v) =>
                    regime === "old"
                      ? setOverride("incomeTax_old", v)
                      : setOverride("incomeTax_new", v)
                  }
                  hint={`Monthly TDS: ₹${fmt(regime === "old" ? (merged.tds_old ?? 0) : (merged.tds_new ?? 0))}`}
                  accent
                />
              </div>
            </Card>
          </div>

          {/* Right: Live table preview */}
          <div className="space-y-5">
            <Card title="Live Compensation Table Preview">
              <CompensationTable comp={merged} />
            </Card>

            {/* Net summary */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Gross Monthly", val: merged.totalGrossMonthly || 0, color: "text-brand" },
                { label: "Net Monthly", val: merged.netSalaryMonthly || 0, color: "text-green-600" },
                { label: "Gross Annual", val: merged.totalGrossAnnual || 0, color: "text-brand" },
                { label: "Net Annual", val: merged.netSalaryAnnual || 0, color: "text-green-600" },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-lg border border-gray-100 p-4 text-center">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className={`text-lg font-bold mt-1 ${item.color}`}>₹{fmt(item.val)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={() => router.push("/form")}>← Back</Button>
          <Button onClick={handleSave} size="lg">Save & Preview Letter →</Button>
        </div>
      </div>
    </Layout>
  );
}

function EditableField({
  label, value, onChange, hint, max, accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  max?: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="number"
        value={value}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:ring-2 transition-all
          ${accent
            ? "border-brand/40 bg-brand-light focus:border-brand focus:ring-brand/20"
            : "border-gray-200 bg-white focus:border-brand focus:ring-brand/20"
          }`}
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}