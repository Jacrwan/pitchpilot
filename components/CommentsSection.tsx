"use client";

import { useEffect, useState } from "react";
import { markCommentsRead } from "@/app/actions/comments";

interface Comment {
  id: string;
  post_id: string;
  reddit_comment_id: string;
  author: string;
  body: string;
  created_utc: number;
  is_read: boolean;
  posts: {
    subreddit: string;
    title: string;
    reddit_url: string | null;
  } | null;
}

interface PostGroup {
  post: Comment["posts"];
  comments: Comment[];
}

export function CommentsSection({
  comments,
  userId,
}: {
  comments: Comment[];
  userId: string;
}) {
  const [allRead, setAllRead] = useState(false);

  useEffect(() => {
    const hasUnread = comments.some((c) => !c.is_read);
    if (hasUnread) {
      markCommentsRead(userId).then(() => setAllRead(true));
    }
  }, [comments, userId]);

  if (comments.length === 0) {
    return (
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        No comments yet. Comments on your Reddit posts will appear here.
      </p>
    );
  }

  const unreadCount = allRead ? 0 : comments.filter((c) => !c.is_read).length;

  const byPost = new Map<string, PostGroup>();
  for (const comment of comments) {
    if (!byPost.has(comment.post_id)) {
      byPost.set(comment.post_id, { post: comment.posts, comments: [] });
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

          <div className="flex flex-col gap-3 pl-3 border-l border-zinc-200 dark:border-zinc-800">
            {postComments.map((comment) => {
              const isUnread = !allRead && !comment.is_read;
              return (
                <div key={comment.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      u/{comment.author}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(comment.created_utc * 1000).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
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
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
