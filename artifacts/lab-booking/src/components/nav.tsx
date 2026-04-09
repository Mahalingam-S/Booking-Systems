import { Link, useLocation } from "wouter";
import { Building2, Calendar, LayoutDashboard, Settings } from "lucide-react";

export function Nav() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Schedule", icon: Calendar },
    { href: "/book", label: "Book Lab", icon: Building2 },
    { href: "/stats", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin", label: "Admin Panel", icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass shadow-sm border-b border-border/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg border border-white/40 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-foreground leading-none">Amrita School of Computing</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Booking System</span>
            </div>
          </Link>
          <div className="hidden md:flex md:gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all rounded-full hover:bg-primary/5 ${isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
