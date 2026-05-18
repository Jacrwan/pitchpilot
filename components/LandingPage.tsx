"use client";

import { useEffect, useRef, useState } from "react";
import { CtaButton } from "@/components/CtaButton";

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function useCountUp(target: number, trigger: boolean, duration = 700) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      setCount(Math.round(t * target));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [trigger, target, duration]);
  return count;
}

// ── Gradient background ───────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function blendColor(c1: [number, number, number], c2: [number, number, number], t: number) {
  return `rgb(${Math.round(lerp(c1[0], c2[0], t))},${Math.round(lerp(c1[1], c2[1], t))},${Math.round(lerp(c1[2], c2[2], t))})`;
}

const NAVY:   [number, number, number] = [10, 10, 20];
const PURPLE: [number, number, number] = [20, 8, 40];
const BLACK:  [number, number, number] = [6, 6, 10];

function GradientBackground() {
  const [color, setColor] = useState(`rgb(${NAVY.join(",")})`);
  useEffect(() => {
    function onScroll() {
      const progress = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
      const c = progress < 0.5
        ? blendColor(NAVY, PURPLE, progress * 2)
        : blendColor(PURPLE, BLACK, (progress - 0.5) * 2);
      setColor(c);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundColor: color,
        transition: "background-color 0.4s ease",
      }}
    />
  );
}

// ── Animated reveal ───────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  style,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(22px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Benefit card with left border + hover glow ────────────────────────────────

function BenefitCard({ title, body }: { title: string; body: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 220px",
        padding: "1.5rem 1.5rem 1.5rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
        backgroundColor: "#111118",
        borderRadius: "0.75rem",
        borderLeft: "3px solid #8b5cf6",
        boxShadow: hovered ? "0 0 28px rgba(139, 92, 246, 0.18)" : "none",
        transition: "box-shadow 0.25s ease",
      }}
    >
      <h3 style={{ fontWeight: 600, color: "#ffffff", margin: 0, fontSize: "0.9375rem" }}>
        {title}
      </h3>
      <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.7, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}

// ── How it works (count-up step numbers) ─────────────────────────────────────

function HowItWorks() {
  const [ref, inView] = useInView(0.2);
  const n1 = useCountUp(1, inView, 400);
  const n2 = useCountUp(2, inView, 600);
  const n3 = useCountUp(3, inView, 800);

  const steps = [
    { n: n1, title: "Describe your startup", body: "Paste in what you're building and your latest update. The more detail, the better the output.", delay: 0 },
    { n: n2, title: "Find your communities", body: "Pitchpilot scans relevant subreddits and communities, reads their rules, and picks the best fit for your post.", delay: 100 },
    { n: n3, title: "Approve and post", body: "Review the draft, make any edits, and post with one click. Reply to comments the same way.", delay: 200 },
  ];

  return (
    <section style={{ backgroundColor: "#111118", padding: "6rem 1.5rem" }}>
      <div ref={ref} style={{ maxWidth: "960px", margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, color: "#ffffff", marginBottom: "3rem" }}>
            How it works
          </h2>
        </Reveal>
        <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
          {steps.map(({ n, title, body, delay }) => (
            <Reveal
              key={title}
              delay={delay}
              style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <span style={{ fontSize: "3.5rem", fontWeight: 700, lineHeight: 1, color: "#2a2a3a" }}>
                {n}
              </span>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "#ffffff", margin: 0 }}>{title}</h3>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <>
      <GradientBackground />
      <main style={{ display: "flex", flexDirection: "column" }}>

        {/* Hero */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "7rem 1.5rem 6rem", textAlign: "center" }}>
          <Reveal>
            <h1 style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#ffffff", marginBottom: "1.5rem" }}>
              Your startup, in front of
              <br />
              the{" "}
              <span style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                right people.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p style={{ maxWidth: "520px", fontSize: "1.125rem", color: "#94a3b8", lineHeight: 1.7, marginBottom: "2.5rem" }}>
              Pitchpilot finds the right Reddit communities for your startup, drafts
              native posts, and lets you approve before anything goes live.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <CtaButton />
          </Reveal>
        </section>

        {/* How it works */}
        <HowItWorks />

        {/* Why founders use it */}
        <section style={{ padding: "6rem 1.5rem", backgroundColor: "#0a0a0f" }}>
          <div style={{ maxWidth: "960px", margin: "0 auto" }}>
            <Reveal>
              <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, color: "#ffffff", marginBottom: "3rem" }}>
                Why founders use it
              </h2>
            </Reveal>
            <Reveal>
              <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                <BenefitCard
                  title="Posts that don't sound like ads"
                  body="The AI writes like a founder, not a marketing team. Casual, honest, and native to each community."
                />
                <BenefitCard
                  title="Never miss a comment"
                  body="Pitchpilot monitors your posts and surfaces every reply. Respond fast with AI-drafted replies you approve first."
                />
                <BenefitCard
                  title="You stay in control"
                  body="Nothing goes live without your approval. Edit anything before it posts."
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ backgroundColor: "#111118", padding: "6rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "#ffffff", maxWidth: "560px", marginBottom: "2rem" }}>
              Ready to get your startup in front of the right people?
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <CtaButton />
          </Reveal>
        </section>

      </main>
    </>
  );
}
