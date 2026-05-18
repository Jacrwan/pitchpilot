import Link from "next/link";
import Navbar from "@/components/Navbar";
import { signUp } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

const INPUT_CLS =
  "rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 w-full";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-sm text-slate-400 mb-8">Start promoting your startup the right way.</p>

          <form action={signUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={INPUT_CLS}
                style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                placeholder="Min 6 characters"
                className={INPUT_CLS}
                style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a" }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            {message === "check-email" && (
              <p className="text-sm text-slate-400">
                Account created — check your email to confirm, then{" "}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                  log in
                </Link>
                .
              </p>
            )}

            <SubmitButton label="Sign up" pendingLabel="Creating account…" />
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
