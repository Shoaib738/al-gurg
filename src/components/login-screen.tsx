"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  KeyRound,
  ArrowRight,
  LogOut,
  ExternalLink,
  User,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth-shared";
import { toast } from "sonner";

// Internal team directory shown on the login screen.
// Each account has a Login ID (AG001 to AG011) and a default password.
// In production these are set by the administrator and rotated on first login.
const TEAM_ACCOUNTS = [
  { loginId: "AG001", name: "System Administrator", role: "ADMIN" },
  { loginId: "AG002", name: "Mazen Al Gurg", role: "BUSINESS_MANAGER" },
  { loginId: "AG003", name: "Roy Mathew", role: "ESTIMATION" },
  { loginId: "AG004", name: "Sales Team", role: "SALES" },
  { loginId: "AG005", name: "Nimesha Perera", role: "PROCUREMENT" },
  { loginId: "AG006", name: "Store Keeper", role: "STORE" },
  { loginId: "AG007", name: "Venketeswaram", role: "QC" },
  { loginId: "AG008", name: "Motasem Al Rashid", role: "PRODUCTION" },
  { loginId: "AG009", name: "Technical Drafter", role: "ENGINEERING" },
  { loginId: "AG010", name: "Wasim Khan", role: "PROJECT" },
  { loginId: "AG011", name: "Finance Officer", role: "FINANCE" },
] as const;

const DEFAULT_PASSWORD = "Welcome@2026";

interface SignedInUser {
  name: string;
  role: string;
  loginId?: string;
}

export function LoginScreen() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedInUser, setSignedInUser] = useState<SignedInUser | null>(null);

  // On mount, check if a session already exists (e.g. user navigated back
  // to the login tab after signing in). This fetches the session from the
  // NextAuth endpoint without a full page refresh.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (active && data?.user) {
          setSignedInUser({
            name: data.user.name || "User",
            role: data.user.role || "",
            loginId: data.user.loginId,
          });
        }
      } catch {
        // ignore — user is not signed in
      }
    })();
    return () => { active = false; };
  }, []);

  // When a session exists on the login tab, show a "logged in" panel
  // so the user can open the dashboard in a new tab or sign out to
  // switch accounts. The dashboard itself opens in a separate tab.
  if (signedInUser) {
    return (
      <LoggedInPanel
        userName={signedInUser.name}
        userRole={signedInUser.role}
        loginId={signedInUser.loginId}
        onSignOut={() => {
          setSignedInUser(null);
          setLoginId("");
          setPassword("");
        }}
      />
    );
  }

  async function handleLogin(idToUse?: string, passwordToUse?: string) {
    const lid = (idToUse ?? loginId).trim();
    const pw = passwordToUse ?? password;
    if (!lid) {
      toast.error("Please enter your Login ID");
      return;
    }
    if (!pw || pw.length < 4) {
      toast.error("Please enter your password");
      return;
    }
    setLoading(true);
    try {
      const { signIn } = await import("next-auth/react");
      const res = await signIn("credentials", {
        loginId: lid,
        password: pw,
        redirect: false,
      });
      if (!res || res.error) {
        toast.error("Invalid Login ID or password. Please try again.");
        return;
      }

      // Fetch the session to get user details for the logged-in panel.
      let user: SignedInUser | null = null;
      try {
        const sessRes = await fetch("/api/auth/session");
        const sessData = await sessRes.json();
        if (sessData?.user) {
          user = {
            name: sessData.user.name || "User",
            role: sessData.user.role || "",
            loginId: sessData.user.loginId,
          };
        }
      } catch {
        // session fetch failed, continue without user details
      }

      // Open the dashboard in a new browser tab. The session cookie is
      // already set, so the new tab will load the AppShell directly.
      const newTab = window.open("/", "_blank");
      if (!newTab) {
        toast.success("Signed in. Use the button below to open the dashboard.", {
          duration: 6000,
        });
      } else {
        toast.success("Signed in. Dashboard opened in a new tab.");
      }

      // Update local state to show the logged-in panel.
      if (user) {
        setSignedInUser(user);
      }
      // Clear the form.
      setLoginId("");
      setPassword("");
    } catch (e: any) {
      toast.error(e?.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function pickAccount(acc: { loginId: string }) {
    setLoginId(acc.loginId);
    setPassword(DEFAULT_PASSWORD);
    handleLogin(acc.loginId, DEFAULT_PASSWORD);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-background to-orange-50/40 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10">
      <main className="flex-1 flex flex-col lg:flex-row items-stretch">
        {/* Brand panel */}
        <section className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-800 via-amber-700 to-orange-800 text-amber-50 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 size-72 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-0 size-96 rounded-full bg-orange-300 blur-3xl" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50/15 p-2 backdrop-blur flex items-center justify-center h-12 w-14">
                <img
                  src="/algurg-logo.svg"
                  alt="Al Gurg Group"
                  className="h-8 w-auto"
                />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">
                  Al Gurg Group
                </p>
                <p className="text-xs text-amber-100/80">
                  Operations Portal
                </p>
              </div>
            </div>
          </div>
          <div className="relative space-y-3">
            <h1 className="text-3xl font-bold leading-tight">
              One workflow from enquiry to installation.
            </h1>
            <p className="text-sm text-amber-100/85 max-w-md">
              Manage client enquiries, quotations and approvals. Coordinate
              procurement, store, quality control, multi stage production,
              engineering drawings, delivery and finance in a single role aware
              workspace built for furniture manufacturers.
            </p>
            <ul className="text-xs text-amber-100/80 space-y-1.5 pt-2 list-disc pl-4">
              <li>Role based dashboards for every department</li>
              <li>Sequential production stages with QC gates</li>
              <li>Full project timeline and audit trail</li>
              <li>Supplier and procurement workflow with LPO tracking</li>
            </ul>
          </div>
          <p className="relative text-xs text-amber-100/60">
            © 2026 Al Gurg Group. All rights reserved.
          </p>
        </section>

        {/* Login panel */}
        <section className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden flex items-center gap-3">
              <div className="rounded-xl bg-amber-800 p-1.5 flex items-center justify-center h-11 w-12">
                <img
                  src="/algurg-logo.svg"
                  alt="Al Gurg Group"
                  className="h-7 w-auto"
                />
              </div>
              <div>
                <p className="font-semibold tracking-tight">
                  Al Gurg Group
                </p>
                <p className="text-xs text-muted-foreground">
                  Operations Portal
                </p>
              </div>
            </div>

            <Card className="rounded-xl shadow-sm">
              <CardHeader className="space-y-1">
                <h2 className="text-xl font-bold">Sign in to your account</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your Login ID and password to continue. The dashboard
                  will open in a new tab.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="loginId">Login ID</Label>
                    <Input
                      id="loginId"
                      type="text"
                      autoComplete="username"
                      value={loginId}
                      onChange={(e) => {
                        const v = e.target.value;
                        // Auto-uppercase only if it looks like a login ID
                        // (no @ sign). Emails are kept as-is.
                        setLoginId(v.includes("@") ? v : v.toUpperCase());
                      }}
                      placeholder="AG001"
                      className="h-11 font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Enter your Login ID (e.g. AG001) or email address.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                    Sign in &amp; open dashboard
                  </Button>
                </form>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Team directory
                  </span>
                  <Separator className="flex-1" />
                </div>

                <TeamAccountsGrid onPick={pickAccount} loading={loading} />
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              First time setup password for team accounts is{" "}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                {DEFAULT_PASSWORD}
              </code>
              . Please change it after first sign in.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function LoggedInPanel({
  userName,
  userRole,
  loginId,
  onSignOut,
}: {
  userName: string;
  userRole: string;
  loginId?: string;
  onSignOut: () => void;
}) {
  async function handleSignOut() {
    try {
      await signOut({ redirect: false });
      onSignOut();
      toast.success("You have been signed out. You can sign in as a different user.");
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  }

  function openDashboard() {
    const tab = window.open("/", "_blank");
    if (!tab) {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-background to-orange-50/40 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3 justify-center">
            <div className="rounded-xl bg-amber-800 p-1.5 flex items-center justify-center h-11 w-12">
              <img
                src="/algurg-logo.svg"
                alt="Al Gurg Group"
                className="h-7 w-auto"
              />
            </div>
            <div>
              <p className="font-semibold tracking-tight">Al Gurg Group</p>
              <p className="text-xs text-muted-foreground">Operations Portal</p>
            </div>
          </div>

          <Card className="rounded-xl shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-amber-100 dark:bg-amber-950 p-2">
                  <User className="size-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Signed in</h2>
                  <p className="text-sm text-muted-foreground">
                    Your session is active on this browser.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Login ID</span>
                  <code className="text-sm font-mono font-medium bg-muted px-2 py-0.5 rounded">
                    {loginId || "N/A"}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Role</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-amber-50/60 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
                  >
                    {(ROLE_LABELS as any)[userRole] || userRole}
                  </Badge>
                </div>
              </div>

              <Button
                className="w-full h-11"
                onClick={openDashboard}
              >
                <ExternalLink className="size-4" />
                Open Dashboard in New Tab
              </Button>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                Sign out &amp; switch user
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                The dashboard opens in a separate browser tab. You can sign out
                here to log in as a different team member without closing the
                dashboard tab.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function TeamAccountsGrid({
  onPick,
  loading,
}: {
  onPick: (acc: { loginId: string; name: string; role: string }) => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
      {TEAM_ACCOUNTS.map((acc) => (
        <button
          key={acc.loginId}
          type="button"
          disabled={loading}
          onClick={() => onPick(acc)}
          className="text-left rounded-lg border bg-card p-2.5 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors disabled:opacity-60 min-h-[64px]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{acc.name}</p>
              <p className="text-xs text-muted-foreground truncate font-mono">
                Login ID: {acc.loginId}
              </p>
            </div>
            <ArrowRight className="size-3.5 text-amber-600 shrink-0" />
          </div>
          <Badge
            variant="outline"
            className="mt-1.5 text-[10px] bg-amber-50/60 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
          >
            {(ROLE_LABELS as any)[acc.role] || acc.role}
          </Badge>
        </button>
      ))}
    </div>
  );
}

