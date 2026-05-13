import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { content: cleanGeneratedContent(body, getFallback(body)) },
      { status: 200 }
    );
  }

  let prompt = "";

  if (body.type === "refine") {
    prompt = `You are an HR professional refining an offer letter for Tericsoft Technology Solutions Pvt. Ltd.

Current text:
${body.text}

Instruction: ${body.instruction}

Rewrite the text according to the instruction. Keep a professional, formal tone appropriate for an Indian corporate offer letter.
Return ONLY the rewritten text, no explanations.`;
  } else if (body.type === "internship") {
    prompt = `You are an HR professional writing an internship offer letter for Tericsoft Technology Solutions Pvt. Ltd., Hyderabad.

Role: ${body.role || "Intern"}
Duration: ${body.duration || "3 months"}
Description: ${body.shortDesc || "general internship"}

Write a professional 2-3 sentence responsibility paragraph in second person ("Your internship will include...").
No bullet points. Formal tone. Return ONLY the paragraph.`;
  } else {
    prompt = `You are an HR professional writing a full-time offer letter for Tericsoft Technology Solutions Pvt. Ltd., Hyderabad.

Role: ${body.role || "Executive"}
Description: ${body.shortDesc || "general role"}

Generate professional responsibilities in this exact format:

Area Name 1:
• Task
• Task
• Task
• Task

Area Name 2:
• Task
• Task
• Task
• Task

Beyond the specific mentioned core areas, the role also includes the following expectations:
• Be an active contributor to Tericsoft's culture.
• Collaborate closely with other team members.
• Provide support in varied areas beyond the job description, as needed.

Use plain • bullets. Do not use square brackets. No markdown bold. Return ONLY the responsibilities.`;
  }

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = cleanGeneratedContent(
      body,
      data.choices?.[0]?.message?.content?.trim() || getFallback(body)
    );
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ content: cleanGeneratedContent(body, getFallback(body)) });
  }
}

function cleanGeneratedContent(body: any, content: string): string {
  if (body.type === "refine") return content;
  return content.replace(/[\[\]]/g, "");
}

function getFallback(body: any): string {
  if (body.type === "refine") return body.text;
  if (body.type === "internship") {
    return `Your internship will include hands-on training in ${body.role || "the assigned domain"}, working alongside your mentor and contributing to meaningful projects over ${body.duration || "3 months"}. You will develop practical skills and gain deeper industry exposure, with your employment status reviewed based on performance at the end of the internship.`;
  }
  return `${body.role || "Core"} Responsibilities:
• Lead and execute key initiatives aligned with Tericsoft's business objectives.
• Collaborate with cross-functional teams to deliver high-quality results on time.
• Monitor key performance indicators and iterate based on data-driven insights.
• Drive innovation and contribute to continuous improvement within your domain.
• Prepare and present reports, strategies, and recommendations to leadership.

Beyond the specific mentioned core areas, the role also includes the following expectations:
• Be an active contributor to Tericsoft's culture.
• Collaborate closely with other team members.
• Provide support in varied areas beyond the job description, as needed.`;
}
