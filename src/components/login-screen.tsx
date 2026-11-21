"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sofa, KeyRound, ArrowRight } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth-shared";
import { toast } from "sonner";

// Internal team directory shown on the login screen for first-time setup.
// In production these accounts are created by the administrator and the
// default password is rotated on first login.
const TEAM_ACCOUNTS = [
  { email: "admin@algurgfurniture.ae", name: "System Administrator", role: "ADMIN" },
  { email: "mazen@algurgfurniture.ae", name: "Mazen Al Gurg", role: "BUSINESS_MANAGER" },
  { email: "roy@algurgfurniture.ae", name: "Roy Mathew", role: "ESTIMATION" },
  { email: "sales@algurgfurniture.ae", name: "Sales Team", role: "SALES" },
  { email: "nimesha@algurgfurniture.ae", name: "Nimesha Perera", role: "PROCUREMENT" },
  { email: "store@algurgfurniture.ae", name: "Store Keeper", role: "STORE" },
  { email: "venkat@algurgfurniture.ae", name: "Venketeswaram", role: "QC" },
  { email: "motasem@algurgfurniture.ae", name: "Motasem Al Rashid", role: "PRODUCTION" },
  { email: "draftsman@algurgfurniture.ae", name: "Technical Drafter", role: "ENGINEERING" },
  { email: "wasim@algurgfurniture.ae", name: "Wasim Khan", role: "PROJECT" },
  { email: "finance@algurgfurniture.ae", name: "Finance Officer", role: "FINANCE" },
] as const;

const DEFAULT_PASSWORD = "Welcome@2026";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(emailToUse?: string, passwordToUse?: string) {
    const em = (emailToUse ?? email).trim().toLowerCase();
    const pw = passwordToUse ?? password;
    if (!em) {
      toast.error("Please enter your email address");
      return;
    }
    if (!pw || pw.length < 4) {
      toast.error("Please enter your password");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: em,
        password: pw,
        redirect: false,
      });
      if (!res || res.error) {
        toast.error("Invalid email or password. Please try again.");
        return;
      }
      toast.success(`Welcome back, ${emailToUse ? "signed in" : "signed in"}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function pickAccount(acc: { email: string }) {
    setEmail(acc.email);
    setPassword(DEFAULT_PASSWORD);
    handleLogin(acc.email, DEFAULT_PASSWORD);
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
              <div className="rounded-xl bg-amber-50/15 p-2.5 backdrop-blur">
                <Sofa className="size-7" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">
                  Al Gurg Furniture Group
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
            © 2026 Al Gurg Furniture Group. All rights reserved.
          </p>
        </section>

        {/* Login panel */}
        <section className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden flex items-center gap-3">
              <div className="rounded-xl bg-amber-700 p-2.5 text-amber-50">
                <Sofa className="size-6" />
              </div>
              <div>
                <p className="font-semibold tracking-tight">
                  Al Gurg Furniture Group
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
                  Use your company email and password to continue.
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
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.name@algurgfurniture.ae"
                      className="h-11"
                    />
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
                    Sign in
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

function TeamAccountsGrid({
  onPick,
  loading,
}: {
  onPick: (acc: { email: string; name: string; role: string }) => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
      {TEAM_ACCOUNTS.map((acc) => (
        <button
          key={acc.email}
          type="button"
          disabled={loading}
          onClick={() => onPick(acc)}
          className="text-left rounded-lg border bg-card p-2.5 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors disabled:opacity-60 min-h-[64px]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{acc.name}</p>
              <p className="text-xs text-muted-foreground truncate font-mono">
                {acc.email}
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
