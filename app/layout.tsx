import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

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
          <div className="flex-1 flex flex-col pl-[240px]">
            <Header />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
