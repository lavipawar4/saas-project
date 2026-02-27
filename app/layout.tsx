import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ReviewAI — AI-Powered Review Management",
    description: "Generate perfect Google Business Profile responses with Claude AI. Sync reviews, generate unique AI replies, and publish them in seconds.",
    keywords: ["review management", "Google Business Profile", "AI review responses", "review automation"],
    openGraph: {
        title: "ReviewAI — AI-Powered Review Management",
        description: "Generate perfect Google Business Profile responses with Claude AI.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="min-h-screen antialiased">
                {children}
            </body>
        </html>
    );
}
