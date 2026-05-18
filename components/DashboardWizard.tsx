"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { saveStartupDescription, clearStartupDescription } from "@/app/actions/startup";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BasePost {
  title: string;
  body: string;
}

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const INPUT_CLS =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function SelfPromoBadge({ v }: { v: "yes" | "no" | "conditional" }) {
  if (v === "yes")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        self-promo ok
      </span>
    );
  if (v === "no")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        no self-promo
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
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
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  // Step 3
  const [drafts, setDrafts] = useState<Map<string, DraftCard>>(new Map());

  // Auto-update non-customised drafts whenever base post changes
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

  // ── Step 1 actions ────────────────────────────────────────────────────────────

  function validateStartupDescription(desc: string): string | null {
    const trimmed = desc.trim();
    if (trimmed.length < 20) {
      return "Your startup description is too short — add a few more details.";
    }
    const lower = trimmed.toLowerCase();
    const looksLikePrompt =
      trimmed.endsWith("?") ||
      /^(what |how |who |why |when |where |write |can you|could you|tell me|generate|create a|make a|ignore |forget )/.test(lower);
    if (looksLikePrompt) {
      return "This looks like a question rather than a startup description. Describe what your startup does.";
    }
    return null;
  }

  async function handleGenerate() {
    setGenerateError(null);
    const validationError = validateStartupDescription(startupDescription);
    if (validationError) {
      setGenerateError(validationError);
      return;
    }
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

  // ── Step 2 actions ────────────────────────────────────────────────────────────

  async function handleDiscover() {
    setDiscoverError(null);
    setIsDiscovering(true);
    setCommunities([]);
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

  function approveComm(name: string) {
    setCommunities((prev) => prev.map((c) => c.name === name ? { ...c, approved: true } : c));
  }
  function skipComm(name: string) {
    setCommunities((prev) => prev.map((c) => c.name === name ? { ...c, skipped: true } : c));
  }
  function undoComm(name: string) {
    setCommunities((prev) => prev.map((c) => c.name === name ? { ...c, approved: false, skipped: false } : c));
  }

  // ── Step 3 actions ────────────────────────────────────────────────────────────

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

  // ── Navigation ─────────────────────────────────────────────────────────────────

  // Step indicator: navigate directly without confirmation or state reset
  function navigateTo(target: 1 | 2 | 3) {
    if (target === step || target > maxStep) return;
    setStep(target);
  }

  // Back button: show confirmation, reset downstream state
  function goBack() {
    const ok = window.confirm(
      "Going back will reset any per-community customizations. The base post will be preserved."
    );
    if (!ok) return;
    if (step === 2) {
      setCommunities([]);
      setDrafts(new Map());
      setMaxStep(1);
      setStep(1);
    } else if (step === 3) {
      setDrafts(new Map());
      setMaxStep(2);
      setStep(2);
    }
  }

  // Next: Step 1 → 2
  function goToStep2() {
    if (!basePost) return;
    setMaxStep((prev) => Math.max(prev, 2) as 1 | 2 | 3);
    setStep(2);
  }

  // Next: Step 2 → 3
  function goToStep3() {
    const approved = communities.filter((c) => c.approved && !c.skipped);
    setDrafts((prev) => {
      const next = new Map(prev);
      for (const c of approved) {
        if (!next.has(c.name)) {
          next.set(c.name, {
            title: basePost?.title ?? "",
            body: basePost?.body ?? "",
            customized: false,
            postStatus: "idle",
            postUrl: null,
            postError: null,
          });
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

  // ── Render ─────────────────────────────────────────────────────────────────────

  const stepLabels = ["Generate post", "Discover communities", "Review & post"];

  return (
    <div className="flex flex-col gap-6">

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {([1, 2, 3] as const).map((s) => {
          const isActive = step === s;
          const isReached = maxStep >= s;
          const isClickable = isReached && s !== step && s < step;
          return (
            <div key={s} className="flex items-center gap-1">
              {s > 1 && <div className="h-px w-4 bg-zinc-200 dark:bg-zinc-700 shrink-0" />}
              <button
                onClick={() => isClickable && navigateTo(s)}
                disabled={!isClickable}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-zinc-900 dark:text-zinc-50"
                    : isClickable
                    ? "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                    : "text-zinc-300 dark:text-zinc-600 cursor-default"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  isActive
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                    : isReached
                    ? "border border-zinc-400 text-zinc-500 dark:border-zinc-500 dark:text-zinc-400"
                    : "border border-zinc-200 text-zinc-300 dark:border-zinc-700 dark:text-zinc-600"
                }`}>
                  {s}
                </span>
                <span className="hidden sm:inline">{stepLabels[s - 1]}</span>
              </button>
            </div>
          );
        })}
        <p className="ml-auto text-xs text-zinc-400 shrink-0">Step {step} of 3</p>
      </div>

      {/* ── Step 1: Generate post ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Startup description
            </label>
            <textarea
              rows={3}
              value={startupDescription}
              onChange={(e) => setStartupDescription(e.target.value)}
              onBlur={() => {
                if (rememberDescription && startupDescription.trim()) {
                  saveStartupDescription(startupDescription);
                }
              }}
              placeholder="We're building an AI tool that helps founders promote their startup on Reddit without sounding like an ad."
              className={`${INPUT_CLS} resize-none`}
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              More detail = better posts. Include what your startup does, who it&apos;s for, and what makes it different.
            </p>
            <label className="flex items-center gap-2 mt-1 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={rememberDescription}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRememberDescription(checked);
                  if (checked && startupDescription.trim()) {
                    saveStartupDescription(startupDescription);
                  } else if (!checked) {
                    clearStartupDescription();
                  }
                }}
                className="rounded border-zinc-300 dark:border-zinc-600"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Remember my startup
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Current update
            </label>
            <textarea
              rows={3}
              value={currentUpdate}
              onChange={(e) => setCurrentUpdate(e.target.value)}
              placeholder="We just launched our beta and got our first 10 users in 48 hours."
              className={`${INPUT_CLS} resize-none`}
            />
          </div>

          {generateError && (
            <p className="text-sm text-red-600 dark:text-red-400">{generateError}</p>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !startupDescription.trim() || !currentUpdate.trim()}
          >
            {isGenerating ? "Generating…" : "Generate post"}
          </Button>

          {basePost && (
            <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mt-1">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Generated post — edit before continuing
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  value={basePost.title}
                  onChange={(e) => setBasePost((p) => p ? { ...p, title: e.target.value } : p)}
                  className={INPUT_CLS}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Body</label>
                <textarea
                  rows={8}
                  value={basePost.body}
                  onChange={(e) => setBasePost((p) => p ? { ...p, body: e.target.value } : p)}
                  className={`${INPUT_CLS} resize-y`}
                />
              </div>

              <Button
                onClick={goToStep2}
                disabled={!basePost.title.trim() || !basePost.body.trim()}
              >
                Next: Choose communities →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Discover communities ──────────────────────────────────────── */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {discoverError && (
            <p className="text-sm text-red-600 dark:text-red-400">{discoverError}</p>
          )}

          {communities.length === 0 && (
            <Button onClick={handleDiscover} disabled={isDiscovering}>
              {isDiscovering ? "Finding communities…" : "Discover communities"}
            </Button>
          )}

          {communities.length > 0 && (
            <div className="flex flex-col gap-3">
              {communities.map((c) => {
                if (c.skipped) {
                  return (
                    <div key={c.name} className="rounded-lg border border-zinc-100 dark:border-zinc-800/50 px-4 py-2 flex items-center justify-between gap-2 opacity-50">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">r/{c.name} · skipped</span>
                      <Button size="sm" variant="ghost" onClick={() => undoComm(c.name)}>Undo</Button>
                    </div>
                  );
                }
                return (
                  <div key={c.name} className={`rounded-lg border p-4 flex flex-col gap-2 ${c.approved ? "border-green-400 dark:border-green-600" : "border-zinc-200 dark:border-zinc-800"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">r/{c.name}</span>
                      <SelfPromoBadge v={c.allowsSelfPromo} />
                    </div>
                    {c.status === "loading"
                      ? <p className="text-sm text-zinc-400 italic">Analyzing…</p>
                      : <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.summary}</p>
                    }
                    {c.status !== "loading" && !c.approved && (
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" variant="outline" onClick={() => approveComm(c.name)}>Use this community</Button>
                        <Button size="sm" variant="ghost" onClick={() => skipComm(c.name)}>Skip</Button>
                      </div>
                    )}
                    {c.approved && (
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">Approved</p>
                        <Button size="sm" variant="ghost" onClick={() => undoComm(c.name)}>Undo</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {allAnalyzed && approvedComms.length === 0 && (
            <p className="text-xs text-zinc-400">Approve at least one community to continue.</p>
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

      {/* ── Step 3: Review & post ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
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
              <div key={c.name} className={`rounded-lg border p-4 flex flex-col gap-3 ${d.postStatus === "posted" ? "border-green-400 dark:border-green-600" : "border-zinc-200 dark:border-zinc-800"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">r/{c.name}</span>
                  <SelfPromoBadge v={c.allowsSelfPromo} />
                </div>

                {d.postStatus === "posted" ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Posted!</p>
                    {d.postUrl && (
                      <a href={d.postUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50">
                        View on Reddit →
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Title</label>
                        {d.customized && (
                          <button onClick={() => resetDraft(c.name)} className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline">
                            Reset to base post
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={d.title}
                        onChange={(e) => setDraftField(c.name, "title", e.target.value)}
                        className={INPUT_CLS}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Body</label>
                      <textarea
                        rows={6}
                        value={d.body}
                        onChange={(e) => setDraftField(c.name, "body", e.target.value)}
                        className={`${INPUT_CLS} resize-y`}
                      />
                    </div>

                    {d.postError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{d.postError}</p>
                    )}

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
