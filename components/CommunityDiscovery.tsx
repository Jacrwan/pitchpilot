"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Community {
  name: string;
  summary: string;
  allowsSelfPromo: "yes" | "no" | "conditional";
  status: "loading" | "ready" | "error";
  approved: boolean;
  skipped: boolean;
  draftTitle: string;
  draftBody: string;
  postStatus: "idle" | "posting" | "posted" | "error";
  postUrl: string | null;
  postError: string | null;
}

function blank(name: string): Community {
  return {
    name,
    summary: "",
    allowsSelfPromo: "conditional",
    status: "loading",
    approved: false,
    skipped: false,
    draftTitle: "",
    draftBody: "",
    postStatus: "idle",
    postUrl: null,
    postError: null,
  };
}

export function CommunityDiscovery({
  generatedPost,
}: {
  generatedPost?: { title: string; body: string } | null;
}) {
  const [startupDescription, setStartupDescription] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDiscover() {
    setError(null);
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

      if (!res.ok) {
        setError(data.error ?? "Failed to discover subreddits.");
        setIsDiscovering(false);
        return;
      }

      subreddits = data.subreddits as string[];
    } catch {
      setError("Network error. Please try again.");
      setIsDiscovering(false);
      return;
    }

    setCommunities(subreddits.map(blank));
    setIsDiscovering(false);

    await Promise.all(
      subreddits.map(async (name) => {
        try {
          const res = await fetch("/api/analyze-subreddit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subredditName: name }),
          });
          const data = await res.json();
          setCommunities((prev) =>
            prev.map((c) =>
              c.name === name
                ? {
                    ...c,
                    summary: res.ok ? data.summary : (data.error ?? "Analysis failed."),
                    allowsSelfPromo: res.ok ? data.allowsSelfPromo : "conditional",
                    status: res.ok ? "ready" : "error",
                  }
                : c
            )
          );
        } catch {
          setCommunities((prev) =>
            prev.map((c) =>
              c.name === name ? { ...c, summary: "Failed to analyze.", status: "error" } : c
            )
          );
        }
      })
    );
  }

  useEffect(() => {
    if (!generatedPost) return;
    setCommunities((prev) =>
      prev.map((c) =>
        c.approved && c.postStatus !== "posted"
          ? { ...c, draftTitle: generatedPost.title, draftBody: generatedPost.body }
          : c
      )
    );
  }, [generatedPost]);

  function approve(name: string) {
    setCommunities((prev) =>
      prev.map((c) =>
        c.name === name
          ? {
              ...c,
              approved: true,
              draftTitle: generatedPost?.title ?? c.draftTitle,
              draftBody: generatedPost?.body ?? c.draftBody,
            }
          : c
      )
    );
  }

  function skip(name: string) {
    setCommunities((prev) =>
      prev.map((c) => (c.name === name ? { ...c, skipped: true } : c))
    );
  }

  function undo(name: string) {
    setCommunities((prev) =>
      prev.map((c) =>
        c.name === name ? { ...c, approved: false, skipped: false } : c
      )
    );
  }

  function setDraft(name: string, field: "draftTitle" | "draftBody", value: string) {
    setCommunities((prev) =>
      prev.map((c) => (c.name === name ? { ...c, [field]: value } : c))
    );
  }

  async function handlePost(name: string) {
    const community = communities.find((c) => c.name === name);
    if (!community) return;

    setCommunities((prev) =>
      prev.map((c) =>
        c.name === name ? { ...c, postStatus: "posting", postError: null } : c
      )
    );

    try {
      const res = await fetch("/api/post-to-reddit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subreddit: name,
          title: community.draftTitle,
          body: community.draftBody,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCommunities((prev) =>
          prev.map((c) =>
            c.name === name
              ? { ...c, postStatus: "error", postError: data.error ?? "Posting failed." }
              : c
          )
        );
        return;
      }

      setCommunities((prev) =>
        prev.map((c) =>
          c.name === name ? { ...c, postStatus: "posted", postUrl: data.url } : c
        )
      );
    } catch {
      setCommunities((prev) =>
        prev.map((c) =>
          c.name === name
            ? { ...c, postStatus: "error", postError: "Network error. Please try again." }
            : c
        )
      );
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="discoverDesc"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Startup description
        </label>
        <textarea
          id="discoverDesc"
          rows={3}
          value={startupDescription}
          onChange={(e) => setStartupDescription(e.target.value)}
          placeholder="We're building an AI tool that helps founders promote their startup on Reddit without sounding like an ad."
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button
        onClick={handleDiscover}
        disabled={isDiscovering || !startupDescription.trim()}
      >
        {isDiscovering ? "Finding communities…" : "Discover communities"}
      </Button>

      {communities.length > 0 && (
        <div className="flex flex-col gap-3">
          {communities.map((c) => {
            if (c.skipped) {
              return (
                <div
                  key={c.name}
                  className="rounded-lg border border-zinc-100 dark:border-zinc-800/50 px-4 py-2 flex items-center justify-between gap-2 opacity-50"
                >
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    r/{c.name} · skipped
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => undo(c.name)}>
                    Undo
                  </Button>
                </div>
              );
            }

            return (
              <div
                key={c.name}
                className={`rounded-lg border p-4 flex flex-col gap-2 ${
                  c.approved
                    ? "border-green-400 dark:border-green-600"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    r/{c.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      c.allowsSelfPromo === "yes"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : c.allowsSelfPromo === "no"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {c.allowsSelfPromo === "yes"
                      ? "self-promo ok"
                      : c.allowsSelfPromo === "no"
                      ? "no self-promo"
                      : "conditional"}
                  </span>
                </div>

                {c.status === "loading" ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
                    Analyzing…
                  </p>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.summary}</p>
                )}

                {c.status !== "loading" && !c.approved && (
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="outline" onClick={() => approve(c.name)}>
                      Use this community
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => skip(c.name)}>
                      Skip
                    </Button>
                  </div>
                )}

                {c.approved && c.postStatus !== "posted" && (
                  <div className="flex flex-col gap-3 mt-1 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400">
                        Approved — add your post
                      </p>
                      <Button size="sm" variant="ghost" onClick={() => undo(c.name)}>
                        Undo
                      </Button>
                    </div>

                    <input
                      type="text"
                      placeholder="Post title"
                      value={c.draftTitle}
                      onChange={(e) => setDraft(c.name, "draftTitle", e.target.value)}
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    />

                    <textarea
                      rows={5}
                      placeholder="Post body"
                      value={c.draftBody}
                      onChange={(e) => setDraft(c.name, "draftBody", e.target.value)}
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-y"
                    />

                    {c.postError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{c.postError}</p>
                    )}

                    <Button
                      onClick={() => handlePost(c.name)}
                      disabled={
                        c.postStatus === "posting" ||
                        !c.draftTitle.trim() ||
                        !c.draftBody.trim()
                      }
                    >
                      {c.postStatus === "posting" ? "Posting…" : "Post to Reddit"}
                    </Button>
                  </div>
                )}

                {c.postStatus === "posted" && (
                  <div className="flex flex-col gap-1 mt-1 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Posted!
                    </p>
                    {c.postUrl && (
                      <a
                        href={c.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-500 dark:text-zinc-400 underline hover:text-zinc-900 dark:hover:text-zinc-50"
                      >
                        View on Reddit →
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
