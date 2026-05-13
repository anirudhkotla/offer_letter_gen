"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHRStore } from "@/lib/store";
import Layout from "@/components/ui/Layout";
import Card from "@/components/ui/Card";
import { Input, TextArea, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { fmtLetterDate } from "@/lib/utils";

const ROLES = [
  "AI Intern", "Software Engineer", "Growth Marketing Executive",
  "Product Manager", "Data Analyst", "Business Development Executive",
  "HR Executive", "UI/UX Designer", "DevOps Engineer", "Other",
];

export default function FormPage() {
  const router = useRouter();
  const {
    employmentType, setEmploymentType,
    internshipData, setInternshipData,
    fulltimeData, setFulltimeData,
    setStep,
  } = useHRStore();

  const [loading, setLoading] = useState(false);
  const isIntern = employmentType === "internship";

  async function handleGenerate() {
    setLoading(true);
    const data = isIntern ? internshipData : fulltimeData;
    try {
      const res = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: employmentType, ...data }),
      });
      const json = await res.json();
      if (isIntern) setInternshipData({ responsibilities: json.content });
      else setFulltimeData({ responsibilities: json.content });
    } catch {
      // fallback — use placeholder
      const fallback = isIntern
        ? `Your internship will include training focused on ${internshipData.role || "the assigned role"}, working alongside your mentor to develop practical skills and contribute meaningfully to the team. Based on your performance, your employment will be rediscussed after ${internshipData.duration || "3 months"}.`
        : `${fulltimeData.role || "Core"} Responsibilities:\n• Lead and execute key initiatives aligned with business goals.\n• Collaborate with cross-functional teams to deliver results.\n• Monitor KPIs and iterate based on data-driven insights.\n• Contribute to Tericsoft's product vision and roadmap.`;
      if (isIntern) setInternshipData({ responsibilities: fallback });
      else setFulltimeData({ responsibilities: fallback });
    }
    setLoading(false);
  }

  function handleNext() {
    setStep(2);
    if (isIntern) {
      // Internship skips compensation — go to editor
      setStep(3);
      router.push("/editor");
    } else {
      router.push("/compensation");
    }
  }

  return (
    <Layout step={1}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Candidate Details</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the candidate information to generate an offer letter</p>
        </div>

        {/* Employment Type */}
        <Card className="mb-5">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-3">
              Employment Type
            </label>
            <div className="flex gap-3">
              {(["fulltime", "internship"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setEmploymentType(t)}
                  className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    employmentType === t
                      ? "border-brand bg-brand text-white"
                      : "border-gray-200 text-gray-500 hover:border-brand/40"
                  }`}
                >
                  {t === "fulltime" ? "🏢 Full-Time" : "🎓 Internship"}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {isIntern ? (
          <InternshipForm data={internshipData} setData={setInternshipData} />
        ) : (
          <FulltimeForm data={fulltimeData} setData={setFulltimeData} />
        )}

        {/* Responsibilities area */}
        <Card title="AI-Generated Responsibilities" className="mt-5">
          <div className="space-y-3">
            <TextArea
              label="Short description (for AI)"
              value={isIntern ? internshipData.shortDesc || "" : fulltimeData.shortDesc || ""}
              onChange={(e) =>
                isIntern
                  ? setInternshipData({ shortDesc: e.target.value })
                  : setFulltimeData({ shortDesc: e.target.value })
              }
              rows={3}
              placeholder="Describe the role in 1-2 sentences…"
            />
            <Button onClick={handleGenerate} loading={loading} variant="secondary" size="sm">
              🤖 Generate with AI
            </Button>
            <TextArea
              label="Responsibilities (editable)"
              value={isIntern ? internshipData.responsibilities || "" : fulltimeData.responsibilities || ""}
              onChange={(e) =>
                isIntern
                  ? setInternshipData({ responsibilities: e.target.value })
                  : setFulltimeData({ responsibilities: e.target.value })
              }
              rows={8}
              placeholder="AI-generated content will appear here. You can edit freely."
            />
          </div>
        </Card>

        <div className="flex justify-end mt-6">
          <Button onClick={handleNext} size="lg">
            {isIntern ? "Preview Letter →" : "Next: Compensation →"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}

// ── Sub-forms ──────────────────────────────────────────────────────────────
function InternshipForm({ data, setData }: any) {
  return (
    <Card title="Internship Details">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name *" value={data.name || ""} onChange={(e) => setData({ name: e.target.value })} placeholder="Anirudh" />
        <Input label="Full Name *" value={data.fullName || ""} onChange={(e) => setData({ fullName: e.target.value })} placeholder="Kotla Anirudh" />
        <Input label="Role *" value={data.role || ""} onChange={(e) => setData({ role: e.target.value })} placeholder="AI Intern" />
        <Input label="Date of Joining *" type="date" value={data.joiningDate || ""} onChange={(e) => setData({ joiningDate: e.target.value, letterDate: fmtLetterDate(e.target.value) })} />
        <Select label="Duration" value={data.duration || "3 months"} onChange={(e) => setData({ duration: e.target.value })}>
          {["1 month","2 months","3 months","6 months"].map((d) => <option key={d}>{d}</option>)}
        </Select>
        <Input label="Timings" value={data.timings || "10:30am – 7pm"} onChange={(e) => setData({ timings: e.target.value })} />
        <Input label="Letter Date" value={data.letterDate || ""} onChange={(e) => setData({ letterDate: e.target.value })} placeholder="e.g. 17th March 2026" />
      </div>
    </Card>
  );
}

function FulltimeForm({ data, setData }: any) {
  return (
    <Card title="Full-Time Details">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name *" value={data.name || ""} onChange={(e) => setData({ name: e.target.value })} placeholder="Kanan" />
        <Input label="Full Name *" value={data.fullName || ""} onChange={(e) => setData({ fullName: e.target.value })} placeholder="Kanan Goyal" />
        <Input label="Email *" type="email" value={data.email || ""} onChange={(e) => setData({ email: e.target.value })} placeholder="kanan@email.com" />
        <Input label="Role *" value={data.role || ""} onChange={(e) => setData({ role: e.target.value })} placeholder="Growth Marketing Executive" />
        <Input label="Reporting To *" value={data.reportingTo || ""} onChange={(e) => setData({ reportingTo: e.target.value })} placeholder="Abdul" />
        <Input label="Date of Joining *" type="date" value={data.joiningDate || ""} onChange={(e) => setData({ joiningDate: e.target.value, letterDate: fmtLetterDate(e.target.value) })} />
        <Input label="Letter Date" value={data.letterDate || ""} onChange={(e) => setData({ letterDate: e.target.value })} placeholder="e.g. 10-05-2025" />
        <Select label="Probation Period" value={data.probationPeriod || "3"} onChange={(e) => setData({ probationPeriod: e.target.value })}>
          {["1","2","3","6"].map((m) => <option key={m} value={m}>{m} months</option>)}
        </Select>
      </div>
    </Card>
  );
}
