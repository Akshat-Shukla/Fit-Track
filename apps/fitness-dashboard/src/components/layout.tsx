import { useUser, useClerk } from "@clerk/react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  BarChart2,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Zap,
  Utensils,
  Settings,
  Scale,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Activity },
  { name: "Workouts", href: "/workouts", icon: Zap },
  { name: "Nutrition", href: "/nutrition", icon: Utensils },
  { name: "Progress", href: "/progress", icon: BarChart2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = location.replace(basePath, "") || "/";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>ApexTrak</span>
        </div>
        <button
          className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="md:hidden fixed inset-0 z-40 bg-background/97 backdrop-blur-xl mt-[57px]"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navigation.map((item) => {
                const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
              <div className="mt-6 pt-4 border-t border-border/30">
                <button
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors"
                  onClick={() => signOut({ redirectUrl: basePath || "/" })}
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Sign Out
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border/30 bg-card/20 sticky top-0 h-[100dvh] shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Activity className="h-4.5 w-4.5 text-primary-foreground" style={{ height: 18, width: 18 }} />
          </div>
          <span className="font-bold text-xl tracking-tight">ApexTrak</span>
        </div>

        <div className="px-3 mb-2">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-2 mb-1">Menu</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navigation.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-white/4 hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
                  )}
                  <item.icon
                    className={`h-4.5 w-4.5 shrink-0 transition-colors`}
                    style={{ height: 18, width: 18 }}
                  />
                  {item.name}
                  {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary/60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-border/30 space-y-2">
          <Link href="/settings">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors cursor-pointer group">
              <Avatar className="h-8 w-8 border border-border/50 shrink-0">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                  {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-medium truncate">{user?.firstName || "Athlete"}</span>
                <span className="text-[11px] text-muted-foreground truncate">{user?.emailAddresses[0]?.emailAddress}</span>
              </div>
            </div>
          </Link>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/4 rounded-lg transition-colors"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-5 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
