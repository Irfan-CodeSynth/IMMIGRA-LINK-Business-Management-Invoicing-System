import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { formatAed, IService, ServiceCategory } from "@immigra/shared";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  X,
  Edit2,
  Eye,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "../components/common/DeleteConfirmModal";

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
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
  const [category, setCategory] = useState<string>(ServiceCategory.VISA);
  const [description, setDescription] = useState("");
  const [defaultRateAed, setDefaultRateAed] = useState<number>(500);
  const [costAed, setCostAed] = useState<number>(300);
  const [revenueAccountCode, setRevenueAccountCode] = useState("4020");
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      let url = "/services?";
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
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
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices();
  };

  const openAddModal = () => {
    setEditingService(null);
    setName("");
    setCode("");
    setCategory(ServiceCategory.VISA);
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
    setCategory(s.category);
    setDescription(s.description || "");
    setDefaultRateAed(s.defaultRateFils / 100);
    setCostAed((s.costFils || 0) / 100);
    setRevenueAccountCode(s.revenueAccountCode);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        code,
        category,
        description,
        defaultRateAed: Number(defaultRateAed),
        costAed: Number(costAed || 0),
        revenueAccountCode,
      };

      if (editingService) {
        await api.put(`/services/${editingService._id}`, payload);
      } else {
        await api.post("/services", payload);
      }

      setShowModal(false);
      await fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/services/${id}/toggle-status`);
      await fetchServices();
    } catch (err: any) {
      alert("Failed to toggle service status");
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
      alert(err.response?.data?.message || "Failed to delete service");
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
            Service Catalog & Government Fees
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure UAE visa, immigration, MOHRE, business setup, and clearing services
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-brand-navy hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition border border-brand-gold/40 hover:border-brand-gold"
        >
          <Plus className="w-4 h-4 text-brand-gold" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Categories & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setCategoryFilter("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              categoryFilter === ""
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Categories
          </button>
          {[
            ServiceCategory.VISA,
            ServiceCategory.LABOUR_MOHRE,
            ServiceCategory.BUSINESS_SETUP,
            ServiceCategory.RTA_SERVICES,
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                categoryFilter === cat
                  ? "bg-brand-navy text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-72">
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
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Selling Rate (AED)</th>
                <th className="py-3 px-4 text-right">Govt / Cost (AED)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-navy border-t-brand-gold rounded-full animate-spin mx-auto mb-2"></div>
                    Loading service catalog...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
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
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {srv.category}
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
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingService(srv)}
                          title="Delete Service"
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-gold" />
                <span>{editingService ? "Edit Service" : "Add Catalog Service"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Inside Entry Permit"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="SRV-VISA-01"
                    className="w-full font-mono border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    {Object.values(ServiceCategory).map((cat: any) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Rate (AED) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={defaultRateAed}
                    onChange={(e) => setDefaultRateAed(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono font-bold border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Internal Cost / Govt (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costAed}
                    onChange={(e) => setCostAed(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono border border-slate-300 rounded-lg p-2 text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Official government tasheel description"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
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
                  {submitting ? "Saving..." : editingService ? "Update Service" : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Service Details Modal */}
      {viewingService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-gold" />
                <span>Service Details: {viewingService.name}</span>
              </h3>
              <button
                onClick={() => setViewingService(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Service Code:</span>
                <span className="font-mono font-bold text-slate-800">{viewingService.code}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-semibold text-brand-navy">{viewingService.category}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Standard Selling Rate:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {formatAed(viewingService.defaultRateFils)} AED
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Cost / Govt Fees:</span>
                <span className="font-mono font-bold text-slate-600">
                  {formatAed(viewingService.costFils || 0)} AED
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Gross Profit Margin:</span>
                <span className="font-mono font-bold text-blue-700">
                  {formatAed(Math.max(0, viewingService.defaultRateFils - (viewingService.costFils || 0)))} AED
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Revenue Ledger Code:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {viewingService.revenueAccountCode || "4020"} - Fee Revenue
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">Description:</span>
                <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                  {viewingService.description || "Standard UAE commercial business processing service."}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const s = viewingService;
                    setViewingService(null);
                    openEditModal(s);
                  }}
                  className="px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm"
                >
                  Edit This Service
                </button>
                <button
                  type="button"
                  onClick={() => setViewingService(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
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
        isOpen={!!deletingService}
        title="Delete Service Offering"
        itemName={deletingService ? `${deletingService.name} (${deletingService.code})` : ""}
        message="Are you sure you want to delete this service from your catalog? Existing historical invoices and quotations that used this service will remain preserved."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingService(null)}
      />
    </div>
  );
};
