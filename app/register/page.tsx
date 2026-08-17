import Link from "next/link";
import { register } from "@/app/auth/actions";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f4] px-5 py-10 text-[#17211b]">
      <section className="w-full max-w-md rounded border border-[#d9dfd5] bg-white p-6 shadow-[var(--shadow-panel)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
          New Manager
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Create your account.</h1>
        <form action={register} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input
              className="rounded border border-[#cbd4c7] px-3 py-2"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <input
              className="rounded border border-[#cbd4c7] px-3 py-2"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button className="rounded bg-[#145c42] px-4 py-2 font-semibold text-white" type="submit">
            Register
          </button>
        </form>
        <p className="mt-5 text-sm text-[#526056]">
          Already have an account?{" "}
          <Link className="font-semibold text-[#145c42] underline" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
