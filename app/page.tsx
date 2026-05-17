import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
        Promote your startup
        <br />
        without the grind.
      </h1>
      <p className="mt-6 max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
        Pitchpilot finds the right Reddit communities for your startup, drafts
        native posts, and lets you approve before anything goes live.
      </p>
      <div className="mt-10">
        <Button size="lg">Get started — it&apos;s free</Button>
      </div>
    </main>
  );
}
