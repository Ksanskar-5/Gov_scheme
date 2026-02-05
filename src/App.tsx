import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SearchSchemes from "./pages/SearchSchemes";
import SchemeDetail from "./pages/SchemeDetail";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MySchemes from "./pages/MySchemes";
import Login from "./pages/Login";
import AIChat from "./pages/AIChat";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";
import HelpCenter from "./pages/HelpCenter";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Disclaimer from "./pages/Disclaimer";

import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AIChat />} />
            <Route path="/landing" element={<Index />} />
            <Route path="/search" element={<SearchSchemes />} />
            <Route path="/scheme/:id" element={<SchemeDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-schemes" element={<MySchemes />} />
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
