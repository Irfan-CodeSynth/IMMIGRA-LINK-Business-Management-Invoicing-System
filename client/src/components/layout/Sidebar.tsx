import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Receipt,
  Truck,
  BookOpen,
  BarChart3,
  UserCheck,
  Settings,
  ChevronRight,
  X,
} from "lucide-react";
import immigraLogo from "../../assets/immigra-logo.jpg";

interface SidebarProps {
  collapsed?: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Services", path: "/services", icon: Briefcase },
  { name: "Quotations", path: "/quotations", icon: FileSpreadsheet },
  { name: "Invoices", path: "/invoices", icon: FileText },
  { name: "Payments", path: "/payments", icon: CreditCard },
  { name: "Expenses", path: "/expenses", icon: Receipt },
  { name: "Suppliers", path: "/suppliers", icon: Truck },
  { name: "Accounting", path: "/accounting", icon: BookOpen },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Staff & Roles", path: "/staff", icon: UserCheck },
  { name: "Company Settings", path: "/settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  return (
    <aside className="w-64 bg-brand-navy text-slate-200 flex flex-col h-full border-r border-slate-800 shadow-xl no-print">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 bg-brand-navy-dark flex items-center gap-3 flex-shrink-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-brand-gold/80 shadow-md flex-shrink-0 bg-white">
          <img
            src={immigraLogo}
            alt="Immigra Link Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="overflow-hidden flex-1">
          <h1 className="text-sm font-bold tracking-tight text-white leading-tight uppercase font-mono">
            IMMIGRA LINK
          </h1>
          <p className="text-[10px] text-brand-gold font-medium tracking-wider uppercase">
            Business Services LLC
          </p>
          <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            UAE Portal Active
          </div>
        </div>
        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-brand-gold text-brand-navy font-bold shadow-md shadow-brand-gold/20"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? "text-brand-navy" : "text-brand-gold"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-navy" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/60 flex-shrink-0">
        <div className="text-[9px] text-slate-500 text-center leading-relaxed">
          © 2026 IMMIGRA LINK BUSINESS SERVICES LLC<br />
          <span className="text-slate-600">All Rights Reserved · UAE</span>
        </div>
      </div>
    </aside>
  );
};
