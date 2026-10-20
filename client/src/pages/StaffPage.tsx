import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { IUser, UserRole } from "@immigra/shared";
import {
  UserCheck,
  Plus,
  Shield,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { showAppAlert } from "../services/alertService";

export const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.SALES);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get("/staff");
      if (res.data.success) {
        setStaff(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/staff", {
        name,
        email,
        password,
        role,
        phone: phone || undefined,
      });

      if (res.data.success) {
        setShowModal(false);
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        await fetchStaff();
      }
    } catch (err: any) {
      showAppAlert(err.response?.data?.message || "Failed to create staff member", "Staff Creation Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (userId: string) => {
    try {
      await api.patch(`/staff/${userId}/toggle-status`);
      await fetchStaff();
    } catch (err: any) {
      showAppAlert("Failed to toggle status", "Status Error", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Staff & Role-Based Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company employees, grant departmental access roles, and monitor status
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-navy hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition border border-brand-gold/40 hover:border-brand-gold"
        >
          <Plus className="w-4 h-4 text-brand-gold" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Employee Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-brand-navy border-t-brand-gold rounded-full animate-spin mx-auto mb-2"></div>
                  Loading staff accounts...
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No staff accounts found.
                </td>
              </tr>
            ) : (
              staff.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-navy text-brand-gold flex items-center justify-center font-bold text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-brand-navy border border-brand-gold/30">
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{u.phone || "—"}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggle(u._id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      {u.isActive ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-gold" />
                <span>Create Staff Account</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fatima Tariq"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@immigralink.ae"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Access Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50"
                  >
                    <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.ACCOUNTANT}>Accountant</option>
                    <option value={UserRole.SALES}>Sales / Consultant</option>
                    <option value={UserRole.CASHIER}>Cashier</option>
                    <option value={UserRole.VIEWER}>Read-Only Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50..."
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
