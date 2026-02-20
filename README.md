# NestMind

AI-powered platform for international students in the US. Built with AWS Bedrock and Next.js.

I built this because I know what it's like to land in a new country and figure everything out from scratch. Where to live, what to eat, how to get an SSN, which companies sponsor H1B. NestMind is the friend every international student needs on day one.

Live: https://nestmind-ai.netlify.app


## Architecture

```
                    User (Browser)
                         |
                  +------+------+
                  |  Netlify    |
                  |  CDN/Edge   |
                  +------+------+
                  |             |
           Static Assets   Serverless Functions
           (Next.js SSG)   (Next.js API Routes)
                  |             |
           React Frontend  /api/agent/chat
           (page.tsx)      (route.ts)
                  |             |
                  |      +------+------+
                  |      |             |
                  |  buildPrompt()  askBedrock()
                  |  (6 AI agents)  (bedrock.ts)
                  |      |             |
                  |      +------+------+
                  |             |
                  |      AWS Bedrock
                  |      Claude 3 Sonnet
                  |      (us-west-2)
                  |             |
                  +------+------+
                         |
                  Datadog RUM
                  (monitoring)
```


## Features

8 tabs, each with a specific purpose:

Buddy - personal AI friend that understands your situation as an international student. Emotional support, homesickness, stress, general advice.

Housing - AI agent that gives specific apartment recommendations near your campus with Google Maps links, rent ranges, scam warnings, and lease tips for students with no US credit history.

Food - AI agent for restaurant recommendations near campus, grocery stores, cooking tips, meal prep on a budget. Knows your home country and suggests ethnic food spots.

Campus - visa and immigration expert. SSN, OPT, CPT, I-20, SEVIS, EAD. Banking setup, phone plans, daily life. Only gives verified information.

Career - job search, H1B sponsorship data, LinkedIn optimization, referral templates, salary ranges, resume tips for international students.

Deals - 18 clickable student discount cards. Click any card and you go directly to the signup page. Spotify, Amazon Prime, GitHub Student Pack, JetBrains, Notion, Figma, and more. Filter by category, toggle FREE only.

Reels - dynamic YouTube video search based on YOUR university. Videos are organized by category (campus life, visa, food, housing, academics, daily life). Each card links to a YouTube search for your specific university.

AI Tools - 12 trending AI tools every student should know. ChatGPT, Claude, Perplexity, Gamma, GitHub Copilot, and more.

Every AI agent stays in their lane. Ask the Buddy about apartments and it redirects you to Housing. Ask Career about food and it sends you to Food. No agent gives information outside their domain.


## Tech Stack

Frontend:
- Next.js 14 (App Router, TypeScript)
- React 18 (hooks, client-side state)
- Lucide React (icons)
- Custom CSS variables (white + green theme)

Backend (Serverless):
- Next.js API Routes (Netlify Functions)
- AWS SDK (@aws-sdk/client-bedrock-runtime)
- Claude 3 Sonnet model (anthropic.claude-3-sonnet-20240229-v1:0)

Infrastructure:
- Netlify (hosting, CDN, serverless)
- AWS Bedrock (AI inference, us-west-2)
- Datadog RUM (real user monitoring, performance tracking)


## How It Works

1. Student fills out a quick onboarding form (name, university, country, major, year)
2. Profile is stored in localStorage and sent with every AI request
3. When a student sends a message, the frontend POSTs to /api/agent/chat
4. The API route builds an agent-specific prompt with the student's full context
5. The prompt is sent to AWS Bedrock (Claude 3 Sonnet) via InvokeModel API
6. Response comes back with the AI text + metadata (latency, tokens, source)
7. Frontend renders the response with clickable links (URLs are auto-detected)
8. Datadog RUM tracks every interaction: messages sent, response times, agent switches, errors


## Running Locally

```
cd frontend
npm install
npm run dev
```

Create a .env.local file:
```
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-west-2
```

The app needs valid AWS credentials with Bedrock access to work.


## Project Structure

```
nestmind/
  frontend/
    src/
      app/
        page.tsx          - entire frontend UI (all components)
        globals.css       - theme (white + green CSS variables)
        layout.tsx        - root layout
        api/
          agent/
            chat/
              route.ts    - all 6 AI agent prompts + Bedrock call
      lib/
        bedrock.ts        - AWS Bedrock client + askBedrock()
        datadog.ts        - Datadog RUM init + tracking
    netlify.toml          - deployment config
    package.json
  ARCHITECTURE.md         - detailed architecture docs
  README.md               - this file
```


## Deployment

Hosted on Netlify. The Next.js app is built and deployed as static assets + serverless functions. API routes become Netlify Functions automatically.

```
cd frontend
npx netlify-cli deploy --prod
```
