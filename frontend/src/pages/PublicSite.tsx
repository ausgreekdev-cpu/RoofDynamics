"use client";

import React, { useState } from "react";
import { CheckCircle2, Phone, Mail, MapPin, Menu, X, ShieldCheck, Award, Clock } from "lucide-react";
import { ROICalculator, FreeReportForm, PricingTable, Blog } from "../features/marketing";

const SERVICES = [
  { title: "Roof Replacement", desc: "Complete re-roofing with Colorbond steel and 10-year workmanship warranty." },
  { title: "Roof Restoration", desc: "Repair, clean and re-coat your existing roof to extend its life." },
  { title: "Gutters & Downpipes", desc: "Roof plumbing work by licensed WA tradespeople." },
  { title: "Emergency Repairs", desc: "Fast response for storm damage and urgent roof leaks." },
  { title: "Asbestos Removal", desc: "Licensed Super Six removal with WorkSafe WA compliance." },
  { title: "Insulation", desc: "Anticon blanket installation for energy efficiency." },
];

export default function PublicSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", suburb: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A192F]/95 backdrop-blur border-b border-[#1E293B]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0EA5E9] rounded flex items-center justify-center text-[#0F172A] font-bold">RD</div>
            <div>
              <div className="font-bold text-sm">Perth Premier Roofing</div>
              <div className="text-[10px] text-[#94A3B8]">& Plumbing Pty Ltd</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="text-[#94A3B8] hover:text-[#F8FAFC]">Services</a>
            <a href="#about" className="text-[#94A3B8] hover:text-[#F8FAFC]">About</a>
            <a href="#contact" className="text-[#94A3B8] hover:text-[#F8FAFC]">Contact</a>
            <a href="#quote" className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8]">Get a Quote</a>
          </nav>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#94A3B8]">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="md:hidden px-4 pb-4 flex flex-col gap-3 text-sm">
            <a href="#services" onClick={() => setMenuOpen(false)} className="text-[#94A3B8]">Services</a>
            <a href="#about" onClick={() => setMenuOpen(false)} className="text-[#94A3B8]">About</a>
            <a href="#contact" onClick={() => setMenuOpen(false)} className="text-[#94A3B8]">Contact</a>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-xs font-medium mb-6">
          <ShieldCheck className="w-4 h-4" /> Licensed WA Roofing Specialists
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Perth Roofing Done <span className="text-[#0EA5E9]">Right</span>
        </h1>
        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto mb-8">
          Quality workmanship, AS/NZS compliant materials, and a 10-year warranty. Serving Fremantle, Scarborough, Cottesloe and all Perth metro suburbs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#quote" className="px-6 py-3 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8]">Get a Free Quote</a>
          <a href="tel:0890000000" className="px-6 py-3 border border-[#334155] text-[#F8FAFC] rounded-lg hover:bg-[#1E293B] flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" /> (08) 9000 0000
          </a>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-[#1E293B] bg-[#0A192F]/50">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex items-center justify-center gap-2"><Award className="w-5 h-5 text-[#10B981]" /><span className="text-sm text-[#94A3B8]">10-Year Workmanship Warranty</span></div>
          <div className="flex items-center justify-center gap-2"><ShieldCheck className="w-5 h-5 text-[#10B981]" /><span className="text-sm text-[#94A3B8]">WA Registered Builder</span></div>
          <div className="flex items-center justify-center gap-2"><Clock className="w-5 h-5 text-[#10B981]" /><span className="text-sm text-[#94A3B8]">20+ Years Experience</span></div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Our Services</h2>
        <p className="text-[#94A3B8] text-center mb-12">From full re-roofs to emergency repairs, we've got Perth covered.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-[#0EA5E9]/50 transition">
              <CheckCircle2 className="w-6 h-6 text-[#0EA5E9] mb-3" />
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-[#94A3B8]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-[#0A192F]/50 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Why Choose Us</h2>
          <p className="text-[#94A3B8] leading-relaxed mb-8">
            We're a Perth-owned roofing business committed to doing the job right the first time. Every roof is assessed against WA building regulations and AS/NZS standards, with coastal-grade materials for marine suburbs. Our crew holds current White Cards, Working at Heights tickets and plumbing licences.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["500+ Roofs Completed", "95% Customer Satisfaction", "Fully Insured", "Free Quotes"].map((stat) => (
              <div key={stat} className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 text-sm font-bold text-[#0EA5E9]">{stat}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" className="max-w-2xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Request a Free Quote</h2>
        <p className="text-[#94A3B8] text-center mb-8">Tell us about your roof and we'll get back to you within 24 hours.</p>
        {submitted ? (
          <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-[#10B981]" />
            <h3 className="text-xl font-bold mb-2">Thank you!</h3>
            <p className="text-[#94A3B8]">We've received your request and will be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4">
            <input required placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
              <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
            </div>
            <input required placeholder="Suburb" value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
            <textarea placeholder="Tell us about your roof..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
            <button type="submit" className="w-full py-3 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8]">Submit Quote Request</button>
          </form>
        )}
      </section>

      {/* ROI Calculator */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">See Your ROI</h2>
        <p className="text-[#94A3B8] text-center mb-8">Calculate how much RoofDynamics could save your roofing business.</p>
        <div className="[&_*]:!text-[#F8FAFC]">
          <ROICalculator />
        </div>
      </section>

      {/* Free report + pricing */}
      <section className="bg-[#0A192F]/50 py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <FreeReportForm />
          <div>
            <h2 className="text-2xl font-bold mb-4">Simple Pricing</h2>
            <div className="scale-90 origin-top-left">
              <PricingTable />
            </div>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Roofing Insights</h2>
        <p className="text-[#94A3B8] text-center mb-8">Expert advice for Perth homeowners and trade businesses.</p>
        <Blog />
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] bg-[#0A192F] py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="font-bold mb-2">Perth Premier Roofing</div>
              <p className="text-sm text-[#94A3B8]">& Plumbing Pty Ltd<br />ABN: 51 004 395 174</p>
            </div>
            <div id="contact">
              <div className="font-bold mb-2">Contact</div>
              <p className="text-sm text-[#94A3B8] flex items-center gap-2 mb-1"><Phone className="w-3 h-3" /> (08) 9000 0000</p>
              <p className="text-sm text-[#94A3B8] flex items-center gap-2 mb-1"><Mail className="w-3 h-3" /> info@perthpremier.com.au</p>
              <p className="text-sm text-[#94A3B8] flex items-center gap-2"><MapPin className="w-3 h-3" /> Perth, Western Australia</p>
            </div>
            <div>
              <div className="font-bold mb-2">Service Areas</div>
              <p className="text-sm text-[#94A3B8]">Fremantle, Scarborough, Cottesloe, Hillarys, Rockingham & all Perth metro</p>
            </div>
          </div>
          <div className="text-center text-xs text-[#64748B] border-t border-[#1E293B] pt-6">
            RoofDynamics — Powered by AusGreek Developments
          </div>
        </div>
      </footer>
    </div>
  );
}
