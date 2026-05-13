"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { useHRStore, CompensationData } from "@/lib/store";
import { fmt } from "@/lib/utils";
import CompensationTable from "../compensation/CompTable";

function parseResp(raw: string): string {
  if (!raw) return "";
  const stripBrackets = (value: string) => value.replace(/[\[\]]/g, "").trim();
  const md = (t: string) =>
    t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  const html: string[] = [];
  let section: string[] = [];
  let inList = false;

  const openSection = () => {
    if (section.length) return;
    section = [
      `<div data-keep-block="true" style="break-inside:avoid;page-break-inside:avoid">`,
    ];
  };

  const closeList = () => {
    if (!inList) return;
    section.push("</ul>");
    inList = false;
  };

  const closeSection = () => {
    closeList();
    if (!section.length) return;
    section.push("</div>");
    html.push(section.join(""));
    section = [];
  };

  raw.split("\n").forEach((line) => {
    const s = stripBrackets(line.trim());
    if (!s) {
      closeSection();
      return;
    }

    const clean = stripBrackets(s.replace(/^\*{1,2}(.*?)\*{1,2}$/, "$1"));
    const isBullet =
      s.startsWith("•") || s.startsWith("-") || (s.startsWith("*") && !s.startsWith("**"));

    if (isBullet) {
      openSection();
      if (!inList) {
        section.push(
          `<ul style="list-style-type:disc;margin:0 0 0.65rem 4.2em;padding-left:1.1em">`
        );
        inList = true;
      }
      section.push(
        `<li style="margin-bottom:0.12rem;text-align:justify;padding-left:0.15em">${md(stripBrackets(s.replace(/^[•\-\*]\s*/, "")))}</li>`
      );
      return;
    }

    closeSection();
    if (clean.endsWith(":")) {
      openSection();
      section.push(`<p style="padding-left:2em;margin-top:0.65rem;margin-bottom:0.35rem"><strong>${md(clean)}</strong></p>`);
      return;
    }
    html.push(`<p class="mb-1 text-justify" style="padding-left:2em">${md(s)}</p>`);
  });

  closeSection();
  return html.join("");
}

/** One A4 sheet with the letterhead image pinned absolutely behind the content.
 *  The page clips to A4; pagination keeps text inside the safe letterhead area.
 *  The img carries data-lh-img so the PDF exporter can hide it before capture.
 */
function LhPage({
  id,
  children,
  centerVertically = false,
}: {
  id: string;
  children: React.ReactNode;
  centerVertically?: boolean;
}) {
  return (
    <div
      id={id}
      data-lhpage
      style={{
        width: "210mm",
        height: "297mm",
        position: "relative",
        backgroundColor: "transparent",
        overflow: "hidden",
        marginBottom: "8px",
        pageBreakAfter: "always",
      }}
    >
      {/* Letterhead image — absolute, locked to A4 height, never shifts */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-lh-img
        src="/assets/letterhead_bg.png"
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "297mm",
          objectFit: "fill",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      {/* Content floats above letterhead */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          ...(centerVertically
            ? {
                display: "flex",
                flexDirection: "column" as const,
                justifyContent: "center",
              }
            : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}


const A4_W_MM = 210;
const A4_H_MM = 297;
const PAD_TOP_MM = 34;
const LETTER_PAD_TOP_MM = PAD_TOP_MM + 3;
const PAD_RIGHT_MM = 17;
const FOOTER_CONTENT_TOP_MM = 276;
const PAD_BOTTOM_MM = A4_H_MM - FOOTER_CONTENT_TOP_MM + LETTER_PAD_TOP_MM;
const PAD_LEFT_MM = 17;

const contentPad: React.CSSProperties = {
  padding: `${LETTER_PAD_TOP_MM}mm ${PAD_RIGHT_MM}mm ${PAD_BOTTOM_MM}mm ${PAD_LEFT_MM}mm`,
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "11pt",
  lineHeight: 1.4,
  color: "#111827",
};

function getMmPx(): number {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.width = "100mm";
  document.body.appendChild(div);
  const px = div.getBoundingClientRect().width / 100;
  div.remove();
  return px || 3.7795275591;
}

function isEmptyTextNode(n: Node) {
  return n.nodeType === Node.TEXT_NODE && !(n.textContent || "").trim();
}

function splitExplicitPageBreaks(html: string): string[] {
  const pages = html
    .split(/<div[^>]*data-page-break=["']true["'][^>]*>\s*<\/div>/gi)
    .map((page) => page.trim())
    .filter(Boolean);
  return pages.length ? pages : [html];
}

export default function LetterPreview({ id = "letter-preview" }: { id?: string }) {
  const { employmentType, internshipData, fulltimeData, compensation, finalContent } =
    useHRStore();
  const isIntern = employmentType === "internship";

  const content = finalContent || (isIntern
    ? buildInternBody(internshipData)
    : buildFulltimeBody(fulltimeData as any, compensation));

  const comp = compensation as Partial<CompensationData>;
  const hasComp = !isIntern && (comp.totalGrossAnnual ?? 0) > 0;

  const [letterPages, setLetterPages] = useState<string[]>(() => splitExplicitPageBreaks(content));
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;

    const mmPx = getMmPx();
    const maxContentHeight = (A4_H_MM - LETTER_PAD_TOP_MM - PAD_BOTTOM_MM) * mmPx;

    const tester = document.createElement("div");
    tester.className = "letter-body";
    tester.style.position = "absolute";
    tester.style.visibility = "hidden";
    tester.style.left = "0";
    tester.style.top = "0";
    tester.style.width = `${A4_W_MM - PAD_LEFT_MM - PAD_RIGHT_MM}mm`;
    tester.style.fontFamily = "Georgia, 'Times New Roman', serif";
    tester.style.fontSize = "11pt";
    tester.style.lineHeight = "1.4";
    tester.style.color = "#111827";
    root.appendChild(tester);

    const source = document.createElement("div");
    source.className = "letter-body";
    source.style.width = `${A4_W_MM - PAD_LEFT_MM - PAD_RIGHT_MM}mm`;
    source.style.fontFamily = "Georgia, 'Times New Roman', serif";
    source.style.fontSize = "11pt";
    source.style.lineHeight = "1.4";
    source.style.color = "#111827";
    root.appendChild(source);

    const pages: string[] = [];
    const commit = () => {
      const html = tester.innerHTML.trim();
      if (html) pages.push(tester.innerHTML);
      tester.innerHTML = "";
    };
    const height = () => tester.getBoundingClientRect().height;

    const tryAppend = (node: Node) => {
      const clone = node.cloneNode(true);
      tester.appendChild(clone);
      if (height() <= maxContentHeight + 1) return true;
      tester.removeChild(clone);
      return false;
    };

    const processNode = (node: Node) => {
      if (isEmptyTextNode(node)) return;

      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).dataset.pageBreak === "true"
      ) {
        commit();
        return;
      }

      if (tryAppend(node)) return;

      // If the current page already has content, keep the whole block together
      // by moving it to the next sheet before considering a split.
      if (tester.innerHTML.trim()) {
        commit();
        processNode(node);
        return;
      }

      // Oversized block on an empty sheet: split at its children if possible.
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const kids = Array.from(el.childNodes).filter((n) => !isEmptyTextNode(n));
        if (kids.length > 1 && el.dataset.keepBlock !== "true") {
          kids.forEach(processNode);
          return;
        }
      }

      // Last resort: keep the block rather than dropping content.
      tester.appendChild(node.cloneNode(true));
      commit();
    };

    splitExplicitPageBreaks(content).forEach((manualPage, index) => {
      if (index > 0) commit();
      source.innerHTML = manualPage;
      Array.from(source.childNodes).forEach(processNode);
    });
    commit();
    source.remove();
    tester.remove();

    const next = pages.length ? pages : splitExplicitPageBreaks(content);
    setLetterPages((prev) =>
      prev.length === next.length && prev.every((p, i) => p === next[i]) ? prev : next
    );
  }, [content]);

  return (
    <div id={id} style={{ width: "210mm", margin: "0 auto" }}>
      {/* Hidden paginator source: measures exactly the printable text area. */}
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          left: "-10000px",
          top: 0,
          width: "210mm",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
      </div>

      {/* ── Letter body pages ───────────────────────────── */}
      {letterPages.map((pageHtml, index) => (
        <LhPage key={`${id}-letter-${index}`} id={`${id}-letter-${index + 1}`}>
          <div
            className="letter-body"
            style={contentPad}
            dangerouslySetInnerHTML={{ __html: pageHtml }}
          />
        </LhPage>
      ))}

      {/* ── Visual page-break separator ─────────────────── */}
      {hasComp && (
        <div style={{
          height: "8px",
          background: "#cbd5e1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "8px", color: "#64748b", background: "#cbd5e1", padding: "0 6px" }}>
            ── page break ──
          </span>
        </div>
      )}

      {/* ── Compensation table — always a fresh page, anchored at top ── */}
      {hasComp && (
        <LhPage id={`${id}-comp`}>
          <div style={{
            padding: `${PAD_TOP_MM + 3}mm ${PAD_RIGHT_MM}mm ${PAD_BOTTOM_MM}mm ${PAD_LEFT_MM}mm`,
          }}>
            <CompensationTable comp={comp} forPrint />
          </div>
        </LhPage>
      )}

    </div>
  );
}

// ── Body builders ─────────────────────────────────────────────────────────────
function buildInternBody(d: any): string {
  return `
<p class="font-bold mb-3">${d.letterDate || ""}</p>
<p class="font-bold underline mb-4">Subject: Internship at Tericsoft Technology</p>
<p class="mb-3">Dear ${d.name || "Candidate"},</p>
<p class="mb-2 text-justify">In reference to your application, we would like to congratulate you on your internship for the position of <strong>${d.role || "Intern"}</strong> for ${d.duration || "3 months"}. Your internship is scheduled to start effective from ${d.joiningDate || ""}. All of us at Tericsoft are excited that you will be joining our team.</p>
<p class="mb-2 text-justify">${d.responsibilities || ""}</p>
<p class="mb-2 text-justify">The in-depth details of the internship will be shared by your mentor.</p>
<p class="mb-1"><strong>Date of Joining:</strong> ${d.joiningDate || ""}</p>
<p class="mb-1"><strong>Timings:</strong> ${d.timings || "10:30am – 7pm"}</p>
<p class="mb-3"><strong>Weekdays:</strong> Monday to Friday</p>
<p class="mb-6 text-justify">Again, congratulations and we look forward to working with you.</p>
<p class="mb-8">Yours sincerely,</p>
<p class="font-bold">Abdul Rahman</p><p>Director</p><p class="mb-6">Tericsoft Technology</p>
<hr class="border-gray-300 my-4"/>
<p class="mb-4">I accept the terms of this offer with Tericsoft.</p>
<div class="flex gap-12 mt-6">
  <div>___________________________________<br/><span class="text-xs">${d.fullName || ""}</span></div>
  <div>Date – ________________________</div>
</div>`;
}

function buildFulltimeBody(d: any, comp: Partial<CompensationData>): string {
  const sal = comp.totalGrossMonthly ? fmt(comp.totalGrossMonthly) : d.monthlySalary || "";
  const ctcAnnual = comp.totalGrossAnnual ? fmt(comp.totalGrossAnnual) : d.ctc || "";
  const regime = comp.selectedRegime === "old" ? "Old Tax Regime" : "New Tax Regime";

  return `
<p class="font-bold underline mb-4">${d.letterDate || ""}</p>
<p class="mb-0.5">${d.fullName || ""}</p>
<p class="mb-4">${d.email || ""}</p>
<p class="mb-3">Dear ${d.name || "Candidate"},</p>
<p class="mb-3 text-justify">It gives us great pleasure to extend you an offer to join the Tericsoft Technology team! We would like you to join in the role of <strong>${d.role || "Executive"}</strong> reporting to ${d.reportingTo || "Abdul"}. We were impressed with your strong ability combined with your enthusiasm to support the development of Tericsoft's vision &amp; mission. Together, we feel that these attributes will make you an outstanding fit as part of Tericsoft's technology team.</p>
<p class="mb-4 text-justify">This letter contains the relevant information regarding your offer.</p>
<p class="mb-4 text-justify" style="padding-left:2em"><strong><em>1.&nbsp;&nbsp;Term:</em></strong> As <strong>${d.role || "Executive"}</strong>, you will start on a ${d.probationPeriod || "3"}-month probation period with the intention of extending into the permanent role. Your services will be confirmed in writing after the successful completion of your probation period. The probation period may be extended if your performance does not meet expectations.</p>
<p class="font-bold italic mb-2" style="padding-left:2em">2.&nbsp;&nbsp;Responsibilities:</p>
<p class="italic mb-2" style="padding-left:2em">This role covers several key areas:</p>
${parseResp(d.responsibilities || "")}
<p class="mb-3 text-justify"><strong>Compensation:</strong> We are pleased to offer you compensation including:</p>
<p class="mb-3 text-justify"><em>Salary</em>: You will receive a fixed salary of INR ${sal}/- per month (Inclusive of all taxes &amp; benefits). Your fixed CTC (Cost to Company) will be INR ${ctcAnnual}/- per annum under the <strong>${regime}</strong>. The detailed compensation breakdown is provided on the next page.</p>
<p class="mb-3 text-justify">Offer stands cancelled in case of any deviations in information/if not reported before the date of acceptance.</p>
<p class="mb-3 text-justify">Please reply with your confirmation of acceptance of offer. You will have to submit certain documents as a part of the onboarding process on the joining date.</p>
<p class="mb-3 text-justify">Notice Period – During probation period, the notice period stands for 30 days. Post probation, the notice period stands for 60 days. You will be on probation for ${d.probationPeriod || "3"} months from the date of your joining.</p>
<p class="mb-5">Date of Joining: <strong>${d.joiningDate || ""}.</strong></p>
<p class="mb-5 text-justify">I am confident you will have a rewarding experience with a phenomenal team. We look forward to welcoming you to Tericsoft Technology.</p>
<p class="mb-2">Sincerely,</p>
<div style="height:2.5em"></div>
<p class="font-bold">Abdul Rahman</p><p>Director</p><p class="mb-6">Tericsoft Technology</p>
<hr class="border-gray-300 my-4"/>
<p class="mb-4">I accept this action as outlined above and confirm with the above mentioned start date.</p>
<div class="mt-4" style="display:flex;gap:4em">
  <div>___________________________________<br/><span>${d.fullName || ""}</span></div>
  <div>Date – ________________________</div>
</div>`;
}
