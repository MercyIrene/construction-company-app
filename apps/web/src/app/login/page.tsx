import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server";

async function sendMagicLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) redirect("/login?error=email");

  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/login?sent=1");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="card" style={{ maxWidth: 460, margin: "48px auto" }}>
      <h1>Sign in</h1>
      <p className="sub">
        We&apos;ll email you a secure sign-in link. No passwords to remember —
        or to steal.
      </p>
      {params.sent && (
        <p className="notice ok">
          Check your inbox — your sign-in link is on the way.
        </p>
      )}
      {params.error && (
        <p className="notice warn">
          Could not send the link ({params.error}). Please try again.
        </p>
      )}
      <form className="stack" action={sendMagicLink}>
        <label>
          Email address
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>
        <button type="submit">Email me a sign-in link</button>
      </form>
    </div>
  );
}
