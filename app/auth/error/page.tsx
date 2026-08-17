import Link from "next/link";

type AuthErrorPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { message } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f4] px-5 py-10 text-[#17211b]">
      <section className="w-full max-w-md rounded border border-[#d9dfd5] bg-white p-6 shadow-[var(--shadow-panel)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
          Auth Error
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Could not complete sign-in.</h1>
        <p className="mt-4 leading-7 text-[#526056]">{message ?? "Try again with a valid account."}</p>
        <Link className="mt-6 inline-flex rounded bg-[#145c42] px-4 py-2 font-semibold text-white" href="/login">
          Back to login
        </Link>
      </section>
    </main>
  );
}
