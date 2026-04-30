import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

// Re-export AdminLayout for backwards compatibility with existing admin pages
export { AdminLayout } from "./AdminLayout";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className = "" }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className={`flex-1 ${className}`}>{children}</main>
      <Footer />
    </div>
  );
}
