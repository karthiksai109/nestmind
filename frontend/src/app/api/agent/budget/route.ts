import { NextRequest, NextResponse } from "next/server";
import { askBedrock } from "@/lib/bedrock";

export async function POST(req: NextRequest) {
  const { expenses, income, query } = await req.json();

  const prompt = `You are a financial advisor for a broke international student.
Their monthly income: $${income || "not provided"}
Their recent expenses: ${JSON.stringify(expenses || [])}
Their question: "${query}"

Analyze their spending and give honest, practical advice. Be real about it. If they're overspending, say so directly.
Include anomaly detection - flag any expense that seems unusual compared to their pattern.

Respond in JSON format:
{
  "answer": "your analysis and advice",
  "anomalies": [{"item": "expense name", "reason": "why it's unusual"}],
  "monthlySummary": {"total": number, "projected": number, "savings": number},
  "topTip": "single most impactful advice"
}`;

  const result = await askBedrock(prompt);
  if (!result.text) {
    const total = (expenses || []).reduce((s: number, e: { amount?: number }) => s + (e.amount || 0), 0);
    return NextResponse.json({
      answer: "Based on your expenses, you're spending about $" + total + " so far. A good rule for students is 50/30/20 - 50% needs, 30% wants, 20% savings. Track every dollar for a week and you'll find at least $50 you didn't need to spend.",
      anomalies: [],
      monthlySummary: { total, projected: total * 2, savings: (income || 0) - total * 2 },
      topTip: "Cook at home. Eating out is the #1 budget killer for students.",
      meta: result.meta,
    });
  }
  try {
    const parsed = JSON.parse(result.text);
    return NextResponse.json({ ...parsed, meta: result.meta });
  } catch {
    return NextResponse.json({ answer: result.text, anomalies: [], monthlySummary: null, topTip: "", meta: result.meta });
  }
}
