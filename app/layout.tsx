import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "BillFlow — 영상 제작 견적 생성기",
  description: "플랜티엠 콘텐츠 제작 단가 기준 견적 생성기",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
