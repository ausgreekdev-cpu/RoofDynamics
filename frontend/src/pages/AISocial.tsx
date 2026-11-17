"use client";

import React, { useState } from "react";
import { FeatureGate } from "../components/FeatureGate";
import { aiAgentService, type AgentResult } from "../services/aiAgentService";
import { Bot, MapPin, Play, RefreshCw, CheckCircle2, Share2, ThumbsUp } from "lucide-react";

const SAMPLE_SUBURBS = [
  "Fremantle",
  "Scarborough",
  "Cottesloe",
  "Hillarys",
  "Rockingham",
  "Joondalup",
  "Midland",
  "Armadale",
];

export default function AISocial() {
  const [suburb, setSuburb] = useState("Fremantle");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [feed, setFeed] = useState<string[]>([]);

  const handleGenerate = async () => {
    setRunning(true);
    setFeed([]);
    setResult(null);

    const addFeed = (msg: string) => {
      setFeed((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${msg}`]);
    };

    try {
      addFeed("Initializing Social Media & Local SEO Agent...");
      await new Promise((r) => setTimeout(r, 400));
      addFeed(`Analysing before/after photos for ${suburb}...`);
      await new Promise((r) => setTimeout(r, 400));
      addFeed("Generating geo-tagged Perth suburb posts...");
      await new Promise((r) => setTimeout(r, 400));

      const agentResult = await aiAgentService.runSocialMediaSEOAgent({
        photos: [
          { url: "/images/before-fremantle.jpg", suburb },
          { url: "/images/after-fremantle.jpg", suburb },
        ],
        suburb,
      });

      setResult(agentResult);
      addFeed(`✓ Generated ${agentResult.data.totalPosts} geo-tagged posts for ${suburb}`);
      addFeed("Posts ready for Facebook & Instagram publishing.");
    } catch (err: any) {
      addFeed(`✗ Agent failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <FeatureGate moduleKey="AI_SOCIAL_AGENT">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">AI Social Media & Local SEO Agent</h1>
            <p className="text-[#94A3B8]">Turn Before/After roof photos into geo-tagged Perth suburb posts</p>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#94A3B8] mb-2">Perth Suburb</label>
              <select
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              >
                {SAMPLE_SUBURBS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={running}
              className="px-6 py-3 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] disabled:opacity-50 transition flex items-center gap-2"
            >
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Generate Posts
                </>
              )}
            </button>
          </div>
        </div>

        {/* Execution Feed */}
        {feed.length > 0 && (
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-4 font-mono text-xs space-y-1">
            {feed.map((line, i) => (
              <div key={i} className="text-[#94A3B8]">{line}</div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Generated {result.data.totalPosts} geo-tagged posts for {result.data.suburb}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.data.posts?.map((post: any) => (
                <div key={post.id} className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
                  <div className="h-40 bg-[#0F172A] flex items-center justify-center relative">
                    <img
                      src={post.imageUrl}
                      alt={post.suburb}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[#64748B]">
                      <Bot className="w-10 h-10" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-3 h-3 text-[#0EA5E9]" />
                      <span className="text-xs text-[#0EA5E9] font-medium">{post.geoTag}</span>
                    </div>
                    <p className="text-sm text-[#F8FAFC] mb-3">{post.caption}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-[#1877F2]/20 text-[#1877F2] text-xs flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> Facebook
                      </span>
                      <span className="px-2 py-1 rounded bg-[#E4405F]/20 text-[#E4405F] text-xs flex items-center gap-1">
                        <Share2 className="w-3 h-3" /> Instagram
                      </span>
                      <span className="ml-auto text-xs text-[#64748B]">{post.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
