import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PlusCircle, Clock, LogOut, Shield, Search, Menu } from "lucide-react";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-AE", {
          timeZone: "Asia/Dubai",
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shadow-sm flex-shrink-0 z-10 no-print gap-3">
      {/* Left: Hamburger (mobile) + Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Hamburger button - visible only on mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition flex-shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm sm:max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoices, customers, services..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Dubai Live Clock */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-brand-royal flex-shrink-0" />
          <span>
            Dubai: <strong className="text-slate-900">{time}</strong>
          </span>
        </div>

        {/* Quick New Invoice Button */}
        <Link
          to="/invoices/new"
          className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-brand-navy to-brand-royal text-white hover:from-slate-900 hover:to-brand-navy px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition border border-brand-gold/30 hover:border-brand-gold whitespace-nowrap"
        >
          <PlusCircle className="w-3.5 h-3.5 text-brand-gold" />
          <span>New Invoice</span>
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-4">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-navy text-brand-gold flex items-center justify-center font-bold text-xs shadow flex-shrink-0">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight whitespace-nowrap">
              {user?.name || "User"}
            </div>
            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-brand-gold" />
              {user?.role?.replace("_", " ") || "Staff"}
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
