import { ReactNode, useMemo } from "react";
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
import { ChevronRight } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

type NavItem = {
  label: string;
  path: string;
  icon: any;
};

export function EnterpriseLayout({ children }: Props) {
  const location = useLocation();
  const { experience } = useExperience();

  const navItems: NavItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Tickets", path: "/tickets", icon: FileText },
    { label: "System Status", path: "/status", icon: Activity },
    { label: "Compliance Docs", path: "/docs", icon: Book },
    { label: "API Reference", path: "/api", icon: Settings },
    { label: "About", path: "/about", icon: HelpCircle },
  ];

  const activeNav = useMemo(() => {
    // Basic matching; you can enhance later for nested routes.
    return navItems.find((n) => location.pathname === n.path) || null;
  }, [location.pathname]);

  const crumbs = useMemo(() => {
    // Route-driven breadcrumb. Experience should NOT rewrite navigation.
    // If you later add nested routes, expand this mapping.
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
                <div className="flex items-center gap-2 font-semibold">
                  <LayoutDashboard className="h-6 w-6" />
                  <span>Enterprise Portal</span>
                </div>
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

          {/* Desktop: Portal + top nav always visible */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium mr-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <LayoutDashboard className="h-5 w-5" />
              <span>Portal</span>
            </Link>

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

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            </Button>

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

        {/* Optional breadcrumb row (route-driven) */}
        <div className="hidden sm:block px-6 pb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {crumbs.map((c, idx) => (
              <span key={`${c}-${idx}`} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={idx === crumbs.length - 1 ? "font-bold text-foreground" : ""}>
                  {c}
                </span>
              </span>
            ))}

            {/* Small indicator so you can still tell which experience is active without rewriting nav */}
            <span className="ml-3 rounded border px-2 py-0.5 text-[10px] text-muted-foreground">
              Experience: {experience}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:px-6 sm:py-0 overflow-auto">{children}</main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground bg-white dark:bg-slate-950">
        <p>&copy; {new Date().getFullYear()} PendingJustification Inc. All rights reserved. Working as designed.</p>
        <p className="mt-1">Internal Use Only. Do not distribute outside of the intranet.</p>
      </footer>
    </div>
  );
}
