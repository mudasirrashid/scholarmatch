export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        ScholarMatch
      </p>

      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
        Coming Soon
      </h1>

      <p className="mt-4 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Something valuable is being built. Stay tuned.
      </p>

      <div
        aria-hidden="true"
        className="mt-10 h-px w-16 bg-zinc-300 dark:bg-zinc-700"
      />
    </main>
  );
}