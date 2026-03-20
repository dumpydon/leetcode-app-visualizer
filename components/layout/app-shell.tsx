import Link from "next/link";
import { BarChart3, BookOpen, Settings2, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/problems", label: "Explorer", icon: BookOpen },
  { href: "/recommendations", label: "Practice", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[260px_1fr] lg:px-6">
        <aside className="glass-card app-grid hidden p-5 lg:flex lg:flex-col">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              LeetCode
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Visualizer</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Personal practice analytics with Zerotrac ratings.
            </p>
          </div>
          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = activePath === link.href;
              return (
                <Button
                  key={link.href}
                  asChild
                  variant={active ? "default" : "ghost"}
                  className={cn("w-full justify-start gap-3", active && "shadow-sm")}
                >
                  <Link href={link.href}>
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
          <div className="mt-auto flex items-center justify-between rounded-2xl border border-dashed p-4">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Theme
              </div>
              <div className="mt-1 text-sm">Light / dark</div>
            </div>
            <ThemeToggle />
          </div>
        </aside>
        <main className="space-y-6 py-2">{children}</main>
      </div>
    </div>
  );
}
