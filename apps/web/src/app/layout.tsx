import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Msingi — verified home construction delivery",
  description:
    "Your home in Kenya, built as designed, on a budget you can see, with proof at every step — or your money doesn't move.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="brand">
              msingi<span>.</span>
            </Link>
            <nav>
              {user ? (
                <>
                  <Link href="/home">My workspace</Link>
                  <form action="/auth/signout" method="post" className="inline-form">
                    <button className="ghost" type="submit">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link className="btn ghost" href="/login">
                  Sign in
                </Link>
              )}
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
