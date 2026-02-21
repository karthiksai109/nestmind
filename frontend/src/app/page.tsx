"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Briefcase, Send, Menu, X, Zap, Activity, MessageCircle, Tag, Sparkles, ExternalLink, Bot, UtensilsCrossed } from "lucide-react";
import { initDatadog, trackAction, setUser, trackTiming } from "@/lib/datadog";

type Agent = "buddy" | "housing" | "food" | "campus" | "career" | "deals" | "tools";
type Message = { role: "user" | "agent"; content: string; agent?: Agent; meta?: Record<string, unknown> };

const STUDENT_DEALS = [
  { name: "Spotify Student", price: "$5.99/mo", desc: "includes Hulu + Showtime", url: "https://www.spotify.com/us/student/", tag: "entertainment", free: false },
  { name: "Amazon Prime Student", price: "FREE 6 months", desc: "then $7.49/mo, free shipping + Prime Video", url: "https://www.amazon.com/amazonprime?planOptimizationId=WLPStudentMonthlyElig498", tag: "shopping", free: true },
  { name: "Apple Music Student", price: "$5.99/mo", desc: "full Apple Music + Apple TV+", url: "https://music.apple.com/subscribe/student", tag: "entertainment", free: false },
  { name: "GitHub Student Pack", price: "FREE", desc: "tons of dev tools, domains, credits", url: "https://education.github.com/pack", tag: "dev tools", free: true },
  { name: "Notion", price: "FREE", desc: "notes, wikis, project management", url: "https://www.notion.so/product/notion-for-education", tag: "productivity", free: true },
  { name: "Figma", price: "FREE", desc: "design and prototyping tool", url: "https://www.figma.com/education/", tag: "dev tools", free: true },
  { name: "JetBrains", price: "FREE", desc: "IntelliJ, PyCharm, WebStorm, all IDEs", url: "https://www.jetbrains.com/community/education/", tag: "dev tools", free: true },
  { name: "Microsoft 365", price: "FREE", desc: "Word, Excel, PowerPoint via .edu email", url: "https://www.microsoft.com/en-us/education/products/office", tag: "productivity", free: true },
  { name: "Adobe Creative Cloud", price: "~$20/mo", desc: "Photoshop, Premiere, Illustrator", url: "https://www.adobe.com/creativecloud/buy/students.html", tag: "dev tools", free: false },
  { name: "Canva Pro", price: "FREE", desc: "design anything, templates, brand kit", url: "https://www.canva.com/education/", tag: "productivity", free: true },
  { name: "YouTube Premium", price: "$7.99/mo", desc: "ad-free YouTube + YouTube Music", url: "https://www.youtube.com/premium/student", tag: "entertainment", free: false },
  { name: "Samsung Education", price: "up to 30% off", desc: "laptops, phones, tablets", url: "https://www.samsung.com/us/shop/discount-program/education/", tag: "shopping", free: false },
  { name: "Apple Education", price: "save $100-200", desc: "MacBooks, iPads, AirPods", url: "https://www.apple.com/shop/education-pricing", tag: "shopping", free: false },
  { name: "Coursera", price: "FREE courses", desc: "learn anything with .edu email", url: "https://www.coursera.org/for-university-and-college-students", tag: "learning", free: true },
  { name: "Headspace", price: "$9.99/year", desc: "meditation and mental health", url: "https://www.headspace.com/studentplan", tag: "health", free: false },
  { name: "UNiDAYS", price: "FREE", desc: "hundreds of verified student discounts", url: "https://www.myunidays.com", tag: "shopping", free: true },
  { name: "Student Beans", price: "FREE", desc: "more verified student deals", url: "https://www.studentbeans.com", tag: "shopping", free: true },
  { name: "Grammarly Premium", price: "FREE", desc: "writing assistant for essays and emails", url: "https://www.grammarly.com/edu", tag: "productivity", free: true },
];


const AGENTS: Record<Agent, { label: string; icon: typeof MessageCircle; color: string; placeholder: string; desc: string }> = {
  buddy: {
    label: "Buddy",
    icon: MessageCircle,
    color: "#2d9d6f",
    placeholder: "how are you doing today?",
    desc: "your personal friend who gets it",
  },
  housing: {
    label: "Housing",
    icon: MapPin,
    color: "#1a8a5c",
    placeholder: "find me apartments near campus",
    desc: "apartments, rent, roommates near your campus",
  },
  food: {
    label: "Food",
    icon: UtensilsCrossed,
    color: "#e67e22",
    placeholder: "best indian restaurants near campus",
    desc: "restaurants, groceries, cooking tips near campus",
  },
  campus: {
    label: "Campus",
    icon: Zap,
    color: "#d4a017",
    placeholder: "how do i get an SSN?",
    desc: "visa, immigration, daily life setup",
  },
  career: {
    label: "Career",
    icon: Briefcase,
    color: "#4f6df0",
    placeholder: "which companies sponsor H1B?",
    desc: "jobs, H1B, linkedin, OPT help",
  },
  deals: {
    label: "Deals",
    icon: Tag,
    color: "#d94f8a",
    placeholder: "",
    desc: "click and claim student discounts",
  },
  tools: {
    label: "AI Tools",
    icon: Bot,
    color: "#1ba8c4",
    placeholder: "",
    desc: "trending AI tools every student needs",
  },
};

const TRENDING_TOOLS = [
  { name: "ChatGPT", desc: "essays, research, coding help", url: "https://chat.openai.com", tag: "writing" },
  { name: "Claude", desc: "long docs, analysis, reasoning", url: "https://claude.ai", tag: "research" },
  { name: "Perplexity", desc: "search with sources, citations", url: "https://perplexity.ai", tag: "search" },
  { name: "Gamma", desc: "presentations in seconds", url: "https://gamma.app", tag: "slides" },
  { name: "Notion AI", desc: "notes, planning, summaries", url: "https://notion.so", tag: "productivity" },
  { name: "Grammarly", desc: "fix your english writing", url: "https://grammarly.com", tag: "writing" },
  { name: "GitHub Copilot", desc: "free for students, codes with you", url: "https://github.com/features/copilot", tag: "coding" },
  { name: "Otter.ai", desc: "record and transcribe lectures", url: "https://otter.ai", tag: "lectures" },
  { name: "Quillbot", desc: "paraphrase and rewrite", url: "https://quillbot.com", tag: "writing" },
  { name: "Canva AI", desc: "design anything, free for students", url: "https://canva.com", tag: "design" },
  { name: "Consensus", desc: "search academic papers with AI", url: "https://consensus.app", tag: "research" },
  { name: "Mathway", desc: "solve math step by step", url: "https://mathway.com", tag: "math" },
];

interface UserProfile {
  name: string;
  university: string;
  country: string;
  major: string;
  year: string;
}

function LinkifyText({ text, isUser }: { text: string; isUser: boolean }) {
  const urlRegex = /(https?:\/\/[^\s<>"'\]]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) => {
        const isUrl = /^https?:\/\//.test(part);
        const cleanUrl = isUrl ? part.replace(/[.,;:!?)]+$/, "") : part;
        const trailing = isUrl ? part.slice(cleanUrl.length) : "";
        return isUrl ? (
          <span key={i}>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: isUser ? "#fff" : "var(--accent)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
                wordBreak: "break-all",
              }}
            >
              {cleanUrl.length > 60 ? "open link" : cleanUrl}
            </a>
            {trailing}
          </span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "12px 16px", alignItems: "center" }}>
      <div className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
      <div className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
      <div className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
    </div>
  );
}

function ToolsPanel() {
  const [filter, setFilter] = useState("all");
  const tags = ["all", ...Array.from(new Set(TRENDING_TOOLS.map((t) => t.tag)))];
  const filtered = filter === "all" ? TRENDING_TOOLS : TRENDING_TOOLS.filter((t) => t.tag === filter);

  return (
    <div style={{ padding: 20, overflow: "auto", height: "100%" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Sparkles size={20} color="var(--cyan)" />
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>trending ai tools for students</h2>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.5 }}>
          these are the tools every student should know about. most are free or have student plans.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: "none",
                background: filter === t ? "var(--accent)" : "var(--bg-card)",
                color: filter === t ? "white" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {filtered.map((tool) => (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover-lift"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "14px 16px",
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{tool.name}</span>
                <ExternalLink size={12} color="var(--text-muted)" />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>{tool.desc}</p>
              <span style={{
                display: "inline-block",
                marginTop: 8,
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 10,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                fontWeight: 500,
              }}>
                {tool.tag}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function DealsPanel() {
  const [filter, setFilter] = useState("all");
  const [showFree, setShowFree] = useState(false);
  const tags = ["all", ...Array.from(new Set(STUDENT_DEALS.map((d) => d.tag)))];
  const filtered = STUDENT_DEALS.filter((d) => {
    if (showFree && !d.free) return false;
    if (filter !== "all" && d.tag !== filter) return false;
    return true;
  });

  return (
    <div style={{ padding: 20, overflow: "auto", height: "100%" }}>
      <div style={{ maxWidth: 750, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Tag size={20} color="var(--pink)" />
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>student deals</h2>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
          click any deal to go directly to the signup page. no middleman.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          <button
            onClick={() => setShowFree(!showFree)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: "none",
              background: showFree ? "var(--green)" : "var(--bg-card)",
              color: showFree ? "white" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            FREE only
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: "none",
                background: filter === t ? "var(--accent)" : "var(--bg-card)",
                color: filter === t ? "white" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {filtered.map((deal) => (
            <a
              key={deal.name}
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover-lift"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "14px 16px",
                textDecoration: "none",
                color: "inherit",
                display: "block",
                position: "relative",
              }}
            >
              {deal.free && (
                <span style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  fontSize: 9,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: "var(--green)",
                  color: "white",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  free
                </span>
              )}
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{deal.name}</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)", margin: "4px 0" }}>{deal.price}</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>{deal.desc}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                <span style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  fontWeight: 500,
                }}>
                  {deal.tag}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
                  claim <ExternalLink size={9} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function OnboardingScreen({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [country, setCountry] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");

  const steps = [
    {
      title: "what should i call you?",
      sub: "",
      field: <input value={name} onChange={(e) => setName(e.target.value)} placeholder="your name" style={{ width: "100%" }} autoFocus />,
      valid: name.trim().length > 0,
    },
    {
      title: "where are you studying?",
      sub: "this helps me find housing, resources, and info specific to your campus",
      field: <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. University of Dayton" style={{ width: "100%" }} autoFocus />,
      valid: university.trim().length > 0,
    },
    {
      title: "where are you from?",
      sub: "",
      field: <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="your country" style={{ width: "100%" }} autoFocus />,
      valid: country.trim().length > 0,
    },
    {
      title: "what are you studying?",
      sub: "",
      field: <input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="your major" style={{ width: "100%" }} autoFocus />,
      valid: major.trim().length > 0,
    },
    {
      title: "what year?",
      sub: "",
      field: (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Freshman", "Sophomore", "Junior", "Senior", "Masters", "PhD"].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                padding: "9px 22px",
                borderRadius: 20,
                border: year === y ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: year === y ? "var(--accent)" : "var(--bg-card)",
                color: year === y ? "white" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: year === y ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {y}
            </button>
          ))}
        </div>
      ),
      valid: year.length > 0,
    },
  ];

  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete({ name, university, country, major, year });
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 460, width: "100%" }} className="animate-in">
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <div className="glow-pulse" style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} color="white" />
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: -0.5 }}>nestmind</span>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>ai buddy for international students</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 3, marginBottom: 28 }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: 10,
                  background: i < step ? "var(--accent)" : i === step ? "var(--accent-hover)" : "var(--border)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
            {step + 1} of {steps.length}
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.2, letterSpacing: -0.3 }}>
            {current.title}
          </h1>
          {current.sub && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.5 }}>{current.sub}</p>
          )}
          {!current.sub && <div style={{ marginBottom: 16 }} />}
          {current.field}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!current.valid}
            style={{
              padding: "10px 30px",
              borderRadius: 10,
              border: "none",
              background: current.valid ? "var(--accent)" : "var(--bg-card)",
              color: current.valid ? "white" : "var(--text-muted)",
              cursor: current.valid ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 700,
              transition: "all 0.15s",
            }}
          >
            {step === steps.length - 1 ? "let's go" : "next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NestMindApp() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeAgent, setActiveAgent] = useState<Agent>("buddy");
  const [messages, setMessages] = useState<Record<Agent, Message[]>>({
    buddy: [], housing: [], food: [], campus: [], career: [], deals: [], tools: [],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [metrics, setMetrics] = useState({ totalQueries: 0, avgResponse: 0, agentCalls: { buddy: 0, housing: 0, food: 0, campus: 0, career: 0, deals: 0, tools: 0 } });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initDatadog();
    const saved = localStorage.getItem("nestmind_profile_v3");
    if (saved) {
      const p = JSON.parse(saved);
      setProfile(p);
      setUser(p.name, p.name);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleOnboard = (p: UserProfile) => {
    setProfile(p);
    localStorage.setItem("nestmind_profile_v3", JSON.stringify(p));
    setUser(p.name, p.name);
    trackAction("onboarding_complete", { university: p.university, country: p.country });
  };

  const sendMessage = async () => {
    const nonChatTabs: Agent[] = ["tools", "deals"];
    if (!input.trim() || loading || !profile || nonChatTabs.includes(activeAgent)) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const agent = activeAgent;

    setMessages((prev) => ({ ...prev, [agent]: [...prev[agent], userMsg] }));
    setInput("");
    setLoading(true);
    trackAction("message_sent", { agent, query_length: input.trim().length });

    const start = Date.now();
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input.trim(),
          agent,
          profile: {
            name: profile.name,
            university: profile.university,
            country: profile.country,
            major: profile.major,
            year: profile.year,
          },
          history: messages[agent].slice(-8).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
        }),
      });

      const data = await res.json();
      const duration = Date.now() - start;
      trackTiming("agent_response", duration);
      trackAction("agent_response", { agent, source: data.meta?.source, duration_ms: duration });

      const agentMsg: Message = {
        role: "agent",
        content: data.response || data.answer || "...",
        agent,
        meta: data.meta,
      };
      setMessages((prev) => ({ ...prev, [agent]: [...prev[agent], agentMsg] }));

      setMetrics((prev) => ({
        totalQueries: prev.totalQueries + 1,
        avgResponse: data.meta?.duration_ms
          ? Math.round((prev.avgResponse * prev.totalQueries + data.meta.duration_ms) / (prev.totalQueries + 1))
          : prev.avgResponse,
        agentCalls: { ...prev.agentCalls, [agent]: ((prev.agentCalls as Record<string, number>)[agent] || 0) + 1 },
      }));
    } catch {
      setMessages((prev) => ({
        ...prev,
        [agent]: [...prev[agent], { role: "agent" as const, content: "connection issue, try again in a sec", agent }],
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <OnboardingScreen onComplete={handleOnboard} />;

  const agentConfig = AGENTS[activeAgent];
  const currentMessages = messages[activeAgent];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div
        style={{
          width: sidebarOpen ? 250 : 0,
          minWidth: sidebarOpen ? 250 : 0,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.2s",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={13} color="white" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>nestmind</span>
          </div>
          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
            {profile.university}
          </p>
        </div>

        <div style={{ padding: "10px 8px", flex: 1, overflow: "auto" }}>
          <p style={{ fontSize: 10, color: "var(--text-muted)", padding: "4px 8px", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>
            agents
          </p>
          {(Object.keys(AGENTS) as Agent[]).map((key) => {
            const a = AGENTS[key];
            const Icon = a.icon;
            const isActive = activeAgent === key;
            const isNonChat = key === "tools" || key === "deals";
            const msgCount = isNonChat ? 0 : messages[key].length;
            return (
              <button
                key={key}
                onClick={() => { setActiveAgent(key); trackAction("agent_switch", { agent: key }); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: isActive ? "var(--bg-hover)" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  textAlign: "left",
                  transition: "all 0.12s",
                  marginBottom: 1,
                  borderLeft: isActive ? `2px solid ${a.color}` : "2px solid transparent",
                }}
              >
                <Icon size={15} color={isActive ? a.color : "var(--text-muted)"} />
                <span style={{ flex: 1 }}>{a.label}</span>
                {msgCount > 0 && (
                  <span style={{ fontSize: 9, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "2px 6px", borderRadius: 10 }}>
                    {msgCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Activity size={11} color="var(--accent)" />
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>datadog metrics</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{metrics.totalQueries}</p>
              <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>queries</p>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{metrics.avgResponse}<span style={{ fontSize: 10, fontWeight: 400 }}>ms</span></p>
              <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>avg latency</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "white",
            }}
          >
            {profile.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</p>
            <p style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.major} | {profile.year}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("nestmind_profile_v3");
              setProfile(null);
              setActiveAgent("buddy");
              setMessages({ buddy: [], housing: [], food: [], campus: [], career: [], deals: [], tools: [] });
              setMetrics({ totalQueries: 0, avgResponse: 0, agentCalls: { buddy: 0, housing: 0, food: 0, campus: 0, career: 0, deals: 0, tools: 0 } });
              setInput("");
              trackAction("logout");
            }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 10 }}
          >
            logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--bg-secondary)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: agentConfig.color, boxShadow: `0 0 8px ${agentConfig.color}40` }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700 }}>{agentConfig.label}</p>
            <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{agentConfig.desc}</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: 10, color: "var(--text-muted)" }}>
            {(metrics.agentCalls as Record<string, number>)[activeAgent] > 0 && <span>{(metrics.agentCalls as Record<string, number>)[activeAgent]} calls</span>}
            <span style={{ color: "var(--green)" }}>aws bedrock</span>
            <span style={{ color: "var(--pink)" }}>datadog</span>
          </div>
        </div>

        {activeAgent === "tools" ? (
          <ToolsPanel />
        ) : activeAgent === "deals" ? (
          <DealsPanel />
        ) : (
          <>
            <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 0" }}>
              {currentMessages.length === 0 && (
                <div style={{ textAlign: "center", paddingTop: 70 }} className="animate-in">
                  <div
                    className="glow-pulse"
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: `${agentConfig.color}18`,
                      border: `1px solid ${agentConfig.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}
                  >
                    {(() => {
                      const Icon = agentConfig.icon;
                      return <Icon size={22} color={agentConfig.color} />;
                    })()}
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: -0.3 }}>{agentConfig.label}</h2>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
                    {agentConfig.desc}. ask me anything, i got you.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 24 }}>
                    {[agentConfig.placeholder, "tell me something useful", "what should i know?"].filter(Boolean).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(q)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 20,
                          border: "1px solid var(--border)",
                          background: "var(--bg-card)",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          fontSize: 12,
                          transition: "all 0.15s",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentMessages.map((msg, i) => (
                <div
                  key={i}
                  className="animate-in"
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "10px 16px",
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: msg.role === "user" ? "var(--accent)" : "var(--bg-card)",
                      border: msg.role === "user" ? "none" : "1px solid var(--border)",
                      color: msg.role === "user" ? "white" : "var(--text-primary)",
                      fontSize: 13,
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    <LinkifyText text={msg.content} isUser={msg.role === "user"} />
                    {msg.meta && (
                      <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${msg.role === "user" ? "rgba(255,255,255,0.12)" : "var(--border)"}`, fontSize: 10, color: msg.role === "user" ? "rgba(255,255,255,0.5)" : "var(--text-muted)", display: "flex", gap: 10 }}>
                        {msg.meta.duration_ms ? <span>{String(msg.meta.duration_ms)}ms</span> : null}
                        {msg.meta.source ? <span style={{ color: msg.meta.source === "bedrock" ? "var(--green)" : "var(--accent)" }}>{String(msg.meta.source)}</span> : null}
                        {msg.meta.tokens_used ? <span>{String(msg.meta.tokens_used)} tokens</span> : null}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px 14px 14px 4px" }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", gap: 8, maxWidth: 800, margin: "0 auto" }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={agentConfig.placeholder}
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 12 }}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: "none",
                    background: input.trim() ? "var(--accent)" : "var(--bg-card)",
                    color: input.trim() ? "white" : "var(--text-muted)",
                    cursor: input.trim() ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
              <p style={{ textAlign: "center", fontSize: 9, color: "var(--text-muted)", marginTop: 8, letterSpacing: 0.5 }}>
                powered by aws bedrock (claude 3 sonnet) | monitored by datadog
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
