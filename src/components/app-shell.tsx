"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ROLE_NAV, titleForView } from "@/lib/nav";
import { ROLE_LABELS, type SessionUser } from "@/lib/auth-shared";
import { useNotifications } from "@/lib/queries";
import { shortName, formatRelativeTime } from "@/lib/format";
import {
  Sofa,
  Bell,
  Menu,
  LogOut,
  Search,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ViewRouter } from "./view-router";

export function AppShell({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>(() => {
    const nav = ROLE_NAV[user.role];
    return nav[0]?.view ?? "admin";
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const nav = useMemo(() => ROLE_NAV[user.role] ?? [], [user.role]);

  function chooseView(view: string) {
    setActiveView(view);
    setSelectedId(null);
    setSelectedSub(null);
    setMobileOpen(false);
  }

  async function logout() {
    try {
      await signOut({ redirect: false });
      toast.success("You have been signed out");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar">
          <SidebarContent
            user={user}
            nav={nav}
            activeView={activeView}
            onSelect={chooseView}
            onLogout={logout}
          />
        </aside>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden fixed top-3 left-3 z-40 h-10 w-10"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent
              user={user}
              nav={nav}
              activeView={activeView}
              onSelect={chooseView}
              onLogout={logout}
            />
          </SheetContent>
        </Sheet>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar user={user} activeView={activeView} />
          <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
            <ViewRouter
              user={user}
              view={activeView}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              selectedSub={selectedSub}
              setSelectedSub={setSelectedSub}
              navigate={chooseView}
            />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function SidebarContent({
  user,
  nav,
  activeView,
  onSelect,
  onLogout,
}: {
  user: SessionUser;
  nav: { label: string; view: string; icon: any }[];
  activeView: string;
  onSelect: (v: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 p-4 border-b">
        <div className="rounded-lg bg-amber-700 text-amber-50 p-2">
          <Sofa className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            Al Gurg Furniture
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Operations Portal
          </p>
        </div>
      </div>

      <div className="px-3 py-3 border-b">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9 border">
            <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-semibold dark:bg-amber-950 dark:text-amber-200">
              {shortName(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <Badge
              variant="outline"
              className="text-[10px] bg-amber-50/60 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
            >
              {(ROLE_LABELS as any)[user.role] || user.role}
            </Badge>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-0.5 px-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.view === activeView;
            return (
              <button
                key={item.view}
                onClick={() => onSelect(item.view)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors min-h-[44px] text-left",
                  active
                    ? "bg-amber-700 text-amber-50 font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {active && (
                  <ChevronRight className="size-4 ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

function Topbar({ user, activeView }: { user: SessionUser; activeView: string }) {
  const { data } = useNotifications<{ items: any[]; unread: number }>();
  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5">
        <div className="lg:hidden w-10" />
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold truncate">
            {titleForView(activeView)}
          </h1>
        </div>

        <div className="hidden md:block w-64">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-9 pl-8 text-sm bg-muted/40 border-transparent focus-visible:border-input"
            />
          </div>
        </div>

        <NotificationsBell items={items} unread={unread} />

        <Avatar className="size-8 border">
          <AvatarFallback className="bg-amber-100 text-amber-800 text-[10px] font-semibold dark:bg-amber-950 dark:text-amber-200">
            {shortName(user.name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function NotificationsBell({
  items,
  unread,
}: {
  items: any[];
  unread: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center text-[10px] font-bold text-white bg-red-600 rounded-full min-w-[16px] h-4 px-1">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] bg-red-50 text-red-700 border-red-200"
            >
              {unread} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No notifications
            </p>
          ) : (
            items.slice(0, 12).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start py-2.5 px-3 gap-0.5 cursor-pointer"
                onClick={async () => {
                  if (!n.read) {
                    await fetch("/api/data", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "mark-notification-read",
                        id: n.id,
                      }),
                    });
                  }
                }}
              >
                <div className="flex items-start gap-2 w-full">
                  {!n.read && (
                    <span className="mt-1.5 size-1.5 rounded-full bg-amber-600 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Al Gurg Furniture Group | Operations Portal
        </p>
        <div className="flex items-center gap-3">
          <span>© 2026 Al Gurg Furniture Group. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
