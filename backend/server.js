require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const app = express();
app.use(cors());
app.use(express.json());

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function askBedrock(prompt, maxTokens = 1024) {
  const start = Date.now();
  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const res = await bedrock.send(command);
    const body = JSON.parse(new TextDecoder().decode(res.body));
    const duration = Date.now() - start;
    const tokens = (body.usage?.input_tokens || 0) + (body.usage?.output_tokens || 0);
    return {
      text: body.content[0].text,
      meta: { duration_ms: duration, tokens_used: tokens, source: "bedrock" },
    };
  } catch (err) {
    console.error("[Bedrock Error]", err.message);
    return { text: null, meta: { duration_ms: Date.now() - start, source: "error", error: err.message } };
  }
}

// health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// housing agent
app.post("/api/agent/housing", async (req, res) => {
  const { query, university, budget } = req.body;
  const prompt = `You are a housing advisor for international students at ${university || "a US university"}.
The student's budget is ${budget || "not specified"}.
Their question: "${query}"

Give practical, specific housing advice. Include:
1. Direct answer to their question
2. Price ranges they should expect
3. Red flags to watch out for
4. Tips specific to international students (lease terms, deposits, guarantor issues)

Keep it conversational and helpful. No bullet points with special characters. Write like a friend who knows the area well.
Respond in JSON format: {"answer": "your full response", "tips": ["tip1", "tip2", "tip3"], "priceRange": {"low": number, "high": number}}`;

  const result = await askBedrock(prompt);
  if (!result.text) {
    return res.json({
      answer: "I'm having trouble connecting to my brain right now. The housing market near most universities ranges from $500-1200/month for shared apartments. Check Facebook groups for your university and Zillow for listings. Always read the lease carefully before signing.",
      tips: ["Check Facebook groups for student housing", "Never pay deposit before seeing the place", "Ask about utilities included or not"],
      priceRange: { low: 500, high: 1200 },
      meta: result.meta,
    });
  }
  try {
    const parsed = JSON.parse(result.text);
    res.json({ ...parsed, meta: result.meta });
  } catch {
    res.json({ answer: result.text, tips: [], priceRange: null, meta: result.meta });
  }
});

// budget agent
app.post("/api/agent/budget", async (req, res) => {
  const { expenses, income, query } = req.body;
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
    const total = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    return res.json({
      answer: "Based on your expenses, you're spending about $" + total + " so far. A good rule for students is 50/30/20 - 50% needs, 30% wants, 20% savings. Track every dollar for a week and you'll find at least $50 you didn't need to spend.",
      anomalies: [],
      monthlySummary: { total, projected: total * 2, savings: (income || 0) - total * 2 },
      topTip: "Cook at home. Eating out is the #1 budget killer for students.",
      meta: result.meta,
    });
  }
  try {
    const parsed = JSON.parse(result.text);
    res.json({ ...parsed, meta: result.meta });
  } catch {
    res.json({ answer: result.text, anomalies: [], monthlySummary: null, topTip: "", meta: result.meta });
  }
});

// campus guide agent
app.post("/api/agent/guide", async (req, res) => {
  const { query, university, studentCountry } = req.body;
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
    return res.json({
      answer: "That's a great question. For most campus-related things, your international student office is the best first stop. They deal with this stuff daily and can give you advice specific to your situation. Also check your university's website for student resources.",
      actionSteps: ["Visit your international student office", "Check university website for resources", "Join student groups on social media"],
      importantNote: "Always keep your I-20 and passport documents safe and accessible.",
      relatedTopics: ["student services", "campus resources"],
      meta: result.meta,
    });
  }
  try {
    const parsed = JSON.parse(result.text);
    res.json({ ...parsed, meta: result.meta });
  } catch {
    res.json({ answer: result.text, actionSteps: [], importantNote: "", relatedTopics: [], meta: result.meta });
  }
});

// career agent
app.post("/api/agent/career", async (req, res) => {
  const { query, major, year, visaStatus } = req.body;
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
    return res.json({
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
    res.json({ ...parsed, meta: result.meta });
  } catch {
    res.json({ answer: result.text, nextSteps: [], companies: [], visaNote: "", marketOutlook: "", meta: result.meta });
  }
});

// chat agent (general purpose)
app.post("/api/agent/chat", async (req, res) => {
  const { messages, userProfile } = req.body;
  const history = (messages || []).map((m) => `${m.role}: ${m.content}`).join("\n");
  const prompt = `You are NestMind, an AI assistant built specifically for international students in the US.
You know about housing, budgeting, campus life, careers, visas, and daily survival as a student far from home.

Student profile: ${JSON.stringify(userProfile || {})}

Conversation so far:
${history}

Respond naturally. Be helpful, be real, be specific. If you don't know something, say so.
Keep responses concise but useful. No fluff.`;

  const result = await askBedrock(prompt, 512);
  if (!result.text) {
    res.json({
      response: "I'm having a moment. Try asking again in a sec.",
      meta: result.meta,
    });
  } else {
    res.json({ response: result.text, meta: result.meta });
  }
});

// metrics endpoint for datadog
app.get("/api/metrics", (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`NestMind backend running on port ${PORT}`);
});
