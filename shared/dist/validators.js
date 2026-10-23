"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsUpdateSchema = exports.SupplierSchema = exports.ExpenseCreateSchema = exports.PaymentCreateSchema = exports.PaymentAllocationSchema = exports.QuotationCreateSchema = exports.InvoiceCreateSchema = exports.InvoiceItemSchema = exports.ServiceSchema = exports.CustomerSchema = exports.UserCreateSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("./constants");
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
exports.UserCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    role: zod_1.z.nativeEnum(constants_1.UserRole),
    phone: zod_1.z.string().optional(),
});
exports.CustomerSchema = zod_1.z.object({
    customerType: zod_1.z.nativeEnum(constants_1.CustomerType),
    displayName: zod_1.z.string().min(2, "Display name is required"),
    companyName: zod_1.z.string().optional(),
    contactPerson: zod_1.z.string().optional(),
    email: zod_1.z.string().email("Invalid email").optional().or(zod_1.z.literal("")),
    phone: zod_1.z.string().min(5, "Phone is required"),
    whatsapp: zod_1.z.string().optional(),
    nationality: zod_1.z.string().optional(),
    address: zod_1.z
        .object({
        street: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        emirate: zod_1.z.string().optional(),
        poBox: zod_1.z.string().optional(),
    })
        .optional(),
    tradeLicenseNumber: zod_1.z.string().optional(),
    trn: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.ServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Service name is required"),
    code: zod_1.z.string().min(2, "Service code is required"),
    category: zod_1.z.string().min(1, "Category is required"),
    description: zod_1.z.string().optional(),
    defaultRateAed: zod_1.z.number().min(0, "Rate must be non-negative"),
    costAed: zod_1.z.number().min(0).optional().default(0),
    governmentFeesAed: zod_1.z.number().min(0).optional().default(0),
    revenueAccountCode: zod_1.z.string().default("4010"),
    isActive: zod_1.z.boolean().default(true),
});
exports.InvoiceItemSchema = zod_1.z.object({
    serviceId: zod_1.z.string().optional(),
    serviceName: zod_1.z.string().min(1, "Service name is required"),
    companyName: zod_1.z.string().optional().default(""),
    clientName: zod_1.z.string().optional().default(""),
    category: zod_1.z.string().optional().default(""),
    description: zod_1.z.string().optional().default(""),
    quantity: zod_1.z.number().min(1, "Quantity must be at least 1"),
    unitRateAed: zod_1.z.number().min(0, "Unit rate cannot be negative"),
    discountAed: zod_1.z.number().min(0).default(0),
});
exports.InvoiceCreateSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1, "Customer is required"),
    issueDate: zod_1.z.string().min(1, "Issue date is required"),
    dueDate: zod_1.z.string().min(1, "Due date is required"),
    supplyDate: zod_1.z.string().optional(),
    referenceNote: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.InvoiceItemSchema).min(1, "At least one service line item is required"),
    notes: zod_1.z.string().optional(),
    paymentTerms: zod_1.z.string().optional(),
    status: zod_1.z.enum(["DRAFT", "ISSUED"]).default("ISSUED"),
});
exports.QuotationCreateSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1, "Customer is required"),
    issueDate: zod_1.z.string().min(1, "Issue date is required"),
    expiryDate: zod_1.z.string().min(1, "Expiry date is required"),
    items: zod_1.z.array(exports.InvoiceItemSchema).min(1, "At least one item is required"),
    notes: zod_1.z.string().optional(),
    termsAndConditions: zod_1.z.string().optional(),
});
exports.PaymentAllocationSchema = zod_1.z.object({
    invoiceId: zod_1.z.string().min(1, "Invoice ID is required"),
    allocatedAmountAed: zod_1.z.number().positive("Allocated amount must be positive"),
});
exports.PaymentCreateSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1, "Customer is required"),
    paymentDate: zod_1.z.string().min(1, "Payment date is required"),
    amountAed: zod_1.z.number().positive("Payment amount must be positive"),
    paymentMethod: zod_1.z.nativeEnum(constants_1.PaymentMethod),
    depositAccountCode: zod_1.z.string().min(1, "Deposit account is required"),
    referenceNumber: zod_1.z.string().optional(),
    allocations: zod_1.z.array(exports.PaymentAllocationSchema).optional().default([]),
    notes: zod_1.z.string().optional(),
});
exports.ExpenseCreateSchema = zod_1.z.object({
    expenseDate: zod_1.z.string().min(1, "Expense date is required"),
    category: zod_1.z.string().min(1, "Category is required"),
    expenseAccountCode: zod_1.z.string().min(1, "Expense account is required"),
    paymentAccountCode: zod_1.z.string().min(1, "Payment account is required"),
    amountAed: zod_1.z.number().positive("Amount must be positive"),
    payee: zod_1.z.string().min(1, "Payee is required"),
    supplierId: zod_1.z.string().optional(),
    relatedCustomerId: zod_1.z.string().optional(),
    relatedServiceName: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.nativeEnum(constants_1.PaymentMethod),
    referenceNumber: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.SupplierSchema = zod_1.z.object({
    supplierName: zod_1.z.string().min(2, "Supplier name is required"),
    contactPerson: zod_1.z.string().optional(),
    phone: zod_1.z.string().min(5, "Phone is required"),
    email: zod_1.z.string().email("Invalid email").optional().or(zod_1.z.literal("")),
    address: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.SettingsUpdateSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2, "Company name is required"),
    country: zod_1.z.string().default("United Arab Emirates"),
    city: zod_1.z.string().default("Dubai"),
    address: zod_1.z.string().min(1, "Address is required"),
    phone: zod_1.z.string().min(5, "Phone is required"),
    email: zod_1.z.string().email("Invalid email address"),
    website: zod_1.z.string().optional(),
    tradeLicenseNumber: zod_1.z.string().optional().default(""),
    trn: zod_1.z.string().optional().default(""),
    isVatRegistered: zod_1.z.boolean().default(false),
    currency: zod_1.z.string().default("AED"),
    timezone: zod_1.z.string().default("Asia/Dubai"),
    bankDetails: zod_1.z.object({
        bankName: zod_1.z.string().optional().default(""),
        accountTitle: zod_1.z.string().optional().default(""),
        accountNumber: zod_1.z.string().optional().default(""),
        iban: zod_1.z.string().optional().default(""),
        swiftCode: zod_1.z.string().optional(),
        branch: zod_1.z.string().optional(),
    }).optional(),
    invoicePrefix: zod_1.z.string().default("INV-"),
    invoiceNextSequence: zod_1.z.number().min(1).default(1),
    invoiceDefaultNotes: zod_1.z.string().optional().default(""),
    invoicePaymentInstructions: zod_1.z.string().optional().default(""),
});
