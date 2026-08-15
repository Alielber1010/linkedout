"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  onClose,
  children,
  headerAction,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    const target = contentRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button"
    );
    target?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-secondary hover:text-foreground"
            >
              <X size={20} />
            </button>
            <h2 id="modal-title" className="font-semibold">
              {title}
            </h2>
          </div>
          {headerAction}
        </div>
        <div ref={contentRef} className="max-h-[75vh] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
