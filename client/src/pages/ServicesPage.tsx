import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { formatAed, IService } from "@immigra/shared";
import {
  Briefcase,
  Plus,
  Search,
  X,
  Edit2,
  Eye,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "../components/common/DeleteConfirmModal";
import { showAppAlert } from "../services/alertService";

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<IService | null>(null);
  const [viewingService, setViewingService] = useState<IService | null>(null);
  const [deletingService, setDeletingService] = useState<IService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [defaultRateAed, setDefaultRateAed] = useState<number>(500);
  const [costAed, setCostAed] = useState<number>(300);
  const [revenueAccountCode, setRevenueAccountCode] = useState("4020");
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      let url = "/services?";
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setServices(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices();
  };

  const generateNextServiceCode = () => {
    const existing = new Set(services.map((s) => s.code.toUpperCase()));
    let num = services.length + 1;
    let codeCandidate = `SRV-${num.toString().padStart(3, "0")}`;
    while (existing.has(codeCandidate)) {
      num++;
      codeCandidate = `SRV-${num.toString().padStart(3, "0")}`;
    }
    return codeCandidate;
  };

  const openAddModal = () => {
    setEditingService(null);
    setName("");
    setCode("");
    setDescription("");
    setDefaultRateAed(500);
    setCostAed(300);
    setRevenueAccountCode("4020");
    setShowModal(true);
  };

  const openEditModal = (s: IService) => {
    setEditingService(s);
    setName(s.name);
    setCode(s.code);
    setDescription(s.description || "");
    setDefaultRateAed(s.defaultRateFils / 100);
    setCostAed((s.costFils || 0) / 100);
    setRevenueAccountCode(s.revenueAccountCode);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const cleanName = name.trim();
    if (!cleanName) {
      showAppAlert("Please enter a service title", "Title Required", "warning");
      setSubmitting(false);
      return;
    }

    const cleanCode = code.trim().toUpperCase() || undefined;

    try {
      const payload = {
        name: cleanName,
        code: cleanCode,
        category: "",
        description: description.trim() || undefined,
        defaultRateAed: Math.max(0, Number(defaultRateAed) || 0),
        costAed: Math.max(0, Number(costAed) || 0),
        revenueAccountCode: revenueAccountCode || "4020",
      };

      if (editingService) {
        await api.put(`/services/${editingService._id}`, payload);
      } else {
        await api.post("/services", payload);
      }

      setShowModal(false);
      await fetchServices();
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors?.fieldErrors?.code) {
        showAppAlert(
          errorData.errors.fieldErrors.code[0] || "Invalid service code",
          "Duplicate Code",
          "error"
        );
      } else {
        showAppAlert(
          errorData?.message || "Failed to save service. Please check fields.",
          "Save Error",
          "error"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/services/${id}/toggle-status`);
      await fetchServices();
    } catch (err: any) {
      showAppAlert(
        err.response?.data?.message || "Failed to update status",
        "Action Failed",
        "error"
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;
    setIsDeleting(true);
    try {
      await api.delete(`/services/${deletingService._id}`);
      setDeletingService(null);
      await fetchServices();
    } catch (err: any) {
      setDeletingService(null);
      showAppAlert(
        err.response?.data?.message || "Cannot delete service in use",
        "Delete Blocked",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Service Catalog & Offerings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure business services, software solutions, rates, and codes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-brand-navy hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition border border-brand-gold/40 hover:border-brand-gold"
          >
            <Plus className="w-4 h-4 text-brand-gold" />
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
        </form>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4 text-right">Selling Rate (AED)</th>
                <th className="py-3 px-4 text-right">Govt / Cost (AED)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-navy border-t-brand-gold rounded-full animate-spin mx-auto mb-2"></div>
                    Loading service catalog...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No services configured. Click "+ Add New Service" to create one.
                  </td>
                </tr>
              ) : (
                services.map((srv) => (
                  <tr key={srv._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {srv.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{srv.name}</div>
                      {srv.description && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {srv.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-brand-navy text-sm">
                      {formatAed(srv.defaultRateFils)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatAed(srv.costFils || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(srv._id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                          srv.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {srv.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingService(srv)}
                          title="View Service Details"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openEditModal(srv)}
                          title="Edit Service"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingService(srv)}
                          title="Delete Service"
                          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-gold" />
                <span>
                  {editingService ? "Edit Service" : "Add New Service"}
                </span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI Strategy Consulting"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Service Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setCode(generateNextServiceCode())}
                    className="text-[11px] text-brand-gold hover:underline font-semibold"
                  >
                    Generate Next Code
                  </button>
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SRV-001"
                  className="w-full font-mono border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Selling Rate (AED) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={defaultRateAed}
                    onChange={(e) =>
                      setDefaultRateAed(parseFloat(e.target.value) || 0)
                    }
                    className="w-full font-mono border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Govt Fee / Cost (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costAed}
                    onChange={(e) =>
                      setCostAed(parseFloat(e.target.value) || 0)
                    }
                    className="w-full font-mono border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Revenue Ledger Account
                </label>
                <select
                  value={revenueAccountCode}
                  onChange={(e) => setRevenueAccountCode(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                >
                  <option value="4010">4010 - Document Clearing Revenue</option>
                  <option value="4020">4020 - Visa & Government Service Revenue</option>
                  <option value="4030">4030 - Business Setup & Licensing Revenue</option>
                  <option value="4090">4090 - Other Professional Revenue</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Service scope or government fee breakdown..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white rounded-lg font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Service Details Modal */}
      {viewingService && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-gold" />
                <span>Service Specification</span>
              </h2>
              <button
                onClick={() => setViewingService(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Service Name
                </span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {viewingService.name}
                </p>
                <p className="font-mono text-brand-royal font-bold text-xs mt-0.5">
                  {viewingService.code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Selling Rate:</span>
                  <p className="text-sm font-bold font-mono text-brand-navy mt-0.5">
                    {formatAed(viewingService.defaultRateFils)} AED
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Govt / Cost:</span>
                  <p className="text-sm font-bold font-mono text-slate-600 mt-0.5">
                    {formatAed(viewingService.costFils || 0)} AED
                  </p>
                </div>
              </div>

              {viewingService.description && (
                <div>
                  <span className="text-slate-500 font-medium">Description:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 mt-1 whitespace-pre-wrap">
                    {viewingService.description}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Ledger Account:</span>
                <span className="font-mono font-bold text-slate-800">
                  {viewingService.revenueAccountCode}
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingService(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingService)}
        title="Delete Service"
        itemName={deletingService?.name || ""}
        message={`Are you sure you want to delete ${deletingService?.name}?`}
        warningNote="If this service is referenced in past invoices, deletion might be blocked."
        confirmText="Yes, Delete Service"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingService(null)}
      />
    </div>
  );
};
