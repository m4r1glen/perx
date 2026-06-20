import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useLocale } from "@/lib/locale-context";
import { SiteHeader } from "./site-header";

export function PlaceholderPage({
  kicker,
  title,
  body,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="hairline rounded-2xl bg-paper p-8 sm:p-12">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">
            {kicker}
          </div>
          <h1 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink/70">{body}</p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-parchment px-3 py-1.5 text-xs text-ink/60">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            <span className="font-mono-num uppercase tracking-wide">wip</span>
            <span>· {t.pages.placeholderHint}</span>
          </div>

          {children ? <div className="mt-10">{children}</div> : null}

          <div className="mt-10 border-t border-[var(--hairline)] pt-6">
            <Link
              to="/"
              className="btn-press inline-flex items-center text-sm font-medium text-ink/70 hover:text-copper-dark"
            >
              ← {t.pages.backHome}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
