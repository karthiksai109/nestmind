import { NextRequest, NextResponse } from "next/server";
import { askBedrock } from "@/lib/bedrock";

export async function POST(req: NextRequest) {
  const { query, major, year, visaStatus } = await req.json();

  const prompt = `You are a career advisor for an international student.
Major: ${major || "not specified"}
Year: ${year || "not specified"}
Visa status: ${visaStatus || "F1 student visa"}
Their question: "${query}"

Give real, honest career advice. Don't sugarcoat the job market. Address:
1. Their specific question
2. Visa implications for employment (OPT, CPT, H1B if relevant)
3. Practical next steps they can take this week
4. Companies known to sponsor international students in their field

Respond in JSON format:
{
  "answer": "your detailed career advice",
  "nextSteps": ["step1", "step2", "step3"],
  "companies": ["company1", "company2", "company3"],
  "visaNote": "relevant visa/work authorization info",
  "marketOutlook": "brief outlook for their field"
}`;

  const result = await askBedrock(prompt);
  if (!result.text) {
    return NextResponse.json({
      answer: "The job market for international students is competitive but not impossible. Start with your university's career center - they often have connections with companies that sponsor visas. Apply to large tech companies and consulting firms early, they have the most established sponsorship programs.",
      nextSteps: ["Update your LinkedIn profile", "Visit university career center", "Start applying 6 months before graduation"],
      companies: ["Amazon", "Google", "Microsoft", "Deloitte", "JP Morgan"],
      visaNote: "On F1 visa, you get 12 months OPT (36 months if STEM). Apply for OPT 90 days before graduation.",
      marketOutlook: "Tech and engineering fields have the strongest demand for international talent.",
      meta: result.meta,
    });
  }
  try {
    const parsed = JSON.parse(result.text);
    return NextResponse.json({ ...parsed, meta: result.meta });
  } catch {
    return NextResponse.json({ answer: result.text, nextSteps: [], companies: [], visaNote: "", marketOutlook: "", meta: result.meta });
  }
}
