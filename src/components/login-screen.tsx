"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sofa, KeyRound, ArrowRight } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth-shared";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { email: "admin@algurg.test", name: "System Admin", role: "ADMIN" },
  { email: "mazen@algurg.test", name: "Mazen Al Gurg", role: "BUSINESS_MANAGER" },
  { email: "roy@algurg.test", name: "Roy Mathew", role: "ESTIMATION" },
  { email: "sales@algurg.test", name: "Sales Team", role: "SALES" },
  { email: "nimesha@algurg.test", name: "Nimesha", role: "PROCUREMENT" },
  { email: "store@algurg.test", name: "Store Keeper", role: "STORE" },
  { email: "venkat@algurg.test", name: "Venkat (QC)", role: "QC" },
  { email: "motasem@algurg.test", name: "Motasem (Production)", role: "PRODUCTION" },
  { email: "draftsman@algurg.test", name: "Draftsman", role: "ENGINEERING" },
  { email: "wasim@algurg.test", name: "Wasim (Project)", role: "PROJECT" },
  { email: "finance@algurg.test", name: "Finance", role: "FINANCE" },
] as const;

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(emailToUse?: string, passwordToUse?: string) {
    const em = (emailToUse ?? email).trim().toLowerCase();
    const pw = passwordToUse ?? password;
    if (!em) {
      toast.error("Enter an email");
      return;
    }
    if (!pw || pw.length < 3) {
      toast.error("Password must be at least 3 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      toast.success(`Welcome, ${data.name}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  function pickDemo(acc: { email: string }) {
    setEmail(acc.email);
    setPassword("demo123");
    handleLogin(acc.email, "demo123");
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
                  Production &amp; Operations ERP
                </p>
              </div>
            </div>
          </div>
          <div className="relative space-y-3">
            <h1 className="text-3xl font-bold leading-tight">
              From enquiry to installation —
              <br />
              one workflow.
            </h1>
            <p className="text-sm text-amber-100/85 max-w-md">
              Manage enquiries, quotations, approvals, procurement, store,
              quality control, multi-stage production, engineering drawings,
              delivery and finance — all in a single role-aware console.
            </p>
            <ul className="text-xs text-amber-100/80 space-y-1.5 pt-2">
              <li>11 demo roles · real seeded data · 30+ interconnected models</li>
              <li>Sequential production stages with QC gates</li>
              <li>Timeline tracking on every project</li>
            </ul>
          </div>
          <p className="relative text-xs text-amber-100/60">
            © 2026 Al Gurg Furniture Group · Demo Build
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
                  Production &amp; Operations ERP
                </p>
              </div>
            </div>

            <Card className="rounded-xl shadow-sm">
              <CardHeader className="space-y-1">
                <h2 className="text-xl font-bold">Sign in</h2>
                <p className="text-sm text-muted-foreground">
                  Use any demo account below, or your credentials.
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@algurg.test"
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
                      placeholder="demo123"
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
                    Demo accounts
                  </span>
                  <Separator className="flex-1" />
                </div>

                <DemoAccountsGrid onPick={pickDemo} loading={loading} />
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              Password for all demo accounts:{" "}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                demo123
              </code>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function DemoAccountsGrid({
  onPick,
  loading,
}: {
  onPick: (acc: { email: string; name: string; role: string }) => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
      {DEMO_ACCOUNTS.map((acc) => (
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
