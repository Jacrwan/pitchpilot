"use client";

import { useState } from "react";
import { CommunityDiscovery } from "@/components/CommunityDiscovery";
import { PostGenerator } from "@/components/PostGenerator";

interface GeneratedPost {
  title: string;
  body: string;
}

export function PostingSection() {
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);

  return (
    <>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 mb-6">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
          Discover communities
        </h2>
        <CommunityDiscovery generatedPost={generatedPost} />
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 mb-6">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
          Generate a post
        </h2>
        <PostGenerator onPostGenerated={setGeneratedPost} />
      </div>
    </>
  );
}
