import { AuditForm } from "@/views/audit-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Food audit
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Select a week and upload the week&apos;s deliveries, keeper usage log,
          and end-of-week inventory to reconcile food stock and surface any
          discrepancies.
        </p>
      </header>

      <AuditForm />
    </main>
  );
}
