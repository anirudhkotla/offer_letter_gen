"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHRStore } from "@/lib/store";
import Layout from "@/components/ui/Layout";
import Card from "@/components/ui/Card";
import { Input, TextArea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import LetterPreview from "@/components/preview/LetterPreview";

export default function EditorPage() {
  const router = useRouter();
  const {
    employmentType,
    internshipData, setInternshipData,
    fulltimeData, setFulltimeData,
    setStep,
  } = useHRStore();

  const [refineText, setRefineText] = useState("");
  const [refineInstr, setRefineInstr] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [refined, setRefined] = useState("");

  const isIntern = employmentType === "internship";
  const data = isIntern ? internshipData : fulltimeData;
  const setData = isIntern ? setInternshipData : setFulltimeData;

  async function handleRefine() {
    if (!refineText || !refineInstr) return;
    setRefineLoading(true);
    try {
      const res = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "refine", text: refineText, instruction: refineInstr }),
      });
      const json = await res.json();
      setRefined(json.content || "");
    } catch {
      setRefined("AI refinement unavailable. Edit manually.");
    }
    setRefineLoading(false);
  }

  function handleNext() {
    setStep(4);
    router.push("/export");
  }

  return (
    <Layout step={3}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editor & Preview</h1>
        <p className="text-gray-500 text-sm mt-1">Edit on the left, preview updates on the right</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* LEFT: Editor */}
        <div className="space-y-5">
          <Card title="📝 Edit Content">
            <div className="space-y-4">
              {isIntern ? (
                <InternEditor data={internshipData} setData={setInternshipData} />
              ) : (
                <FulltimeEditor data={fulltimeData} setData={setFulltimeData} />
              )}
            </div>
          </Card>

          {/* AI Refine */}
          <Card title="🤖 AI Refine a Section">
            <div className="space-y-3">
              <TextArea
                label="Paste paragraph to refine"
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                rows={4}
                placeholder="Paste any section here…"
              />
              <Input
                label="Instruction"
                value={refineInstr}
                onChange={(e) => setRefineInstr(e.target.value)}
                placeholder="e.g. Make more formal / shorter / focus on leadership"
              />
              <Button onClick={handleRefine} loading={refineLoading} variant="secondary" size="sm">
                ✨ Refine with AI
              </Button>
              {refined && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Refined output — copy into editor above
                  </p>
                  <TextArea
                    value={refined}
                    onChange={() => {}}
                    rows={5}
                    className="bg-green-50 border-green-200"
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT: Preview */}
        <div>
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 text-sm">👁️ Live Preview</h3>
              <span className="text-xs text-gray-400">Auto-updates as you edit</span>
            </div>
            <div className="overflow-auto max-h-[75vh] rounded-xl border border-gray-200 shadow-inner bg-gray-100 p-4">
              {/* scale to fit A4 width inside the panel */}
              <div style={{ zoom: 0.55, width: "210mm" }}>
                <LetterPreview />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={() => router.push(isIntern ? "/form" : "/compensation")}>
          ← Back
        </Button>
        <Button onClick={handleNext} size="lg">Download & Export →</Button>
      </div>
    </Layout>
  );
}

// ── Editor sub-components ──────────────────────────────────────────────────
function InternEditor({ data, setData }: any) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={data.name||""} onChange={(e)=>setData({name:e.target.value})} />
        <Input label="Full Name" value={data.fullName||""} onChange={(e)=>setData({fullName:e.target.value})} />
        <Input label="Role" value={data.role||""} onChange={(e)=>setData({role:e.target.value})} />
        <Input label="Date of Joining" value={data.joiningDate||""} onChange={(e)=>setData({joiningDate:e.target.value})} />
        <Input label="Duration" value={data.duration||""} onChange={(e)=>setData({duration:e.target.value})} />
        <Input label="Timings" value={data.timings||""} onChange={(e)=>setData({timings:e.target.value})} />
        <Input label="Letter Date" value={data.letterDate||""} onChange={(e)=>setData({letterDate:e.target.value})} className="col-span-2" />
      </div>
      <TextArea label="Responsibilities" value={data.responsibilities||""} onChange={(e)=>setData({responsibilities:e.target.value})} rows={6} />
    </>
  );
}

function FulltimeEditor({ data, setData }: any) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={data.name||""} onChange={(e)=>setData({name:e.target.value})} />
        <Input label="Full Name" value={data.fullName||""} onChange={(e)=>setData({fullName:e.target.value})} />
        <Input label="Email" value={data.email||""} onChange={(e)=>setData({email:e.target.value})} />
        <Input label="Role" value={data.role||""} onChange={(e)=>setData({role:e.target.value})} />
        <Input label="Reporting To" value={data.reportingTo||""} onChange={(e)=>setData({reportingTo:e.target.value})} />
        <Input label="Probation (months)" value={data.probationPeriod||""} onChange={(e)=>setData({probationPeriod:e.target.value})} />
        <Input label="Date of Joining" value={data.joiningDate||""} onChange={(e)=>setData({joiningDate:e.target.value})} />
        <Input label="Letter Date" value={data.letterDate||""} onChange={(e)=>setData({letterDate:e.target.value})} />
      </div>
      <TextArea label="Responsibilities" value={data.responsibilities||""} onChange={(e)=>setData({responsibilities:e.target.value})} rows={10} />
    </>
  );
}
