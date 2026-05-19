"use client";

import { Fragment, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { saveStartupDescription, clearStartupDescription } from "@/app/actions/startup";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BasePost { title: string; body: string; }

interface Community {
  name: string;
  summary: string;
  allowsSelfPromo: "yes" | "no" | "conditional";
  status: "loading" | "ready" | "error";
  approved: boolean;
  skipped: boolean;
}

interface DraftCard {
  title: string;
  body: string;
  customized: boolean;
  postStatus: "idle" | "posting" | "posted" | "error";
  postUrl: string | null;
  postError: string | null;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const INPUT_CLS =
  "rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 w-full";

const INPUT_STYLE = {
  backgroundColor: "#0a0a0f",
  border: "1px solid #2a2a3a",
} as const;

const CARD_STYLE = {
  backgroundColor: "#0a0a0f",
  border: "1px solid #2a2a3a",
  borderRadius: "0.5rem",
  padding: "1rem",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function SelfPromoBadge({ v }: { v: "yes" | "no" | "conditional" }) {
  if (v === "yes")
    return (
      <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", borderRadius: "9999px", backgroundColor: "rgba(34,197,94,0.12)", color: "#86efac", border: "1px solid rgba(34,197,94,0.25)", whiteSpace: "nowrap" }}>
        self-promo ok
      </span>
    );
  if (v === "no")
    return (
      <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", borderRadius: "9999px", backgroundColor: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)", whiteSpace: "nowrap" }}>
        no self-promo
      </span>
    );
  return (
    <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", borderRadius: "9999px", backgroundColor: "rgba(234,179,8,0.12)", color: "#fde68a", border: "1px solid rgba(234,179,8,0.25)", whiteSpace: "nowrap" }}>
      conditional
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DashboardWizard({ savedDescription = "" }: { savedDescription?: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [maxStep, setMaxStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [startupDescription, setStartupDescription] = useState(savedDescription);
  const [currentUpdate, setCurrentUpdate] = useState("");
  const [rememberDescription, setRememberDescription] = useState(savedDescription.length > 0);
  const [basePost, setBasePost] = useState<BasePost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Step 2
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [seenSubreddits, setSeenSubreddits] = useState<Set<string>>(new Set());

  // Step 3
  const [drafts, setDrafts] = useState<Map<string, DraftCard>>(new Map());

  useEffect(() => {
    if (!basePost) return;
    setDrafts((prev) => {
      const next = new Map(prev);
      for (const [name, d] of next) {
        if (!d.customized && d.postStatus !== "posted") {
          next.set(name, { ...d, title: basePost.title, body: basePost.body });
        }
      }
      return next;
    });
  }, [basePost]);

  // ── Step 1 ────────────────────────────────────────────────────────────────────

  function validateStartupDescription(desc: string): string | null {
    const trimmed = desc.trim();
    if (trimmed.length < 20) return "Your startup description is too short — add a few more details.";
    const lower = trimmed.toLowerCase();
    const looksLikePrompt =
      trimmed.endsWith("?") ||
      /^(what |how |who |why |when |where |write |can you|could you|tell me|generate|create a|make a|ignore |forget )/.test(lower);
    if (looksLikePrompt) return "This looks like a question rather than a startup description. Describe what your startup does.";
    return null;
  }

  async function handleGenerate() {
    setGenerateError(null);
    const validationError = validateStartupDescription(startupDescription);
    if (validationError) { setGenerateError(validationError); return; }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupDescription, currentUpdate }),
      });
      const data = await res.json();
      if (!res.ok) { setGenerateError(data.error ?? "Generation failed."); return; }
      setBasePost({ title: data.title, body: data.body });
    } catch {
      setGenerateError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────────

  async function handleDiscover() {
    setDiscoverError(null);
    setIsDiscovering(true);
    setCommunities([]);
    setSeenSubreddits(new Set());
    let subreddits: string[];
    try {
      const res = await fetch("/api/discover-subreddits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupDescription }),
      });
      const data = await res.json();
      if (!res.ok) { setDiscoverError(data.error ?? "Failed to discover subreddits."); setIsDiscovering(false); return; }
      subreddits = data.subreddits as string[];
    } catch {
      setDiscoverError("Network error. Please try again.");
      setIsDiscovering(false);
      return;
    }
    setSeenSubreddits(new Set(subreddits));
    setCommunities(subreddits.map((name) => ({
      name, summary: "", allowsSelfPromo: "conditional", status: "loading", approved: false, skipped: false,
    })));
    setIsDiscovering(false);
    await Promise.all(subreddits.map(async (name) => {
      try {
        const res = await fetch("/api/analyze-subreddit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subredditName: name }),
        });
        const data = await res.json();
        setCommunities((prev) => prev.map((c) =>
          c.name === name
            ? { ...c, summary: res.ok ? data.summary : (data.error ?? "Analysis failed."), allowsSelfPromo: res.ok ? data.allowsSelfPromo : "conditional", status: res.ok ? "ready" : "error" }
            : c
        ));
      } catch {
        setCommunities((prev) => prev.map((c) =>
          c.name === name ? { ...c, summary: "Failed to analyze.", status: "error" } : c
        ));
      }
    }));
  }

  async function handleRegenerate() {
    setDiscoverError(null);
    setIsRegenerating(true);
    const lockedIn = communities.filter((c) => c.approved && !c.skipped);
    const slotsNeeded = 5 - lockedIn.length;
    if (slotsNeeded <= 0) { setIsRegenerating(false); return; }
    const excludeList = Array.from(seenSubreddits);
    let newSubreddits: string[];
    try {
      const res = await fetch("/api/discover-subreddits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupDescription, excludeSubreddits: excludeList, count: slotsNeeded }),
      });
      const data = await res.json();
      if (!res.ok) { setDiscoverError(data.error ?? "Failed to discover subreddits."); setIsRegenerating(false); return; }
      newSubreddits = data.subreddits as string[];
    } catch {
      setDiscoverError("Network error. Please try again.");
      setIsRegenerating(false);
      return;
    }
    setSeenSubreddits((prev) => {
      const next = new Set(prev);
      newSubreddits.forEach((name) => next.add(name));
      return next;
    });
    const newComms: Community[] = newSubreddits.map((name) => ({
      name, summary: "", allowsSelfPromo: "conditional", status: "loading", approved: false, skipped: false,
    }));
    setCommunities([...lockedIn, ...newComms]);
    setIsRegenerating(false);
    await Promise.all(newSubreddits.map(async (name) => {
      try {
        const res = await fetch("/api/analyze-subreddit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subredditName: name }),
        });
        const data = await res.json();
        setCommunities((prev) => prev.map((c) =>
          c.name === name
            ? { ...c, summary: res.ok ? data.summary : (data.error ?? "Analysis failed."), allowsSelfPromo: res.ok ? data.allowsSelfPromo : "conditional", status: res.ok ? "ready" : "error" }
            : c
        ));
      } catch {
        setCommunities((prev) => prev.map((c) =>
          c.name === name ? { ...c, summary: "Failed to analyze.", status: "error" } : c
        ));
      }
    }));
  }

  function approveComm(name: string) { setCommunities((prev) => prev.map((c) => c.name === name ? { ...c, approved: true } : c)); }
  function skipComm(name: string) { setCommunities((prev) => prev.map((c) => c.name === name ? { ...c, skipped: true } : c)); }
  function undoComm(name: string) { setCommunities((prev) => prev.map((c) => c.name === name ? { ...c, approved: false, skipped: false } : c)); }

  // ── Step 3 ────────────────────────────────────────────────────────────────────

  function setDraftField(name: string, field: "title" | "body", value: string) {
    setDrafts((prev) => {
      const next = new Map(prev);
      const d = next.get(name);
      if (d) next.set(name, { ...d, [field]: value, customized: true });
      return next;
    });
  }

  function resetDraft(name: string) {
    if (!basePost) return;
    setDrafts((prev) => {
      const next = new Map(prev);
      const d = next.get(name);
      if (d) next.set(name, { ...d, title: basePost.title, body: basePost.body, customized: false });
      return next;
    });
  }

  async function handlePost(name: string) {
    const d = drafts.get(name);
    if (!d) return;
    setDrafts((prev) => { const n = new Map(prev); n.set(name, { ...d, postStatus: "posting", postError: null }); return n; });
    try {
      const res = await fetch("/api/post-to-reddit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddit: name, title: d.title, body: d.body }),
      });
      const data = await res.json();
      setDrafts((prev) => {
        const n = new Map(prev);
        n.set(name, res.ok
          ? { ...d, postStatus: "posted", postUrl: data.url, postError: null }
          : { ...d, postStatus: "error", postError: data.error ?? "Posting failed." });
        return n;
      });
    } catch {
      setDrafts((prev) => { const n = new Map(prev); n.set(name, { ...d, postStatus: "error", postError: "Network error. Please try again." }); return n; });
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────────

  function navigateTo(target: 1 | 2 | 3) {
    if (target === step || target > maxStep) return;
    setStep(target);
  }

  function goBack() {
    const ok = window.confirm("Going back will reset any per-community customizations. The base post will be preserved.");
    if (!ok) return;
    if (step === 2) { setCommunities([]); setDrafts(new Map()); setMaxStep(1); setStep(1); }
    else if (step === 3) { setDrafts(new Map()); setMaxStep(2); setStep(2); }
  }

  function goToStep2() {
    if (!basePost) return;
    setMaxStep((prev) => Math.max(prev, 2) as 1 | 2 | 3);
    setStep(2);
  }

  function goToStep3() {
    const approved = communities.filter((c) => c.approved && !c.skipped);
    setDrafts((prev) => {
      const next = new Map(prev);
      for (const c of approved) {
        if (!next.has(c.name)) {
          next.set(c.name, { title: basePost?.title ?? "", body: basePost?.body ?? "", customized: false, postStatus: "idle", postUrl: null, postError: null });
        }
      }
      return next;
    });
    setMaxStep(3);
    setStep(3);
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const approvedComms = communities.filter((c) => c.approved && !c.skipped);
  const allAnalyzed = communities.length > 0 && communities.every((c) => c.status !== "loading");
  const stepLabels = ["Generate post", "Discover communities", "Review & post"];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
        {([1, 2, 3] as const).map((s, idx) => {
          const isActive = step === s;
          const isReached = maxStep >= s;
          const isClickable = isReached && s !== step && s < step;
          return (
            <Fragment key={s}>
              {idx > 0 && (
                <div style={{
                  flex: 1,
                  height: "1px",
                  marginTop: "15px",
                  backgroundColor: maxStep >= s ? "#7c3aed" : "#2a2a3a",
                  alignSelf: "flex-start",
                }} />
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => isClickable && navigateTo(s)}
                  disabled={!isClickable}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    flexShrink: 0,
                    cursor: isClickable ? "pointer" : "default",
                    backgroundColor: isActive ? "#8b5cf6" : "transparent",
                    border: `1.5px solid ${isActive ? "#8b5cf6" : isReached ? "#6b7280" : "#2a2a3a"}`,
                    color: isActive ? "#ffffff" : isReached ? "#94a3b8" : "#374151",
                    transition: "all 0.2s ease",
                  }}
                >
                  {s}
                </button>
                <span style={{
                  fontSize: "0.6875rem",
                  color: isActive ? "#ffffff" : "#64748b",
                  whiteSpace: "nowrap",
                }}>
                  {stepLabels[s - 1]}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* ── Step 1 ─────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Startup description</label>
            <textarea
              rows={3}
              value={startupDescription}
              onChange={(e) => setStartupDescription(e.target.value)}
              onBlur={() => { if (rememberDescription && startupDescription.trim()) saveStartupDescription(startupDescription).then((res) => { if (res.error) console.error("[onBlur] save returned error:", res.error); else console.log("[onBlur] save succeeded"); }).catch((err) => console.error("[onBlur] save threw:", err)); }}
              placeholder="We're building an AI tool that helps founders promote their startup on Reddit without sounding like an ad."
              className={`${INPUT_CLS} resize-none`}
              style={INPUT_STYLE}
            />
            <p className="text-xs text-slate-500 mt-0.5">
              More detail = better posts. Include what your startup does, who it&apos;s for, and what makes it different.
            </p>
            <label className="flex items-center gap-2 mt-1 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={rememberDescription}
                onChange={(e) => {
                  const checked = e.target.checked;
                  console.log("[Remember my startup] checkbox changed, checked=", checked, "description length=", startupDescription.trim().length);
                  setRememberDescription(checked);
                  if (checked && startupDescription.trim()) {
                    console.log("[Remember my startup] calling saveStartupDescription");
                    saveStartupDescription(startupDescription).then((res) => {
                      if (res.error) console.error("[Remember my startup] save returned error:", res.error);
                      else console.log("[Remember my startup] save succeeded");
                    }).catch((err) => console.error("[Remember my startup] save threw:", err));
                  } else if (checked && !startupDescription.trim()) {
                    console.log("[Remember my startup] checked but description is empty — will save on next blur");
                  } else if (!checked) {
                    clearStartupDescription().catch((err) => console.error("[Remember my startup] clear failed", err));
                  }
                }}
                style={{ accentColor: "#8b5cf6" }}
              />
              <span className="text-xs text-slate-500">Remember my startup</span>
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Current update</label>
            <textarea
              rows={3}
              value={currentUpdate}
              onChange={(e) => setCurrentUpdate(e.target.value)}
              placeholder="We just launched our beta and got our first 10 users in 48 hours."
              className={`${INPUT_CLS} resize-none`}
              style={INPUT_STYLE}
            />
          </div>

          {generateError && <p className="text-sm text-red-400">{generateError}</p>}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !startupDescription.trim() || !currentUpdate.trim()}
          >
            {isGenerating ? "Generating…" : "Generate post"}
          </Button>

          {basePost && (
            <div style={CARD_STYLE} className="flex flex-col gap-3 mt-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Generated post — edit before continuing
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  value={basePost.title}
                  onChange={(e) => setBasePost((p) => p ? { ...p, title: e.target.value } : p)}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Body</label>
                <textarea
                  rows={8}
                  value={basePost.body}
                  onChange={(e) => setBasePost((p) => p ? { ...p, body: e.target.value } : p)}
                  className={`${INPUT_CLS} resize-y`}
                  style={INPUT_STYLE}
                />
              </div>

              <Button onClick={goToStep2} disabled={!basePost.title.trim() || !basePost.body.trim()}>
                Next: Choose communities →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2 ─────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {discoverError && <p className="text-sm text-red-400">{discoverError}</p>}

          {communities.length === 0 ? (
            <Button onClick={handleDiscover} disabled={isDiscovering}>
              {isDiscovering ? "Finding communities…" : "Discover communities"}
            </Button>
          ) : (
            <Button
              onClick={handleRegenerate}
              disabled={
                isRegenerating ||
                isDiscovering ||
                communities.some((c) => c.status === "loading") ||
                communities.filter((c) => c.approved && !c.skipped).length >= 5
              }
            >
              {isRegenerating ? "Finding communities…" : "Find more communities"}
            </Button>
          )}

          {communities.length > 0 && (
            <div className="flex flex-col gap-3">
              {communities.map((c) => {
                if (c.skipped) {
                  return (
                    <div key={c.name} style={{ ...CARD_STYLE, opacity: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span className="text-sm text-slate-500">r/{c.name} · skipped</span>
                      <Button size="sm" variant="ghost" onClick={() => undoComm(c.name)}>Undo</Button>
                    </div>
                  );
                }
                return (
                  <div
                    key={c.name}
                    style={{
                      ...CARD_STYLE,
                      borderColor: c.approved ? "#6d28d9" : "#2a2a3a",
                    }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">r/{c.name}</span>
                      <SelfPromoBadge v={c.allowsSelfPromo} />
                    </div>
                    {c.status === "loading"
                      ? <p className="text-sm text-slate-500 italic">Analyzing…</p>
                      : <p className="text-sm text-slate-400">{c.summary}</p>
                    }
                    {c.status !== "loading" && !c.approved && (
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" variant="outline" onClick={() => approveComm(c.name)}>Use this community</Button>
                        <Button size="sm" variant="ghost" onClick={() => skipComm(c.name)}>Skip</Button>
                      </div>
                    )}
                    {c.approved && (
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs font-medium text-purple-400">Approved</p>
                        <Button size="sm" variant="ghost" onClick={() => undoComm(c.name)}>Undo</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {allAnalyzed && approvedComms.length === 0 && (
            <p className="text-xs text-slate-500">Approve at least one community to continue.</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button variant="ghost" onClick={goBack}>← Back</Button>
            {communities.length > 0 && (
              <Button onClick={goToStep3} disabled={approvedComms.length === 0}>
                Next: Review &amp; post →
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3 ─────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p style={{ fontSize: "0.8125rem", color: "#94a3b8", backgroundColor: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "0.375rem", padding: "0.625rem 0.875rem" }}>
            Posting very similar content across multiple communities may get flagged as spam. Consider customizing each post for its community.
          </p>
          {approvedComms.map((c) => {
            const d = drafts.get(c.name) ?? {
              title: basePost?.title ?? "",
              body: basePost?.body ?? "",
              customized: false,
              postStatus: "idle" as const,
              postUrl: null,
              postError: null,
            };
            return (
              <div
                key={c.name}
                style={{
                  ...CARD_STYLE,
                  borderColor: d.postStatus === "posted" ? "#6d28d9" : "#2a2a3a",
                }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">r/{c.name}</span>
                  <SelfPromoBadge v={c.allowsSelfPromo} />
                </div>

                {d.postStatus === "posted" ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-purple-400">Posted!</p>
                    {d.postUrl && (
                      <a href={d.postUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 underline hover:text-white transition-colors">
                        View on Reddit →
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Title</label>
                        {d.customized && (
                          <button onClick={() => resetDraft(c.name)} className="text-xs text-slate-500 hover:text-white underline transition-colors">
                            Reset to base post
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={d.title}
                        onChange={(e) => setDraftField(c.name, "title", e.target.value)}
                        className={INPUT_CLS}
                        style={INPUT_STYLE}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Body</label>
                      <textarea
                        rows={6}
                        value={d.body}
                        onChange={(e) => setDraftField(c.name, "body", e.target.value)}
                        className={`${INPUT_CLS} resize-y`}
                        style={INPUT_STYLE}
                      />
                    </div>

                    {d.postError && <p className="text-sm text-red-400">{d.postError}</p>}

                    <Button
                      onClick={() => handlePost(c.name)}
                      disabled={d.postStatus === "posting" || !d.title.trim() || !d.body.trim()}
                    >
                      {d.postStatus === "posting" ? "Posting…" : "Post to Reddit"}
                    </Button>
                  </>
                )}
              </div>
            );
          })}

          <div className="pt-1">
            <Button variant="ghost" onClick={goBack}>← Back</Button>
          </div>
        </div>
      )}
    </div>
  );
}
