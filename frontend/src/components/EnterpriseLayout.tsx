import { ReactNode, useMemo, useRef, useCallback, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Menu,
  FileText,
  Settings,
  HelpCircle,
  Bell,
  Book,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ExperienceSelector } from "@/components/ExperienceSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useExperience } from "utils/experience-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  children: ReactNode;
}

type NavItem = {
  label: string;
  path: string;
  icon: any;
};

export function EnterpriseLayout({ children }: Props) {
  const location = useLocation();
  const { experience } = useExperience();

  // Reuse the same popup window instead of spawning new ones
  const homeWinRef = useRef<Window | null>(null);

  const openHomePopup = useCallback(() => {
    const popupUrl = "/home";

    const w = 960;
    const h = 650;

    // Center relative to current browser window
    const left = Math.max(
      0,
      Math.round(window.screenX + (window.outerWidth - w) / 2)
    );
    const top = Math.max(
      0,
      Math.round(window.screenY + (window.outerHeight - h) / 2)
    );

    const features = [
      `width=${w}`,
      `height=${h}`,
      `left=${left}`,
      `top=${top}`,
      "resizable=yes",
      "scrollbars=yes",
      "toolbar=no",
      "menubar=no",
      "location=no",
      "status=no",
    ].join(",");

    // If we already opened one and it’s still alive, just focus it.
    const existing = homeWinRef.current;
    if (existing && !existing.closed) {
      existing.focus();
      return;
    }

    const win = window.open(popupUrl, "pj-home", features);
    if (win) {
      homeWinRef.current = win;
      win.focus();
    }
  }, []);

  // Clean up the ref if user closes the popup
  useEffect(() => {
    const t = window.setInterval(() => {
      const w = homeWinRef.current;
      if (w && w.closed) homeWinRef.current = null;
    }, 1500);
    return () => window.clearInterval(t);
  }, []);

  const navItems: NavItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Tickets", path: "/tickets", icon: FileText },
    { label: "System Status", path: "/status", icon: Activity },
    { label: "Compliance Docs", path: "/docs", icon: Book },
    { label: "API Reference", path: "/api", icon: Settings },
    { label: "About", path: "/about", icon: HelpCircle },
  ];

  const activeNav = useMemo(() => {
    return navItems.find((n) => location.pathname === n.path) || null;
  }, [location.pathname]);

  const crumbs = useMemo(() => {
    if (activeNav) return ["Home", activeNav.label];
    return ["Home"];
  }, [activeNav]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b bg-white dark:bg-slate-950 shadow-sm">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6 py-2">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <button
                  type="button"
                  onClick={openHomePopup}
                  className="flex items-center gap-2 font-semibold text-left"
                  aria-label="Open Home popup"
                  title="Open Home"
                >
                  <LayoutDashboard className="h-6 w-6" />
                  <span>Enterprise Portal</span>
                </button>

                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-4 px-2.5 ${
                      location.pathname === item.path
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium mr-4">
            <button
              type="button"
              onClick={openHomePopup}
              className="flex items-center gap-2 font-bold text-lg hover:opacity-90"
              aria-label="Open Home popup"
              title="Open Home"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Portal</span>
            </button>

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === item.path
                    ? "text-foreground"
                    : "text-foreground/60"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="w-full max-w-[200px] hidden md:block">
              <ExperienceSelector />
            </div>

            {/* Notification bell with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                  <span className="text-xs">made ya click</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Breadcrumb row */}
        <div className="hidden sm:block px-6 pb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {crumbs.map((c, idx) => {
              const isHome = idx === 0 && c === "Home";
              const isLast = idx === crumbs.length - 1;

              return (
                <span key={`${c}-${idx}`} className="flex items-center gap-2">
                  {idx > 0 && <ChevronRight className="h-3 w-3" />}

                  {isHome ? (
                    <button
                      type="button"
                      onClick={openHomePopup}
                      className="hover:text-foreground underline underline-offset-2"
                      aria-label="Open Home popup"
                      title="Open Home"
                    >
                      {c}
                    </button>
                  ) : (
                    <span className={isLast ? "font-bold text-foreground" : ""}>
                      {c}
                    </span>
                  )}
                </span>
              );
            })}

            <span className="ml-3 rounded border px-2 py-0.5 text-[10px] text-muted-foreground">
              Experience: {experience}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:px-6 sm:py-0 overflow-auto">
        {children}
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground bg-white dark:bg-slate-950">
        <p>
          &copy; {new Date().getFullYear()} PendingJustification Inc. All rights
          reserved. Working as designed.
        </p>
        <p className="mt-1">
          Internal Use Only. Do not distribute outside of the intranet.
        </p>
      </footer>
    </div>
  );
}
