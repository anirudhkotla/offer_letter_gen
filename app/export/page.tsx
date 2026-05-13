"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHRStore } from "@/lib/store";
import Layout from "@/components/ui/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LetterPreview from "@/components/preview/LetterPreview";
import { fmt } from "@/lib/utils";

export default function ExportPage() {
  const router = useRouter();
  const { employmentType, internshipData, fulltimeData, compensation, reset } = useHRStore();
  const [downloading, setDownloading] = useState(false);

  const isIntern = employmentType === "internship";
  const data = isIntern ? internshipData : fulltimeData;

  async function downloadPDF() {
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const container = document.getElementById("letter-preview-full");
      if (!container) return;

      const pageEls = Array.from(
        container.querySelectorAll<HTMLElement>("[data-lhpage]")
      );
      if (pageEls.length === 0) {
        alert("Preview not ready. Please wait and try again.");
        setDownloading(false);
        return;
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      // Load the Tericsoft letterhead PNG once
      const lhDataUrl = await new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext("2d")!.drawImage(img, 0, 0);
          resolve(c.toDataURL("image/jpeg", 0.92));
        };
        img.onerror = () => reject(new Error("Letterhead failed to load"));
        img.src = "/assets/letterhead_bg.png";
      });

      let firstPage = true;

      for (const el of pageEls) {
        // Hide the pinned letterhead <img> elements inside this page section
        // so we capture only the text content (transparent background)
        const lhImgs = Array.from(el.querySelectorAll<HTMLElement>("[data-lh-img]"));
        lhImgs.forEach((img) => (img.style.visibility = "hidden"));

        // Wait for all fonts to finish loading so headings don't shift position
        await document.fonts.ready;

        const canvas = await html2canvas(el, {
          scale: 3,           // higher scale → sharper text, less rounding jitter
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });

        lhImgs.forEach((img) => (img.style.visibility = ""));

        const contentPng = canvas.toDataURL("image/png");

        // Use the canvas's natural proportional height — do NOT force-stretch
        // to pdfH, which shifts text positions relative to the letterhead.
        const contentH = (canvas.height * pdfW) / canvas.width;

        if (!firstPage) pdf.addPage();
        firstPage = false;

        pdf.addImage(lhDataUrl, "JPEG", 0, 0, pdfW, pdfH);
        pdf.addImage(contentPng, "PNG", 0, 0, pdfW, contentH);
      }

      const name = ((data as any).fullName || "candidate").replace(/\s+/g, "_");
      pdf.save(`offer_letter_${name}.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF download failed. Try printing with Ctrl+P (File → Print → Save as PDF).");
    }
    setDownloading(false);
  }

  async function downloadDOCX() {
    alert("DOCX export: Use your browser's print → Save as PDF, or copy the preview text into Word.");
  }

  return (
    <Layout step={4}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Download & Export</h1>
          <p className="text-gray-500 text-sm mt-1">Final preview with letterhead. Download as PDF.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Candidate", val: data.fullName || "—" },
            { label: "Role", val: data.role || "—" },
            { label: "Type", val: isIntern ? "Internship" : "Full-Time" },
            { label: "Joining", val: (data as any).joiningDate || "—" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="font-semibold text-gray-800 mt-0.5 truncate">{item.val}</p>
            </div>
          ))}
        </div>

        {/* Compensation summary (fulltime only) */}
        {!isIntern && compensation.totalGrossAnnual && (
          <Card title="Compensation Summary" className="mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: "Gross Monthly", val: compensation.totalGrossMonthly || 0 },
                { label: "Net Monthly", val: compensation.netSalaryMonthly || 0 },
                { label: "Net Annual", val: compensation.netSalaryAnnual || 0 },
              ].map((s) => (
                <div key={s.label} className="text-center bg-brand-light rounded-lg p-3">
                  <p className="text-xs text-brand/70">{s.label}</p>
                  <p className="text-xl font-bold text-brand mt-0.5">₹{fmt(s.val)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Tax Regime: <strong>{compensation.selectedRegime === "old" ? "Old Regime" : "New Regime (Budget 2025)"}</strong>
            </p>
          </Card>
        )}

        {/* Download buttons */}
        <div className="flex gap-3 mb-8">
          <Button onClick={downloadPDF} loading={downloading} size="lg">
            📄 Download PDF
          </Button>
          <Button onClick={downloadDOCX} variant="secondary" size="lg">
            📝 Export DOCX
          </Button>
          <Button onClick={() => window.print()} variant="ghost" size="lg">
            🖨️ Print
          </Button>
          <Button onClick={() => { reset(); router.push("/form"); }} variant="ghost" size="lg">
            ➕ New Letter
          </Button>
        </div>

        {/* Full preview */}
        <div className="bg-gray-100 rounded-xl p-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">Full Document Preview</h3>
          <div className="overflow-auto">
            <LetterPreview id="letter-preview-full" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
