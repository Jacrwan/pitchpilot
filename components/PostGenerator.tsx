"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface GeneratedPost {
  title: string;
  body: string;
}

export function PostGenerator() {
  const [startupDescription, setStartupDescription] = useState("");
  const [currentUpdate, setCurrentUpdate] = useState("");
  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupDescription, currentUpdate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Generation failed. Please try again.");
        return;
      }

      setPost({ title: data.title, body: data.body });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="startupDescription"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Startup description
        </label>
        <textarea
          id="startupDescription"
          rows={3}
          value={startupDescription}
          onChange={(e) => setStartupDescription(e.target.value)}
          placeholder="We're building an AI tool that helps founders promote their startup on Reddit without sounding like an ad."
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="currentUpdate"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Current update
        </label>
        <textarea
          id="currentUpdate"
          rows={3}
          value={currentUpdate}
          onChange={(e) => setCurrentUpdate(e.target.value)}
          placeholder="We just launched our beta and got our first 10 users in 48 hours."
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !startupDescription.trim() || !currentUpdate.trim()}
      >
        {isGenerating ? "Generating…" : "Generate post"}
      </Button>

      {post && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Generated post
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Title
            </label>
            <input
              type="text"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Body
            </label>
            <textarea
              rows={10}
              value={post.body}
              onChange={(e) => setPost({ ...post, body: e.target.value })}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
}
