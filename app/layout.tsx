import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "견적 생성기 | 플랜티엠",
  description: "영상 제작 견적 자동 산출",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="pl-[240px] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
