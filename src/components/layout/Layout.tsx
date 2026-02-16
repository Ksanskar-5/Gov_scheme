import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isChatPage = location.pathname === "/" || location.pathname === "/chat";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 relative">
        {children}
      </main>
      <Footer />
      {!isChatPage && <ChatWidget />}
    </div>
  );
}
