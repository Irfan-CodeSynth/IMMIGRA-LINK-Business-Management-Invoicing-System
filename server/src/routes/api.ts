import { Router } from "express";
import { login, logout, getMe } from "../controllers/authController";
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
} from "../controllers/customerController";
import {
  listServices,
  createService,
  updateService,
  toggleServiceStatus,
} from "../controllers/serviceController";
import {
  listInvoices,
  getInvoice,
  getNextInvoiceNumber,
  createInvoice,
  issueDraftInvoice,
  voidInvoice,
  verifyInvoiceByHash,
} from "../controllers/invoiceController";
import {
  listQuotations,
  getQuotation,
  createQuotation,
  convertQuotationToInvoice,
} from "../controllers/quotationController";
import {
  listPayments,
  getPayment,
  createPayment,
} from "../controllers/paymentController";
import { listExpenses, createExpense } from "../controllers/expenseController";
import { listSuppliers, createSupplier, updateSupplier } from "../controllers/supplierController";
import {
  getChartOfAccounts,
  getJournalEntries,
  getGeneralLedger,
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
  createManualJournalEntry,
} from "../controllers/accountingController";
import { getDashboardOverview } from "../controllers/dashboardController";
import { getSettings, updateSettings } from "../controllers/settingsController";
import { listStaff, createStaff, toggleStaffStatus } from "../controllers/staffController";
import { listAuditLogs } from "../controllers/auditLogController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";
import { UserRole } from "@immigra/shared";

const router = Router();

// Public routes
router.post("/auth/login", login);
router.get("/invoices/verify", verifyInvoiceByHash);
router.get("/invoices/verify/:hash*", verifyInvoiceByHash);

// Protected routes (Authentication required)
router.use(authMiddleware);

router.post("/auth/logout", logout);
router.get("/auth/me", getMe);

// Dashboard
router.get("/dashboard", getDashboardOverview);

// Customers
router.get("/customers", listCustomers);
router.get("/customers/:id", getCustomer);
router.post("/customers", createCustomer);
router.put("/customers/:id", updateCustomer);
router.patch("/customers/:id/toggle-status", toggleCustomerStatus);

// Services
router.get("/services", listServices);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.patch("/services/:id/toggle-status", toggleServiceStatus);

// Invoices
router.get("/invoices", listInvoices);
router.get("/invoices/next-number", getNextInvoiceNumber);
router.get("/invoices/:id*", getInvoice);
router.post("/invoices", createInvoice);
router.patch("/invoices/:id/issue", issueDraftInvoice);
router.patch("/invoices/:id/void", voidInvoice);

// Quotations
router.get("/quotations", listQuotations);
router.get("/quotations/:id", getQuotation);
router.post("/quotations", createQuotation);
router.post("/quotations/:id/convert", convertQuotationToInvoice);

// Payments
router.get("/payments", listPayments);
router.get("/payments/:id", getPayment);
router.post("/payments", createPayment);

// Expenses
router.get("/expenses", listExpenses);
router.post("/expenses", createExpense);

// Suppliers
router.get("/suppliers", listSuppliers);
router.post("/suppliers", createSupplier);
router.put("/suppliers/:id", updateSupplier);

// Accounting (Admin / Accountant / Manager only)
router.get("/accounting/chart", getChartOfAccounts);
router.get("/accounting/chart-of-accounts", getChartOfAccounts);
router.get("/accounting/journals", getJournalEntries);
router.get("/accounting/ledger", getGeneralLedger);
router.get("/accounting/trial-balance", getTrialBalance);
router.get("/accounting/p-and-l", getProfitAndLoss);
router.get("/accounting/balance-sheet", getBalanceSheet);
router.post("/accounting/manual-journal", requireRole([UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT]), createManualJournalEntry);

// Staff management (Admin only)
router.get("/staff", requireRole([UserRole.SUPER_ADMIN, UserRole.MANAGER]), listStaff);
router.post("/staff", requireRole([UserRole.SUPER_ADMIN]), createStaff);
router.patch("/staff/:id/toggle-status", requireRole([UserRole.SUPER_ADMIN]), toggleStaffStatus);

// Settings
router.get("/settings", getSettings);
router.put("/settings", requireRole([UserRole.SUPER_ADMIN]), updateSettings);

// Audit logs
router.get("/audit-logs", requireRole([UserRole.SUPER_ADMIN]), listAuditLogs);

export default router;
