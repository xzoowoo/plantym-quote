"use client";
import { Search, Bell, CircleHelp } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <span className="text-lg font-black text-primary tracking-tighter">BillFlow</span>
        <div className="h-4 w-px bg-slate-200 mx-2" />
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            className="bg-slate-100/80 border-none rounded-full py-2 pl-9 pr-4 text-xs w-56 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium outline-none"
            placeholder="Search invoices..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"><Bell size={18} /></button>
        <button className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"><CircleHelp size={18} /></button>
        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden ml-1">
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-primary" />
        </div>
      </div>
    </header>
  );
}
