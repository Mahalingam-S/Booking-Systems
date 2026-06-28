import { Link, useLocation } from "wouter";
import { Building2, Calendar, LayoutDashboard, Settings, Menu } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function Nav() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", icon: Calendar },
    { href: "/book", label: "Book Lab", icon: Building2 },
    { href: "/stats", label: "Stats", icon: LayoutDashboard },
    { href: "/admin", label: "Admin", icon: Settings },
  ];

  const NavItem = ({ link, mobile = false }: { link: typeof links[0], mobile?: boolean }) => {
    const Icon = link.icon;
    const isActive = location === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setIsOpen(false)}
        className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all rounded-xl ${isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          } ${mobile ? "w-full text-base py-4" : ""}`}
      >
        <Icon className={`${mobile ? "h-5 w-5" : "h-4 w-4"}`} />
        {link.label}
        {isActive && !mobile && (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full glass shadow-sm border-b border-border/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-95 shrink-0">
              <div className="flex flex-col min-w-0">
                <span className="text-base md:text-xl font-black tracking-tighter text-foreground leading-none truncate md:overflow-visible">Booking System</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex md:gap-1">
              {links.filter(l => l.href !== "/book").map((link) => (
                <NavItem key={link.href} link={link} />
              ))}
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Bottom Bar Nav (Excluding Book Lab as it's now on the cards) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-2">
          {links.filter(l => l.href !== "/book").map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all active:scale-90 relative ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/10" : ""}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  {link.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
