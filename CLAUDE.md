# NestMind

AI-powered agent hub for international students in the US. Four specialized agents help with housing, budgeting, campus life, and career planning. Built with Next.js 14 frontend and Express backend, powered by AWS Bedrock (Claude 3 Sonnet) and monitored by Datadog.

## Tech Stack

Frontend: Next.js 14 (App Router), TypeScript, TailwindCSS, Lucide icons
Backend: Express.js, AWS Bedrock SDK, Datadog dd-trace
AI: Claude 3 Sonnet via AWS Bedrock
Monitoring: Datadog RUM (frontend) + dd-trace (backend)
State: localStorage for user profile persistence

## Project Structure

```
nestmind/
  frontend/
    src/app/page.tsx          - main app (onboarding + chat + agent tabs + metrics)
    src/app/layout.tsx        - root layout
    src/app/globals.css       - dark theme, custom CSS vars
    src/lib/datadog.ts        - Datadog RUM integration
    next.config.mjs           - static export config
    netlify.toml              - Netlify deploy config
  backend/
    server.js                 - Express server with 4 agent endpoints + health + metrics
    .env                      - AWS and Datadog credentials
```

## How the AI Agents Work

1. User picks an agent (Housing, Budget, Campus, Career)
2. Types a question in the chat
3. Frontend sends the question + user profile context to the backend
4. Backend builds a structured prompt with the user's context
5. Prompt goes to AWS Bedrock Claude 3 Sonnet
6. Model returns JSON with answer, tips, action steps, etc
7. Backend parses and sends back to frontend
8. Frontend displays the response with metadata (response time, token count, source)
9. Falls back to pre-built responses if Bedrock is unavailable

## Environment Variables

Backend (.env):
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION for Bedrock
- DD_API_KEY for Datadog backend tracing
- PORT (default 4000)

Frontend (.env.local):
- NEXT_PUBLIC_API_URL - backend URL
- NEXT_PUBLIC_DD_APPLICATION_ID, NEXT_PUBLIC_DD_CLIENT_TOKEN for Datadog RUM

## Running Locally

```
cd backend && npm install && npm start
cd frontend && npm install && npm run dev
```

Backend runs on port 4000, frontend on port 3000.

## Design Decisions

- Dark theme with #e63946 red accent, matching my other projects
- No database needed for demo, localStorage keeps user profile
- Each agent has its own chat history so conversations don't mix
- Metrics panel in sidebar shows real-time query count and avg response time
- Fallback responses ensure the app works even without AWS credentials
- Static export for frontend means zero server-side issues on Netlify
