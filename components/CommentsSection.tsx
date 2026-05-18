"use client";

import { useEffect, useState } from "react";
import { markCommentsRead } from "@/app/actions/comments";
import { Button } from "@/components/ui/button";

interface PostData {
  subreddit: string;
  title: string;
  reddit_url: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  reddit_comment_id: string;
  author: string;
  body: string;
  created_utc: number;
  is_read: boolean;
  suggested_reply: string | null;
  is_replied: boolean;
  // Supabase returns joined rows as an array; we normalize to single object at render
  posts: PostData | PostData[] | null;
}

function resolvePost(posts: Comment["posts"]): PostData | null {
  if (!posts) return null;
  if (Array.isArray(posts)) return posts[0] ?? null;
  return posts;
}

interface ReplyState {
  text: string;
  status: "idle" | "posting" | "replied" | "error";
  error: string | null;
}

interface PostGroup {
  post: PostData | null;
  comments: Comment[];
}

// TODO: remove mock data — delete MOCK_COMMENTS and the `activeComments` line below, then replace every `activeComments` reference with `comments`
const MOCK_COMMENTS: Comment[] = [
  {
    id: "mock-1",
    post_id: "mock-post-1",
    reddit_comment_id: "abc123",
    author: "curious_cto",
    body: "This looks really interesting! How does the AI decide which communities are a good fit? Keyword matching or something smarter?",
    created_utc: Math.floor(Date.now() / 1000) - 3600,
    is_read: false,
    suggested_reply:
      "Great question! We use Claude to read each subreddit's recent posts and rules, then score fit based on topic overlap and community culture — more of a vibe check than keyword matching. We want your post to actually land well, not just show up.",
    is_replied: false,
    posts: {
      subreddit: "startups",
      title: "I built an AI tool that drafts Reddit posts for founders — feedback?",
      reddit_url: null,
    },
  },
  {
    id: "mock-2",
    post_id: "mock-post-1",
    reddit_comment_id: "def456",
    author: "indie_hacker_99",
    body: "What's the pricing? Would love to try this for my SaaS.",
    created_utc: Math.floor(Date.now() / 1000) - 1800,
    is_read: false,
    suggested_reply:
      "Free during early access while we iron out the last rough edges. Would love to have you as an early user — happy to DM you a link if you want in.",
    is_replied: false,
    posts: {
      subreddit: "startups",
      title: "I built an AI tool that drafts Reddit posts for founders — feedback?",
      reddit_url: null,
    },
  },
  {
    id: "mock-3",
    post_id: "mock-post-2",
    reddit_comment_id: "ghi789",
    author: "pmarca_fan",
    body: "Does this work for non-technical founders too, or is it aimed at devs?",
    created_utc: Math.floor(Date.now() / 1000) - 7200,
    is_read: true,
    suggested_reply:
      "Built for everyone — you just describe your startup in plain English and the AI handles the rest. No technical knowledge required at all.",
    is_replied: false,
    posts: {
      subreddit: "entrepreneur",
      title: "6 weeks of community outreach using AI — here's what worked",
      reddit_url: null,
    },
  },
];

export function CommentsSection({
  comments,
  userId,
}: {
  comments: Comment[];
  userId: string;
}) {
  const activeComments = MOCK_COMMENTS; // TODO: remove mock data — replace `MOCK_COMMENTS` with `comments` and delete this line + the MOCK_COMMENTS constant above
  void comments; // remove alongside the line above

  const [allRead, setAllRead] = useState(false);
  const [replies, setReplies] = useState<Map<string, ReplyState>>(() => {
    const map = new Map<string, ReplyState>();
    for (const c of activeComments) {
      map.set(c.id, {
        text: c.suggested_reply ?? "",
        status: c.is_replied ? "replied" : "idle",
        error: null,
      });
    }
    return map;
  });

  useEffect(() => {
    const hasUnread = activeComments.some((c) => !c.is_read);
    if (hasUnread) {
      markCommentsRead(userId).then(() => setAllRead(true));
    }
  }, [activeComments, userId]);

  function setReply(commentId: string, partial: Partial<ReplyState>) {
    setReplies((prev) => {
      const next = new Map(prev);
      next.set(commentId, { ...prev.get(commentId)!, ...partial });
      return next;
    });
  }

  async function handleApprove(comment: Comment) {
    const state = replies.get(comment.id);
    if (!state || !state.text.trim()) return;

    setReply(comment.id, { status: "posting", error: null });

    try {
      const res = await fetch("/api/post-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: comment.id,
          commentRedditId: comment.reddit_comment_id,
          replyText: state.text,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReply(comment.id, {
          status: "error",
          error: data.error ?? "Failed to post reply.",
        });
        return;
      }

      setReply(comment.id, { status: "replied" });
    } catch {
      setReply(comment.id, {
        status: "error",
        error: "Network error. Please try again.",
      });
    }
  }

  if (activeComments.length === 0) {
    return (
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        No comments yet. Comments on your Reddit posts will appear here.
      </p>
    );
  }

  const unreadCount = allRead ? 0 : activeComments.filter((c) => !c.is_read).length;

  const byPost = new Map<string, PostGroup>();
  for (const comment of activeComments) {
    if (!byPost.has(comment.post_id)) {
      byPost.set(comment.post_id, { post: resolvePost(comment.posts), comments: [] });
    }
    byPost.get(comment.post_id)!.comments.push(comment);
  }

  return (
    <div className="flex flex-col gap-5">
      {unreadCount > 0 && (
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {unreadCount} unread comment{unreadCount !== 1 ? "s" : ""}
        </p>
      )}

      {Array.from(byPost.entries()).map(([postId, { post, comments: postComments }]) => (
        <div key={postId} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              r/{post?.subreddit}
            </span>
            {post?.reddit_url ? (
              <a
                href={post.reddit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline truncate"
              >
                {post.title}
              </a>
            ) : (
              <span className="text-xs text-zinc-400 truncate">{post?.title}</span>
            )}
          </div>

          <div className="flex flex-col gap-4 pl-3 border-l border-zinc-200 dark:border-zinc-800">
            {postComments.map((comment) => {
              const isUnread = !allRead && !comment.is_read;
              const replyState = replies.get(comment.id) ?? {
                text: "",
                status: "idle" as const,
                error: null,
              };

              return (
                <div key={comment.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      u/{comment.author}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(comment.created_utc * 1000).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                    {isUnread && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium leading-none">
                        new
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {comment.body}
                  </p>

                  {replyState.status === "replied" ? (
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                      Replied ✓
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 mt-1">
                      <textarea
                        rows={3}
                        value={replyState.text}
                        onChange={(e) =>
                          setReply(comment.id, { text: e.target.value })
                        }
                        placeholder={
                          comment.suggested_reply
                            ? undefined
                            : "Write a reply…"
                        }
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-y"
                      />
                      {replyState.error && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {replyState.error}
                        </p>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleApprove(comment)}
                        disabled={
                          replyState.status === "posting" ||
                          !replyState.text.trim()
                        }
                      >
                        {replyState.status === "posting"
                          ? "Posting reply…"
                          : "Approve + Post"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
