# AGENTS.md - NestMind

## Overview

NestMind is an AI agent hub built for international students navigating life in the US. Four specialized agents powered by AWS Bedrock (Claude 3 Sonnet) handle housing, budgeting, campus life, and career questions. Datadog provides full observability across the stack.

## Architecture

### Frontend (Next.js 14 App Router)
Single page app with client-side state. Onboarding flow collects student profile (name, university, country, major, year). Main interface is a chat-based UI with agent tabs in a sidebar. Each agent maintains its own conversation history. Metrics panel shows real-time query stats.

### Backend (Express.js)
REST API with 5 agent endpoints + health check + metrics. Each endpoint builds a context-aware prompt using the student's profile data and sends it to AWS Bedrock. Responses are parsed from JSON and enriched with metadata (response time, token count, source).

### AI Agents

**Housing Agent** (/api/agent/housing)
Answers questions about apartments, rent prices, lease terms, scams to avoid. Takes university and budget as context. Returns answer + tips + price range.

**Budget Agent** (/api/agent/budget)
Analyzes spending patterns, detects anomalies, gives saving advice. Takes income and expenses as context. Returns answer + anomalies + monthly summary + top tip.

**Campus Guide Agent** (/api/agent/guide)
Handles visa questions, daily life, banking, phone plans, campus resources. Takes university and home country as context. Returns answer + action steps + important notes + related topics.

**Career Agent** (/api/agent/career)
Job search advice, OPT/H1B guidance, resume help, company recommendations. Takes major, year, and visa status as context. Returns answer + next steps + companies + visa notes + market outlook.

### Observability (Datadog)

Frontend:
- RUM for page load performance, user interactions, errors
- Custom actions for agent queries, onboarding completion
- Session replay for debugging user issues

Backend:
- dd-trace for request tracing
- Custom metrics for agent response times, token usage, error rates
- Health endpoint for uptime monitoring

### State Management
- localStorage for user profile persistence
- React useState for chat messages, active agent, metrics
- No database needed for demo

## Endpoints

```
GET  /api/health          - server status
GET  /api/metrics         - uptime, memory usage
POST /api/agent/housing   - housing advice
POST /api/agent/budget    - budget analysis
POST /api/agent/guide     - campus life help
POST /api/agent/career    - career guidance
POST /api/agent/chat      - general conversation
```

## File Map

```
nestmind/
  frontend/
    src/
      app/
        page.tsx            - full app (onboarding + chat + agents + metrics)
        layout.tsx          - root layout with Inter font
        globals.css         - dark theme, CSS vars, animations
      lib/
        datadog.ts          - Datadog RUM wrapper
    next.config.mjs         - static export
    netlify.toml            - deploy config
  backend/
    server.js               - Express + Bedrock agents
    .env                    - credentials
    package.json            - dependencies
```

## Testing Checklist

1. Onboarding flow completes all 5 steps
2. Chat sends message and receives AI response
3. All 4 agents return relevant answers
4. Agent tabs switch and maintain separate histories
5. Metrics panel updates after each query
6. Suggested questions populate input on click
7. Logout clears profile and returns to onboarding
8. Fallback responses work when Bedrock is unavailable
9. Response metadata shows duration, source, tokens

## Deployment

Frontend: Static export to Netlify (npm run build outputs to /out)
Backend: Deploy to Render or Railway with env vars set
