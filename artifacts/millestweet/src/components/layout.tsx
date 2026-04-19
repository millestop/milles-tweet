import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Search, User, Settings, Shield, LogOut, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row max-w-7xl mx-auto">
      {/* Sidebar for desktop, bottom nav for mobile */}
      <header className="md:w-64 border-b md:border-b-0 md:border-l border-border bg-background p-4 md:p-6 sticky top-0 md:h-screen md:sticky md:flex md:flex-col shrink-0 z-50">
        <Link href="/" className="flex items-center gap-3 text-primary mb-8 hover:opacity-80 transition-opacity">
          <MessageCircle className="w-8 h-8 fill-primary" />
          <span className="text-2xl font-bold hidden md:inline tracking-tight">ميلس تويت</span>
        </Link>

        {user && (
          <nav className="flex md:flex-col gap-2 flex-1 items-center md:items-stretch overflow-x-auto md:overflow-visible">
            <Link href="/">
              <Button variant={location === "/" ? "secondary" : "ghost"} className="w-full justify-start text-lg h-12" size="lg">
                <Home className="ml-4 w-6 h-6" />
                <span className="hidden md:inline">الرئيسية</span>
              </Button>
            </Link>
            <Link href="/search">
              <Button variant={location.startsWith("/search") ? "secondary" : "ghost"} className="w-full justify-start text-lg h-12" size="lg">
                <Search className="ml-4 w-6 h-6" />
                <span className="hidden md:inline">بحث</span>
              </Button>
            </Link>
            <Link href={`/profile/${user.username}`}>
              <Button variant={location.startsWith("/profile") ? "secondary" : "ghost"} className="w-full justify-start text-lg h-12" size="lg">
                <User className="ml-4 w-6 h-6" />
                <span className="hidden md:inline">الملف الشخصي</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant={location.startsWith("/settings") ? "secondary" : "ghost"} className="w-full justify-start text-lg h-12" size="lg">
                <Settings className="ml-4 w-6 h-6" />
                <span className="hidden md:inline">الإعدادات</span>
              </Button>
            </Link>
            {user.role === "admin" && (
              <Link href="/admin">
                <Button variant={location.startsWith("/admin") ? "secondary" : "ghost"} className="w-full justify-start text-lg h-12" size="lg">
                  <Shield className="ml-4 w-6 h-6" />
                  <span className="hidden md:inline">الإدارة</span>
                </Button>
              </Link>
            )}
            
            <div className="md:mt-auto hidden md:block">
              <Button variant="ghost" className="w-full justify-start text-lg h-12 text-destructive hover:text-destructive hover:bg-destructive/10" size="lg" onClick={handleLogout}>
                <LogOut className="ml-4 w-6 h-6" />
                <span>تسجيل الخروج</span>
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto border-r border-border min-h-screen">
        {children}
      </main>

      {/* Mobile Logout (shown in settings or bottom) */}
    </div>
  );
}
