"use client";

import React, { useState } from "react";
import { FeatureGate } from "../components/FeatureGate";
import { PhoneCall, Globe2, Building2, CheckCircle2, ArrowRight } from "lucide-react";

export default function PublicWebsite() {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <FeatureGate moduleKey="PUBLIC_WEBSITE">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Public Website</h1>
            <p className="text-[#94A3B8]">White-label public website for your roofing trade business</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg hover:text-[#F8FAFC] transition"
            >
              <Globe2 className="w-4 h-4" />
              Quick Preview
            </button>
            <a
              href="/site"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
            >
              <Globe2 className="w-4 h-4" />
              Open Public Site
            </a>
          </div>
        </div>

        {/* Website Builder Preview */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <div className="bg-[#0A192F] p-4 border-b border-[#1E293B]">
            <h3 className="text-sm font-bold text-[#F8FAFC]">Website Builder</h3>
            <p className="text-xs text-[#64748B] mt-1">White-label branding per tenant</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-[#0EA5E9]" />
                  <span className="text-sm font-bold text-[#F8FAFC]">Hero Section</span>
                </div>
                <p className="text-xs text-[#94A3B8] mb-3">
                  "Expert Roofing Services in Perth WA - Quality Workmanship Guaranteed"
                </p>
                <button className="text-xs text-[#0EA5E9] hover:underline">Edit Content</button>
              </div>
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PhoneCall className="w-5 h-5 text-[#0EA5E9]" />
                  <span className="text-sm font-bold text-[#F8FAFC]">Contact Form</span>
                </div>
                <p className="text-xs text-[#94A3B8] mb-3">
                  Free quote request with roof pitch calculator integration
                </p>
                <button className="text-xs text-[#0EA5E9] hover:underline">Edit Fields</button>
              </div>
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#0EA5E9]" />
                  <span className="text-sm font-bold text-[#F8FAFC]">Service Areas</span>
                </div>
                <p className="text-xs text-[#94A3B8] mb-3">
                  Fremantle, Scarborough, Cottesloe, Hillarys, Rockingham & Perth Metro
                </p>
                <button className="text-xs text-[#0EA5E9] hover:underline">Edit Areas</button>
              </div>
            </div>
          </div>
        </div>

        {/* Publishing Controls */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4">Publishing</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#F8FAFC]">Website Status</p>
                <p className="text-xs text-[#94A3B8]">Published at tenant-domain.roofdynamics.com.au</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#F8FAFC]">Custom Domain</p>
                <p className="text-xs text-[#94A3B8]">Not configured</p>
              </div>
              <button className="px-3 py-1 text-xs text-[#0EA5E9] hover:underline">Configure DNS</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#F8FAFC]">SSL Certificate</p>
                <p className="text-xs text-[#94A3B8]">Active</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {previewOpen && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border border-[#334155] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
                <h2 className="text-lg font-bold text-[#F8FAFC]">Website Preview</h2>
                <button onClick={() => setPreviewOpen(false)} className="text-[#94A3B8] hover:text-[#F8FAFC] text-2l">✕</button>
              </div>
              <div className="flex-1 overflow-auto p-8">
                <div className="max-w-md mx-auto">
                  <div className="bg-[#1E293B] rounded-xl overflow-hidden shadow-2xl border border-[#334155]">
                    <div className="bg-[#0EA5E9] p-6 text-center">
                      <div className="w-12 h-12 bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-3 text-[#0F172A] font-bold text-xl">RD</div>
                      <h1 className="text-2xl font-bold text-[#F8FAFC]">Perth Premier Roofing</h1>
                      <p className="text-[#94A3B8] mt-2">Expert Roofing & Trade Services in Perth WA</p>
                    </div>
                    <div className="p-6">
                      <h2 className="text-lg font-bold text-[#F8FAFC] mb-4">Our Services</h2>
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center gap-2 text-[#94A3B8]">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          Roof Replacement & Restoration
                        </li>
                        <li className="flex items-center gap-2 text-[#94A3B8]">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          Guttering & Downpipes
                        </li>
                        <li className="flex items-center gap-2 text-[#94A3B8]">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          Roof Plumbing
                        </li>
                        <li className="flex items-center gap-2 text-[#94A3B8]">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          Emergency Roof Repairs
                        </li>
                      </ul>
                      <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                        <h3 className="text-sm font-bold text-[#F8FAFC] mb-3">Request a Free Quote</h3>
                        <form className="space-y-3">
                          <input type="text" placeholder="Your Name" className="w-full px-3 py-2 bg-[#0EA5E9]/10 border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
                          <input type="email" placeholder="Email Address" className="w-full px-3 py-2 bg-[#0EA5E9]/10 border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
                          <input type="text" placeholder="Suburb" className="w-full px-3 py-2 bg-[#0EA5E9]/10 border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
                          <button className="w-full py-3 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition">Get Quote</button>
                        </form>
                      </div>
                    </div>
                    <div className="bg-[#0A192F] p-4 text-center border-t border-[#1E293B]">
                      <p className="text-xs text-[#64748B]">RoofDynamics — Powered by AusGreek Developments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
