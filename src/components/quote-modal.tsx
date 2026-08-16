"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import { Modal } from "@/components/modal";
import { timeAgo } from "@/lib/time";

export function QuoteModal({
  postId,
  quotedBody,
  quotedIdentity,
  quotedIsAnonymous,
  quotedCreatedAt,
  onClose,
}: {
  postId: string;
  quotedBody: string;
  quotedIdentity: string;
  quotedIsAnonymous: boolean;
  quotedCreatedAt: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPost(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal title="Quote" onClose={onClose}>
      <form action={handleSubmit} className="space-y-3">
        <input type="hidden" name="quoted_post_id" value={postId} />

        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={2000}
          autoFocus
          placeholder="Add a comment..."
          className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-secondary"
        />

        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 text-sm">
            <Avatar content="" size={24} muted={quotedIsAnonymous} />
            <span className="font-semibold">{quotedIdentity}</span>
            <span className="text-xs text-secondary">{timeAgo(quotedCreatedAt)}</span>
          </div>
          <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-sm text-secondary">
            {quotedBody}
          </p>
        </div>

        {error && <p className="text-sm text-primary">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || body.trim().length === 0}
            className="rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-1.5 disabled:opacity-50"
          >
            {pending ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
