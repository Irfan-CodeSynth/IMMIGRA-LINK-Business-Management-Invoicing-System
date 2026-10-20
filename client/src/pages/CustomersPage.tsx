import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { formatAed, ICustomer, CustomerType } from "@immigra/shared";
import {
  Users,
  UserPlus,
  Search,
  Building,
  User,
  Phone,
  Mail,
  ChevronRight,
  X,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "../components/common/DeleteConfirmModal";
import { showAppAlert } from "../services/alertService";

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<ICustomer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [customerType, setCustomerType] = useState<CustomerType>(CustomerType.BUSINESS);
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [city, setCity] = useState("Dubai");
  const [emirate, setEmirate] = useState("Dubai");
  const [street, setStreet] = useState("");
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = "/customers?";
      if (typeFilter) url += `type=${typeFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setCustomers(res.data.data.customers);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setCustomerType(CustomerType.BUSINESS);
    setDisplayName("");
    setCompanyName("");
    setContactPerson("");
    setPhone("");
    setWhatsapp("");
    setEmail("");
    setNationality("");
    setStreet("");
    setTradeLicenseNumber("");
    setNotes("");
    setShowModal(true);
  };

  const openEditModal = (c: ICustomer) => {
    setEditingCustomer(c);
    setCustomerType(c.customerType);
    setDisplayName(c.displayName);
    setCompanyName(c.companyName || "");
    setContactPerson(c.contactPerson || "");
    setPhone(c.phone);
    setWhatsapp(c.whatsapp || "");
    setEmail(c.email || "");
    setNationality(c.nationality || "");
    setStreet(c.address?.street || "");
    setTradeLicenseNumber(c.tradeLicenseNumber || "");
    setNotes(c.notes || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        customerType,
        displayName,
        companyName: customerType === CustomerType.BUSINESS ? (companyName || displayName) : undefined,
        contactPerson: contactPerson || undefined,
        phone,
        whatsapp: whatsapp || undefined,
        email: email || undefined,
        nationality: nationality || undefined,
        address: {
          street,
          city,
          emirate,
        },
        tradeLicenseNumber: tradeLicenseNumber || undefined,
        notes: notes || undefined,
      };

      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, payload);
      } else {
        await api.post("/customers", payload);
      }

      setShowModal(false);
      await fetchCustomers();
    } catch (err: any) {
      showAppAlert(err.response?.data?.message || "Failed to save customer", "Save Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      await api.delete(`/customers/${deletingCustomer._id}`);
      setDeletingCustomer(null);
      await fetchCustomers();
    } catch (err: any) {
      setDeletingCustomer(null);
      showAppAlert(err.response?.data?.message || "Failed to delete customer", "Action Blocked", "error");
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
            Customer CRM
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage individual clients, companies, contact details, and ledgers
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-brand-navy hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition border border-brand-gold/40 hover:border-brand-gold"
        >
          <UserPlus className="w-4 h-4 text-brand-gold" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              typeFilter === ""
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter("BUSINESS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              typeFilter === "BUSINESS"
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Business Companies
          </button>
          <button
            onClick={() => setTypeFilter("INDIVIDUAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              typeFilter === "INDIVIDUAL"
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Individuals
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, phone, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Customer / Company</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Phone / WhatsApp</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4 text-right">Outstanding (AED)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-navy border-t-brand-gold rounded-full animate-spin mx-auto mb-2"></div>
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No customers found. Click "+ Add New Customer" to register one.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                      {c.referenceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/customers/${c._id}`}
                        className="font-bold text-slate-900 hover:text-brand-royal hover:underline block"
                      >
                        {c.displayName}
                      </Link>
                      {c.contactPerson && (
                        <span className="text-[10px] text-slate-400">
                          Attn: {c.contactPerson}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.customerType === CustomerType.BUSINESS
                            ? "bg-blue-50 text-brand-royal"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {c.customerType === CustomerType.BUSINESS ? (
                          <Building className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        <span>{c.customerType}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono">
                      {c.phone}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.address?.city || "Dubai"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          c.balanceFils > 0 ? "text-amber-600" : "text-emerald-700"
                        }
                      >
                        {formatAed(c.balanceFils)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/customers/${c._id}`}
                          title="View Profile & Statements"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </Link>
                        <button
                          onClick={() => openEditModal(c)}
                          title="Edit Customer"
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingCustomer(c)}
                          title="Delete / Archive Customer"
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

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-gold" />
                <span>{editingCustomer ? "Edit Customer Details" : "Register New Customer"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={customerType === CustomerType.BUSINESS}
                      onChange={() => setCustomerType(CustomerType.BUSINESS)}
                    />
                    <span>Business Customer</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={customerType === CustomerType.INDIVIDUAL}
                      onChange={() => setCustomerType(CustomerType.INDIVIDUAL)}
                    />
                    <span>Individual Customer</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {customerType === CustomerType.BUSINESS ? "Company / Trading Name *" : "Customer Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Omeza Quickcare Services Est."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>

              {customerType === CustomerType.BUSINESS && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Manager / PRO"
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Trade License #</label>
                    <input
                      type="text"
                      value={tradeLicenseNumber}
                      onChange={(e) => setTradeLicenseNumber(e.target.value)}
                      placeholder="CN-12345"
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile / Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0562420614"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp (Optional)</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+971 56 242 0614"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nationality / Country</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="e.g. UAE / India / Philippines"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street / Area / Building"
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
                  className="px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm border border-brand-gold/40 hover:border-brand-gold"
                >
                  {submitting ? "Saving..." : editingCustomer ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingCustomer}
        title="Delete Customer Profile"
        itemName={deletingCustomer ? `${deletingCustomer.displayName} (${deletingCustomer.referenceNumber})` : ""}
        message="Are you sure you want to delete this customer? Customers with active or unpaid invoices cannot be deleted."
        warningNote={deletingCustomer && deletingCustomer.balanceFils !== 0 ? `This customer currently has an active balance of AED ${formatAed(deletingCustomer.balanceFils)}.` : undefined}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingCustomer(null)}
      />
    </div>
  );
};
