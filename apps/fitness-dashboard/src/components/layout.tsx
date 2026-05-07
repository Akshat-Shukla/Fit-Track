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
  Coffee,
  Settings
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Activity },
    { name: "Workouts", href: "/workouts", icon: Zap },
    { name: "Nutrition", href: "/nutrition", icon: Coffee },
    { name: "Progress", href: "/progress", icon: BarChart2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const currentPath = location.replace(basePath, "") || "/";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Activity className="h-6 w-6 text-primary" />
          <span>FitTrack</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm mt-[73px]">
          <div className="flex flex-col p-4 gap-2">
            {navigation.map((item) => {
              const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
            <div className="mt-4 pt-4 border-t border-border/40">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r border-border/40 bg-card/30 sticky top-0 h-[100dvh]">
        <div className="p-6 flex items-center gap-2 font-bold text-2xl tracking-tight">
          <Activity className="h-7 w-7 text-primary" />
          <span>FitTrack</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group cursor-pointer ${
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium shadow-[0_0_15px_rgba(52,168,83,0.25)]" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "" : "group-hover:text-primary transition-colors"}`} />
                  {item.name}
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-70" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate">{user?.firstName || "Athlete"}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.emailAddresses[0]?.emailAddress}</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-foreground border-border/40 bg-background/50"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
