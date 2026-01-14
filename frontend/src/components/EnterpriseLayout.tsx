import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Menu,
  FileText,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Book,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ExperienceSelector } from "@/components/ExperienceSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useExperience } from "utils/experience-context";
import { ChevronRight } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export function EnterpriseLayout({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { experience } = useExperience();

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Tickets", path: "/tickets", icon: FileText },
    { label: "System Status", path: "/status", icon: Activity },
    { label: "Compliance Docs", path: "/docs", icon: Book },
    { label: "API Reference", path: "/api", icon: Settings },
    { label: "About", path: "/about", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2 shadow-sm bg-white dark:bg-slate-950">
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
        
        {/* Desktop Nav - Simplified */}
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium mr-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                <LayoutDashboard className="h-5 w-5" />
                <span>Portal</span>
            </Link>
             
             {experience === 'classic' ? (
                // Misleading breadcrumbs for Enterprise
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Home</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>IT Service Management</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Self-Service</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-bold text-foreground">Submit Request (Read-Only)</span>
                </div>
             ) : (
                 // Standard Nav
                 navItems.map((item) => (
                    <Link
                    key={item.path}
                    to={item.path}
                    className={`transition-colors hover:text-foreground/80 ${
                        location.pathname === item.path ? "text-foreground" : "text-foreground/60"
                    }`}
                    >
                    {item.label}
                    </Link>
                ))
             )}
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:px-6 sm:py-0 overflow-auto">
         {children}
      </main>
      
      <footer className="border-t py-4 text-center text-xs text-muted-foreground bg-white dark:bg-slate-950">
        <p>&copy; {new Date().getFullYear()} PendingJustification Inc. All rights reserved. Working as designed.</p>
        <p className="mt-1">Internal Use Only. Do not distribute outside of the intranet.</p>
      </footer>
    </div>
  );
}
