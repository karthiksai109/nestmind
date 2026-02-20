import { NextRequest, NextResponse } from "next/server";
import { askBedrock } from "@/lib/bedrock";

export async function POST(req: NextRequest) {
  const { query, university, budget } = await req.json();

  const prompt = `You are a housing advisor for international students at ${university || "a US university"}.
The student's budget is ${budget || "not specified"}.
Their question: "${query}"

Give practical, specific housing advice. Include:
1. Direct answer to their question
2. Price ranges they should expect
3. Red flags to watch out for
4. Tips specific to international students (lease terms, deposits, guarantor issues)

Keep it conversational and helpful. Write like a friend who knows the area well.
Respond in JSON format: {"answer": "your full response", "tips": ["tip1", "tip2", "tip3"], "priceRange": {"low": number, "high": number}}`;

  const result = await askBedrock(prompt);
  if (!result.text) {
    return NextResponse.json({
      answer: "I'm having trouble connecting right now. The housing market near most universities ranges from $500-1200/month for shared apartments. Check Facebook groups for your university and Zillow for listings. Always read the lease carefully before signing.",
      tips: ["Check Facebook groups for student housing", "Never pay deposit before seeing the place", "Ask about utilities included or not"],
      priceRange: { low: 500, high: 1200 },
      meta: result.meta,
    });
  }
  try {
    const parsed = JSON.parse(result.text);
    return NextResponse.json({ ...parsed, meta: result.meta });
  } catch {
    return NextResponse.json({ answer: result.text, tips: [], priceRange: null, meta: result.meta });
  }
}
