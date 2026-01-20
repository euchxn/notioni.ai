import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notion Template AI",
  description: "AI가 자동으로 노션 템플릿을 생성해드립니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">
              Notion Template AI
            </h1>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
