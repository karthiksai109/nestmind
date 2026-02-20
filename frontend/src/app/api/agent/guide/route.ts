import { NextRequest, NextResponse } from "next/server";
import { askBedrock } from "@/lib/bedrock";

export async function POST(req: NextRequest) {
  const { query, university, studentCountry } = await req.json();

  const prompt = `You are a campus life guide for an international student from ${studentCountry || "another country"} studying at ${university || "a US university"}.
Their question: "${query}"

Answer clearly in simple English. This student might not be a native English speaker.
Cover practical details. If it's about visa/immigration, give general guidance but remind them to check with their international student office.
If it's about daily life (food, transport, banking, phone plans), give specific actionable steps.

Respond in JSON format:
{
  "answer": "your detailed response",
  "actionSteps": ["step1", "step2", "step3"],
  "importantNote": "any critical warning or deadline they should know",
  "relatedTopics": ["topic1", "topic2"]
}`;

  const result = await askBedrock(prompt);
  if (!result.text) {
    return NextResponse.json({
      answer: "That's a great question. For most campus-related things, your international student office is the best first stop. They deal with this stuff daily and can give you advice specific to your situation. Also check your university's website for student resources.",
      actionSteps: ["Visit your international student office", "Check university website for resources", "Join student groups on social media"],
      importantNote: "Always keep your I-20 and passport documents safe and accessible.",
      relatedTopics: ["student services", "campus resources"],
      meta: result.meta,
    });
  }
  try {
    const parsed = JSON.parse(result.text);
    return NextResponse.json({ ...parsed, meta: result.meta });
  } catch {
    return NextResponse.json({ answer: result.text, actionSteps: [], importantNote: "", relatedTopics: [], meta: result.meta });
  }
}
