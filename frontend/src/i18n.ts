/**
 * RoofDynamics - Internationalization (i18n)
 * Multi-language support using react-i18next.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      app: {
        name: "RoofDynamics",
        tagline: "ERP for Roofing & Trade Businesses",
        poweredBy: "Powered by AusGreek Developments",
      },
      nav: {
        dashboard: "Executive BI",
        crm: "CRM & Quoting",
        wms: "WMS / MRP",
        hris: "Operations / HRIS",
        whs: "WHS Safety",
        eam: "Fleet / Equipment",
        accounting: "Accounting",
        website: "Public Website",
        aiSocial: "AI Social Agent",
        admin: "SaaS Super-Admin",
      },
      common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        add: "Add",
        search: "Search",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        noData: "No data available",
      },
      dashboard: {
        title: "Executive BI Dashboard",
        runAll: "Run All Empire Automations",
        totalQuotes: "Total Quotes",
        activeJobs: "Active Jobs",
        totalRevenue: "Total Revenue",
        lowStock: "Low Stock Items",
      },
      crm: {
        title: "CRM & Quoting",
        newQuote: "New Quote",
        acceptQuote: "Accept Quote",
        calculateBOM: "Calculate BOM",
        coastalZone: "Severe Marine Zone",
      },
      wms: {
        title: "WMS / MRP Manager",
        addItem: "Add Stock Item",
        reserveStock: "Reserve Stock",
        lowStock: "Low Stock",
      },
      hris: {
        title: "Operations / HRIS",
        addCrew: "Add Crew Member",
        weatherSafety: "Perth Weather & Wind Safety",
        unsafeWind: "High wind — UNSAFE for sheet laying",
        safeWind: "Wind conditions safe for roofing work",
      },
      accounting: {
        title: "Accounting & Progress Claims",
        createInvoice: "Create Invoice",
        milestone: "Milestone",
        deposit: "10% Deposit",
        materials: "50% Materials",
        completion: "40% Completion",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
