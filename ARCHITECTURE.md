# NestMind Architecture

```
                         https://nestmind-ai.netlify.app
                                     |
                              +--------------+
                              |   Netlify    |
                              |   CDN/Edge   |
                              +--------------+
                              |              |
                     Static Assets    Serverless Functions
                     (Next.js SSG)    (Next.js API Routes)
                              |              |
                    +--------+        +------+-------+
                    |                 |              |
              React Frontend    /api/agent/chat   Other API
              (page.tsx)        (route.ts)        Routes
                    |                 |
                    |          +------+------+
                    |          |             |
                    |    buildPrompt()   askBedrock()
                    |    (6 agents)     (bedrock.ts)
                    |          |             |
                    |          |      +------+------+
                    |          |      |             |
                    |          |   AWS SDK    BedrockRuntime
                    |          |      |        Client
                    |          |      |             |
                    |          +------+------+------+
                    |                 |
                    |          +------+------+
                    |          |             |
                    |      AWS Bedrock   Claude 3
                    |      (us-west-2)   Sonnet Model
                    |          |
                    |          v
                    |    AI Response
                    |    (JSON + meta)
                    |          |
                    +----------+
                    |
             +------+------+
             |             |
        Datadog RUM    Local State
        (tracking)     (React hooks)
             |
             v
      Datadog Dashboard
      (metrics, sessions,
       performance)
```


## Tech Stack

Frontend:
  Next.js 14 (App Router, TypeScript)
  React 18 (hooks, state management)
  Lucide React (icons)
  Custom CSS variables (dark theme, #e63946 accent)

Backend (Serverless):
  Next.js API Routes (deployed as Netlify Functions)
  @aws-sdk/client-bedrock-runtime (AWS Bedrock SDK)
  Claude 3 Sonnet (anthropic.claude-3-sonnet-20240229-v1:0)

Infrastructure:
  Netlify (hosting, CDN, serverless functions)
  AWS Bedrock (AI inference, us-west-2 region)
  Datadog RUM (real user monitoring, event tracking)


## Request Flow

1. User types message in chat UI
2. React sends POST to /api/agent/chat
3. API route builds agent-specific prompt with user profile context
4. askBedrock() calls AWS Bedrock InvokeModel API
5. Claude 3 Sonnet processes prompt and returns response
6. API route returns JSON with response text + metadata (latency, tokens, source)
7. Frontend renders response with clickable links
8. Datadog RUM tracks: message sent, response time, agent used, errors


## Agent Architecture

Each agent has strict domain boundaries. Off-topic questions get redirected.

  Buddy     - personal chat, emotional support, homesickness
  Housing   - apartments, rent, roommates, leases near campus
  Food      - restaurants, groceries, cooking, meal prep near campus
  Campus    - visa/immigration (SSN, OPT, CPT), daily life setup
  Career    - jobs, H1B, LinkedIn, OPT work authorization
  Deals     - static panel, 18 clickable student discount cards with direct signup URLs
  Reels     - static panel, 16 curated YouTube videos with thumbnails by category
  AI Tools  - static panel, 12 trending AI tools for students


## Key Files

  page.tsx           - entire frontend (1010 lines)
  route.ts           - all AI agent prompts + Bedrock call
  bedrock.ts         - AWS Bedrock client init + askBedrock()
  datadog.ts         - Datadog RUM init + tracking helpers
  globals.css        - custom dark theme CSS variables
  netlify.toml       - deployment config


## Datadog Integration

  initDatadog()      - initializes RUM SDK on app load
  setUser()          - sets user context after onboarding
  trackAction()      - fires on: onboarding, agent switch, message send, logout
  trackTiming()      - records AI response latency per query
  trackError()       - logs Bedrock failures

Metrics visible in sidebar: total queries, average latency (ms)


## AWS Bedrock Integration

  Region:            us-west-2
  Model:             anthropic.claude-3-sonnet-20240229-v1:0
  Max tokens:        2000 per response
  Auth:              IAM Access Key + Secret Key (server-side only)
  SDK:               @aws-sdk/client-bedrock-runtime
  API:               InvokeModelCommand with Messages API format
