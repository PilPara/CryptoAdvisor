import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import {
  ClerkProvider,
  SignedOut,
  SignedIn,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "AI Crypto Advisor",
  description: "Personalized crypto investor dashboard with AI-curated content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen antialiased">
          <header className="flex items-center justify-between p-4 border-b">
            <SignedIn>
              <Link
                href="/dashboard"
                className="font-semibold hover:opacity-80 transition-opacity"
              >
                AI Crypto Advisor
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-up"
                className="font-semibold hover:opacity-80 transition-opacity"
              >
                AI Crypto Advisor
              </Link>
            </SignedOut>

            <SignedOut>
              <SignInButton />
            </SignedOut>

            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>

          <main className="p-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
