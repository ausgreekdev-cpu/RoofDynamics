"use client";

import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import { Tutorial } from "./components/Tutorial";
import { SkeletonTable } from "./components/Skeleton";

// Lazy-loaded pages
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const CRMQuoting = React.lazy(() => import("./pages/CRMQuoting"));
const WMSMRP = React.lazy(() => import("./pages/WMSMRP"));
const OperationsHRIS = React.lazy(() => import("./pages/OperationsHRIS"));
const WHSSafety = React.lazy(() => import("./pages/WHSSafety"));
const EAM = React.lazy(() => import("./pages/EAM"));
const Accounting = React.lazy(() => import("./pages/Accounting"));
const PublicWebsite = React.lazy(() => import("./pages/PublicWebsite"));
const AISocial = React.lazy(() => import("./pages/AISocial"));
const SaaSAdmin = React.lazy(() => import("./pages/SaaSAdmin"));
const AdvancedReports = React.lazy(() => import("./pages/AdvancedReports"));
const PublicSite = React.lazy(() => import("./pages/PublicSite"));
const Projects = React.lazy(() => import("./pages/Projects"));
const Measurement = React.lazy(() => import("./pages/Measurement"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Pipeline = React.lazy(() => import("./pages/Pipeline"));
const Operations = React.lazy(() => import("./pages/Operations"));
const Billing = React.lazy(() => import("./pages/Billing"));
const Compliance = React.lazy(() => import("./pages/Compliance"));
const Help = React.lazy(() => import("./pages/Help"));
const DeveloperTools = React.lazy(() => import("./pages/DeveloperTools"));

const PageLoader = () => (
  <div className="space-y-4">
    <SkeletonTable rows={3} cols={4} />
  </div>
);

function AppRouter() {
  const { token, isAuthenticated } = useAuth();

  // Public website is accessible without authentication
  if (window.location.pathname === "/site" || window.location.pathname === "/public") {
    return (
      <ErrorBoundary moduleName="Public Website">
        <Suspense fallback={<PageLoader />}>
          <PublicSite />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary moduleName="Login">
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
      <TopBar />
      <Sidebar />
      <div className="lg:pl-64 pt-16 p-4">
        <ErrorBoundary moduleName="AppRouter">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<ErrorBoundary moduleName="Dashboard"><Dashboard /></ErrorBoundary>} />
              <Route path="/dashboard" element={<ErrorBoundary moduleName="Dashboard"><Dashboard /></ErrorBoundary>} />
              <Route path="/crm" element={<ErrorBoundary moduleName="CRM & Quoting"><CRMQuoting /></ErrorBoundary>} />
              <Route path="/wms" element={<ErrorBoundary moduleName="WMS / MRP"><WMSMRP /></ErrorBoundary>} />
              <Route path="/hris" element={<ErrorBoundary moduleName="Operations / HRIS"><OperationsHRIS /></ErrorBoundary>} />
              <Route path="/whs" element={<ErrorBoundary moduleName="WHS Safety"><WHSSafety /></ErrorBoundary>} />
              <Route path="/eam" element={<ErrorBoundary moduleName="Fleet / Equipment"><EAM /></ErrorBoundary>} />
              <Route path="/accounting" element={<ErrorBoundary moduleName="Accounting"><Accounting /></ErrorBoundary>} />
              <Route path="/website" element={<ErrorBoundary moduleName="Public Website"><PublicWebsite /></ErrorBoundary>} />
              <Route path="/ai-social" element={<ErrorBoundary moduleName="AI Social Agent"><AISocial /></ErrorBoundary>} />
              <Route path="/admin" element={<ErrorBoundary moduleName="SaaS Super-Admin"><SaaSAdmin /></ErrorBoundary>} />
          <Route path="/reports" element={<ErrorBoundary moduleName="Advanced Reports"><AdvancedReports /></ErrorBoundary>} />
          <Route path="/projects" element={<ErrorBoundary moduleName="Projects"><Projects /></ErrorBoundary>} />
          <Route path="/measurement" element={<ErrorBoundary moduleName="Measurement"><Measurement /></ErrorBoundary>} />
          <Route path="/reports-studio" element={<ErrorBoundary moduleName="Report Studio"><Reports /></ErrorBoundary>} />
          <Route path="/pipeline" element={<ErrorBoundary moduleName="CRM Pipeline"><Pipeline /></ErrorBoundary>} />
          <Route path="/operations" element={<ErrorBoundary moduleName="Operations Dispatch"><Operations /></ErrorBoundary>} />
          <Route path="/billing" element={<ErrorBoundary moduleName="Billing"><Billing /></ErrorBoundary>} />
          <Route path="/compliance" element={<ErrorBoundary moduleName="Compliance"><Compliance /></ErrorBoundary>} />
          <Route path="/help" element={<ErrorBoundary moduleName="Help"><Help /></ErrorBoundary>} />
          <Route path="/dev-tools" element={<ErrorBoundary moduleName="Developer Tools"><DeveloperTools /></ErrorBoundary>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary moduleName="App">
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <TutorialProvider>
                <AppRouter />
                <Tutorial />
              </TutorialProvider>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
