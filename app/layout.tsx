import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "BillFlow — 영상 제작 견적 생성기",
  description: "플랜티엠 콘텐츠 제작 단가 기준 견적 생성기",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <div className="min-h-screen flex bg-slate-50">
          <Sidebar />
          <main className="pl-[260px] flex-1 flex flex-col">
            <Header />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
