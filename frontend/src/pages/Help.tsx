'use client'

import React, { useEffect, useState } from "react";
import { HelpCircle, BookOpen, ExternalLink, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Help() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/help.md")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load help (${r.status})`);
        return r.text();
      })
      .then((t) => {
        if (!cancelled) {
          setContent(t);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Failed to load help");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#0EA5E9]" /> Help &amp; Documentation
          </h1>
          <p className="text-sm text-[#94A3B8]">
            Complete reference for every RoofDynamics feature. Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-xs">?</kbd>{" "}
            in the top bar to replay the guided tour.
          </p>
        </div>
        <a
          href="/help.md"
          download="RoofDynamics-User-Guide.md"
          className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg hover:text-[#F8FAFC] transition text-sm"
        >
          <Download className="w-4 h-4" /> Download guide
        </a>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
        {loading && (
          <p className="text-sm text-[#94A3B8]">Loading help…</p>
        )}
        {error && (
          <p className="text-sm text-[#EF4444]">{error}</p>
        )}
        {!loading && !error && (
          <article className="prose prose-invert max-w-none prose-headings:text-[#F8FAFC] prose-p:text-[#94A3B8] prose-li:text-[#94A3B8] prose-strong:text-[#F8FAFC] prose-code:text-[#0EA5E9] prose-code:bg-[#0F172A] prose-code:px-1 prose-code:rounded prose-a:text-[#0EA5E9]">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <BookOpen className="w-3.5 h-3.5" />
        <span>Source: docs/USER_GUIDE.md in the repository.</span>
        <a
          href="https://github.com/ausgreekdev-cpu/RoofDynamics/blob/main/docs/USER_GUIDE.md"
          target="_blank"
          rel="noreferrer"
          className="text-[#0EA5E9] hover:underline inline-flex items-center gap-1"
        >
          View on GitHub <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
