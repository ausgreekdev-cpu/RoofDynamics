"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { code: "en", label: "EN" },
  ];

  return (
    <div className="flex items-center gap-1">
      <Globe className="w-3.5 h-3.5 text-[#94A3B8]" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-2 py-1 text-xs rounded transition ${
            i18n.language === lang.code
              ? "bg-[#0EA5E9] text-[#0F172A] font-bold"
              : "text-[#94A3B8] hover:text-[#F8FAFC]"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
