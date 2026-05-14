"use client";
import { ReceiptText, LayoutDashboard, Quote, Users, Settings } from "lucide-react";

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) => (
  <a href="#" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ${active ? "bg-blue-50 text-primary font-semibold" : "text-slate-500 hover:bg-slate-100"}`}>
    <span className={active ? "text-primary" : "group-hover:text-primary transition-colors"}>{icon}</span>
    <span className="text-sm">{label}</span>
  </a>
);

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-slate-50 border-r border-slate-200 flex flex-col py-6 px-4 z-50">
      <div className="flex items-center space-x-3 mb-8 px-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200/50">
          <ReceiptText size={22} />
        </div>
        <div>
          <h1 className="text-base font-black text-primary tracking-tight">플랜티엠</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">견적 생성기</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        <NavItem icon={<LayoutDashboard size={18} />} label="견적 작성" active />
        <NavItem icon={<Quote size={18} />} label="견적 내역" />
        <NavItem icon={<Users size={18} />} label="업체 관리" />
        <NavItem icon={<Settings size={18} />} label="설정" />
      </nav>
    </aside>
  );
}
