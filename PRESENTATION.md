# NestMind - Presentation Guide

## The Story (how to present it)

Start with the problem:

"When I came to the US as an international student, I had to figure out everything on my own. Where to live, what to eat, how to get an SSN, which companies sponsor H1B, where to find student discounts. I spent weeks on Reddit, YouTube, and asking random people. Every international student goes through this. So I built NestMind - an AI platform that's like having a friend who already figured it all out."

Then show the app:

"You tell it your university, your country, your major, and it personalizes everything for you. It has 8 different agents, each specialized in one thing. The housing agent gives you apartments with Google Maps links. The food agent knows restaurants near your campus. The career agent knows which companies sponsor H1B for your major. And every agent stays in their lane - if you ask the food agent about visas, it tells you to switch to the campus tab."

Then talk about the tech:

"Under the hood, it's Next.js 14 with TypeScript on the frontend. The AI runs on AWS Bedrock using Claude 3 Sonnet. Every API call goes through a serverless function on Netlify. I'm using Datadog RUM to monitor real user sessions, track response times, and catch errors. You can see the metrics live in the sidebar."

Then show the non-AI features:

"Not everything needs AI. The Deals tab has 18 student discounts - click any card and you go straight to the signup page. No chatbot, no middleman. The Reels tab searches YouTube for videos specific to YOUR university. And the AI Tools tab shows trending tools every student should know."


## Demo Flow (what to click in order)

1. Open https://nestmind-ai.netlify.app
2. Fill onboarding: your name, "University of Dayton", "India", "Computer Science", "Masters"
3. Start with Buddy - say "hey i just moved here and feeling homesick"
4. Switch to Housing - ask "find me apartments near campus under $800"
   (show the Google Maps links in the response)
5. Switch to Food - ask "best indian restaurants near campus"
6. Switch to Campus - ask "how do i get an SSN"
7. Try asking Campus about food - show it redirects you to Food tab
8. Click Deals tab - show the clickable cards, filter by FREE
9. Click Reels tab - show university-specific YouTube searches
10. Click AI Tools tab - show trending tools
11. Point out the Datadog metrics in the sidebar (queries count, avg latency)


## Tech Stack (what to say when asked)

Frontend:
  Next.js 14 with App Router and TypeScript
  React 18 with hooks for state management
  Lucide React for icons
  Custom CSS variables for theming (white + green)

Backend:
  Next.js API Routes deployed as Netlify serverless functions
  AWS SDK for JavaScript v3 (@aws-sdk/client-bedrock-runtime)
  Claude 3 Sonnet model on AWS Bedrock (us-west-2)

Infrastructure:
  Netlify for hosting, CDN, and serverless functions
  AWS Bedrock for AI inference
  Datadog RUM for real user monitoring and performance tracking


## How AWS Bedrock Works (if they ask)

"I'm using AWS Bedrock which is Amazon's managed AI service. It gives you access to foundation models like Claude, Llama, and others without managing any infrastructure. I'm using Claude 3 Sonnet specifically because it's fast and accurate for conversational AI."

"The flow is: user sends a message, my API route builds a prompt with their full profile context, sends it to Bedrock using the InvokeModel API, and gets back the response. The prompt engineering is the key part - each agent has a completely different system prompt with specific rules, domain boundaries, and the student's university/country/major baked in."

"Authentication is through IAM access keys stored server-side only. The keys never touch the browser."


## How Datadog Works (if they ask)

"I integrated Datadog RUM which stands for Real User Monitoring. It tracks actual user sessions in the browser. Every time someone sends a message, switches agents, completes onboarding, or gets an error, Datadog captures it."

"I'm tracking custom metrics like agent response time, which agent gets used most, query volume, and errors. You can see the live metrics in the sidebar - total queries and average latency. In the Datadog dashboard you can see session replays, performance waterfall charts, and error tracking."


## Questions They Might Ask

Q: Why not use OpenAI?
A: "AWS Bedrock gives me access to multiple models without vendor lock-in. I can switch between Claude, Llama, or Titan without changing my infrastructure. Plus it integrates natively with AWS IAM for security."

Q: How do you handle rate limiting?
A: "Bedrock has built-in throttling. On the frontend I disable the send button while waiting for a response so users can't spam requests."

Q: Why serverless?
A: "No server to manage, scales automatically, and Netlify handles the deployment pipeline. My API routes become serverless functions automatically."

Q: How accurate is the AI?
A: "Each agent has strict prompt engineering with specific rules. The housing agent is told to include Google Maps links. The campus agent is told to always say 'check with your DSO' for visa questions. I never let the AI make up information - if it doesn't know something, it says so."

Q: What's the cost?
A: "Bedrock charges per token. Claude 3 Sonnet is about $3 per million input tokens and $15 per million output tokens. For a student app with moderate usage, that's maybe $5-10/month. Netlify free tier handles the hosting. Datadog has a free tier for RUM."
