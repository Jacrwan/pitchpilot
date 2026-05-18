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

function blendColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
) {
  return `rgb(${Math.round(lerp(c1[0], c2[0], t))},${Math.round(lerp(c1[1], c2[1], t))},${Math.round(lerp(c1[2], c2[2], t))})`;
}

const NAVY:   [number, number, number] = [8, 12, 28];
const PURPLE: [number, number, number] = [18, 8, 36];
const BLACK:  [number, number, number] = [5, 5, 8];

function GradientBackground() {
  const [color, setColor] = useState(`rgb(${NAVY.join(",")})`);

  useEffect(() => {
    function onScroll() {
      const progress =
        window.scrollY /
        Math.max(document.body.scrollHeight - window.innerHeight, 1);
      const c =
        progress < 0.5
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
      className="hidden dark:block"
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

// ── Animated wrapper ──────────────────────────────────────────────────────────

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

// ── Benefit card with hover glow ──────────────────────────────────────────────

function BenefitCard({ title, body }: { title: string; body: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 220px",
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        borderRadius: "0.75rem",
        border: hovered
          ? "1px solid rgba(139, 92, 246, 0.55)"
          : "1px solid rgba(161, 161, 170, 0.25)",
        boxShadow: hovered
          ? "0 0 24px rgba(139, 92, 246, 0.14)"
          : "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50" style={{ margin: 0 }}>
        {title}
      </h3>
      <p className="text-zinc-500 dark:text-zinc-400" style={{ fontSize: "0.875rem", lineHeight: 1.7, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}

// ── How it works (count-up on enter) ─────────────────────────────────────────

function HowItWorks() {
  const [ref, inView] = useInView(0.2);
  const n1 = useCountUp(1, inView, 400);
  const n2 = useCountUp(2, inView, 550);
  const n3 = useCountUp(3, inView, 700);

  const steps = [
    { n: n1, title: "Describe your startup", body: "Paste in what you're building and your latest update. The more detail, the better the output.", delay: 0 },
    { n: n2, title: "Find your communities", body: "Pitchpilot scans relevant subreddits and communities, reads their rules, and picks the best fit for your post.", delay: 100 },
    { n: n3, title: "Approve and post", body: "Review the draft, make any edits, and post with one click. Reply to comments the same way.", delay: 200 },
  ];

  return (
    <section className="px-6 py-24 dark:bg-zinc-900/60 bg-zinc-50">
      <div ref={ref} className="mx-auto" style={{ maxWidth: "960px" }}>
        <Reveal>
          <h2
            className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50"
            style={{ marginBottom: "3rem" }}
          >
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
              <span
                className="font-bold text-zinc-300 dark:text-zinc-600"
                style={{ fontSize: "3.5rem", lineHeight: 1 }}
              >
                {n}
              </span>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                {body}
              </p>
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
      <main className="flex flex-col">

        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <Reveal>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Your startup, in front of
              <br />
              the right people.
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
              Pitchpilot finds the right Reddit communities for your startup, drafts
              native posts, and lets you approve before anything goes live.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-10">
              <CtaButton />
            </div>
          </Reveal>
        </section>

        {/* How it works */}
        <HowItWorks />

        {/* Why founders use it */}
        <section className="px-6 py-24">
          <div className="mx-auto" style={{ maxWidth: "960px" }}>
            <Reveal>
              <h2
                className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50"
                style={{ marginBottom: "3rem" }}
              >
                Why founders use it
              </h2>
            </Reveal>
            <Reveal>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
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
        <section className="px-6 py-24 flex flex-col items-center text-center dark:bg-zinc-900/60 bg-zinc-50">
          <Reveal>
            <h2
              className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl"
              style={{ maxWidth: "560px" }}
            >
              Ready to get your startup in front of the right people?
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8">
              <CtaButton />
            </div>
          </Reveal>
        </section>

      </main>
    </>
  );
}
