"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const customerController_1 = require("../controllers/customerController");
const serviceController_1 = require("../controllers/serviceController");
const invoiceController_1 = require("../controllers/invoiceController");
const quotationController_1 = require("../controllers/quotationController");
const paymentController_1 = require("../controllers/paymentController");
const expenseController_1 = require("../controllers/expenseController");
const supplierController_1 = require("../controllers/supplierController");
const accountingController_1 = require("../controllers/accountingController");
const dashboardController_1 = require("../controllers/dashboardController");
const settingsController_1 = require("../controllers/settingsController");
const staffController_1 = require("../controllers/staffController");
const auditLogController_1 = require("../controllers/auditLogController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const shared_1 = require("@immigra/shared");
const router = (0, express_1.Router)();
// Public routes
router.post("/auth/login", authController_1.login);
router.get("/invoices/verify", invoiceController_1.verifyInvoiceByHash);
router.get("/invoices/verify/:hash*", invoiceController_1.verifyInvoiceByHash);
// Protected routes (Authentication required)
router.use(authMiddleware_1.authMiddleware);
router.post("/auth/logout", authController_1.logout);
router.get("/auth/me", authController_1.getMe);
// Dashboard
router.get("/dashboard", dashboardController_1.getDashboardOverview);
// Customers
router.get("/customers", customerController_1.listCustomers);
router.get("/customers/:id", customerController_1.getCustomer);
router.post("/customers", customerController_1.createCustomer);
router.put("/customers/:id", customerController_1.updateCustomer);
router.patch("/customers/:id/toggle-status", customerController_1.toggleCustomerStatus);
// Services
router.get("/services", serviceController_1.listServices);
router.post("/services", serviceController_1.createService);
router.put("/services/:id", serviceController_1.updateService);
router.patch("/services/:id/toggle-status", serviceController_1.toggleServiceStatus);
// Invoices
router.get("/invoices", invoiceController_1.listInvoices);
router.get("/invoices/next-number", invoiceController_1.getNextInvoiceNumber);
router.get("/invoices/:id*", invoiceController_1.getInvoice);
router.post("/invoices", invoiceController_1.createInvoice);
router.patch("/invoices/:id/issue", invoiceController_1.issueDraftInvoice);
router.patch("/invoices/:id/void", invoiceController_1.voidInvoice);
// Quotations
router.get("/quotations", quotationController_1.listQuotations);
router.get("/quotations/:id", quotationController_1.getQuotation);
router.post("/quotations", quotationController_1.createQuotation);
router.post("/quotations/:id/convert", quotationController_1.convertQuotationToInvoice);
// Payments
router.get("/payments", paymentController_1.listPayments);
router.get("/payments/:id", paymentController_1.getPayment);
router.post("/payments", paymentController_1.createPayment);
// Expenses
router.get("/expenses", expenseController_1.listExpenses);
router.post("/expenses", expenseController_1.createExpense);
// Suppliers
router.get("/suppliers", supplierController_1.listSuppliers);
router.post("/suppliers", supplierController_1.createSupplier);
router.put("/suppliers/:id", supplierController_1.updateSupplier);
// Accounting (Admin / Accountant / Manager only)
router.get("/accounting/chart", accountingController_1.getChartOfAccounts);
router.get("/accounting/chart-of-accounts", accountingController_1.getChartOfAccounts);
router.get("/accounting/journals", accountingController_1.getJournalEntries);
router.get("/accounting/ledger", accountingController_1.getGeneralLedger);
router.get("/accounting/trial-balance", accountingController_1.getTrialBalance);
router.get("/accounting/p-and-l", accountingController_1.getProfitAndLoss);
router.get("/accounting/balance-sheet", accountingController_1.getBalanceSheet);
router.post("/accounting/manual-journal", (0, authMiddleware_1.requireRole)([shared_1.UserRole.SUPER_ADMIN, shared_1.UserRole.ACCOUNTANT]), accountingController_1.createManualJournalEntry);
// Staff management (Admin only)
router.get("/staff", (0, authMiddleware_1.requireRole)([shared_1.UserRole.SUPER_ADMIN, shared_1.UserRole.MANAGER]), staffController_1.listStaff);
router.post("/staff", (0, authMiddleware_1.requireRole)([shared_1.UserRole.SUPER_ADMIN]), staffController_1.createStaff);
router.patch("/staff/:id/toggle-status", (0, authMiddleware_1.requireRole)([shared_1.UserRole.SUPER_ADMIN]), staffController_1.toggleStaffStatus);
// Settings
router.get("/settings", settingsController_1.getSettings);
router.put("/settings", (0, authMiddleware_1.requireRole)([shared_1.UserRole.SUPER_ADMIN]), settingsController_1.updateSettings);
// Audit logs
router.get("/audit-logs", (0, authMiddleware_1.requireRole)([shared_1.UserRole.SUPER_ADMIN]), auditLogController_1.listAuditLogs);
exports.default = router;
