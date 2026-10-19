import { z } from "zod";
import { CustomerType, PaymentMethod, UserRole, ServiceCategory } from "./constants";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const UserCreateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
});

export const CustomerSchema = z.object({
  customerType: z.nativeEnum(CustomerType),
  displayName: z.string().min(2, "Display name is required"),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(5, "Phone is required"),
  whatsapp: z.string().optional(),
  nationality: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      emirate: z.string().optional(),
      poBox: z.string().optional(),
    })
    .optional(),
  tradeLicenseNumber: z.string().optional(),
  trn: z.string().optional(),
  notes: z.string().optional(),
});

export const ServiceSchema = z.object({
  name: z.string().min(2, "Service name is required"),
  code: z.string().min(2, "Service code is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  defaultRateAed: z.number().min(0, "Rate must be non-negative"),
  costAed: z.number().min(0).optional().default(0),
  governmentFeesAed: z.number().min(0).optional().default(0),
  revenueAccountCode: z.string().default("4010"),
  isActive: z.boolean().default(true),
});

export const InvoiceItemSchema = z.object({
  serviceId: z.string().optional(),
  serviceName: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitRateAed: z.number().min(0, "Unit rate cannot be negative"),
  discountAed: z.number().min(0).default(0),
});

export const InvoiceCreateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  supplyDate: z.string().optional(),
  referenceNote: z.string().optional(),
  items: z.array(InvoiceItemSchema).min(1, "At least one service line item is required"),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  status: z.enum(["DRAFT", "ISSUED"]).default("ISSUED"),
});

export const QuotationCreateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

export const PaymentAllocationSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  allocatedAmountAed: z.number().positive("Allocated amount must be positive"),
});

export const PaymentCreateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  amountAed: z.number().positive("Payment amount must be positive"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  depositAccountCode: z.string().min(1, "Deposit account is required"),
  referenceNumber: z.string().optional(),
  allocations: z.array(PaymentAllocationSchema).optional().default([]),
  notes: z.string().optional(),
});

export const ExpenseCreateSchema = z.object({
  expenseDate: z.string().min(1, "Expense date is required"),
  category: z.string().min(1, "Category is required"),
  expenseAccountCode: z.string().min(1, "Expense account is required"),
  paymentAccountCode: z.string().min(1, "Payment account is required"),
  amountAed: z.number().positive("Amount must be positive"),
  payee: z.string().min(1, "Payee is required"),
  supplierId: z.string().optional(),
  relatedCustomerId: z.string().optional(),
  relatedServiceName: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const SupplierSchema = z.object({
  supplierName: z.string().min(2, "Supplier name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const SettingsUpdateSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  country: z.string().default("United Arab Emirates"),
  city: z.string().default("Dubai"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().optional(),
  tradeLicenseNumber: z.string().optional().default(""),
  trn: z.string().optional().default(""),
  isVatRegistered: z.boolean().default(false),
  currency: z.string().default("AED"),
  timezone: z.string().default("Asia/Dubai"),
  bankDetails: z.object({
    bankName: z.string().min(1, "Bank name is required"),
    accountTitle: z.string().min(1, "Account title is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    iban: z.string().min(1, "IBAN is required"),
    swiftCode: z.string().optional(),
    branch: z.string().optional(),
  }),
  invoicePrefix: z.string().default("INV/MAIN/"),
  invoiceNextSequence: z.number().min(1).default(1001),
  invoiceDefaultNotes: z.string().optional().default(""),
  invoicePaymentInstructions: z.string().optional().default(""),
});
