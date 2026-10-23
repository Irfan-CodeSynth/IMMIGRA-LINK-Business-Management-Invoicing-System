import {
  UserRole,
  CustomerType,
  ServiceCategory,
  InvoiceStatus,
  QuotationStatus,
  PaymentMethod,
  AccountType,
  AccountSubType,
} from "./constants";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomerDocument {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface ICustomer {
  _id: string;
  customerType: CustomerType;
  referenceNumber: string;
  displayName: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    emirate?: string;
    poBox?: string;
  };
  tradeLicenseNumber?: string;
  trn?: string;
  notes?: string;
  isActive: boolean;
  balanceFils: number;
  documents?: ICustomerDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface IService {
  _id: string;
  name: string;
  code: string;
  category: ServiceCategory | string;
  description?: string;
  defaultRateFils: number;
  costFils?: number;
  governmentFeesFils?: number;
  revenueAccountCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IInvoiceItem {
  serviceId?: string;
  serviceName: string;
  clientName?: string;
  description?: string;
  quantity: number;
  unitRateFils: number;
  discountFils: number;
  lineTotalFils: number;
}

export interface IInvoice {
  _id: string;
  invoiceNumber: string;
  sequenceNumber: number;
  customerId: string;
  customerSnapshot: {
    displayName: string;
    companyName?: string;
    contactPerson?: string;
    clientName?: string;
    phone: string;
    email?: string;
    address?: string;
    trn?: string;
  };
  issueDate: string;
  dueDate: string;
  supplyDate?: string;
  referenceNote?: string;
  status: InvoiceStatus;
  subtotalFils: number;
  discountFils: number;
  taxFils: number;
  grandTotalFils: number;
  paidAmountFils: number;
  dueAmountFils: number;
  items: IInvoiceItem[];
  amountInWords: string;
  barcodeData: string;
  qrVerificationHash: string;
  notes?: string;
  paymentTerms?: string;
  createdById: string;
  creatorName?: string;
  journalEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IQuotationItem {
  serviceId?: string;
  serviceName: string;
  clientName?: string;
  description?: string;
  quantity: number;
  unitRateFils: number;
  discountFils: number;
  lineTotalFils: number;
}

export interface IQuotation {
  _id: string;
  quotationNumber: string;
  customerId: string;
  customerSnapshot: {
    displayName: string;
    companyName?: string;
    contactPerson?: string;
    clientName?: string;
    phone: string;
    email?: string;
    address?: string;
  };
  issueDate: string;
  expiryDate: string;
  status: QuotationStatus;
  subtotalFils: number;
  discountFils: number;
  grandTotalFils: number;
  items: IQuotationItem[];
  amountInWords: string;
  notes?: string;
  termsAndConditions?: string;
  convertedInvoiceId?: string;
  createdById: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmountFils: number;
}

export interface IPayment {
  _id: string;
  receiptNumber: string;
  customerId: string;
  customerName?: string;
  paymentDate: string;
  amountFils: number;
  paymentMethod: PaymentMethod;
  depositAccountCode: string;
  referenceNumber?: string;
  allocations: IPaymentAllocation[];
  unallocatedBalanceFils: number;
  notes?: string;
  createdById: string;
  journalEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IExpense {
  _id: string;
  expenseNumber: string;
  expenseDate: string;
  category: string;
  expenseAccountCode: string;
  paymentAccountCode: string;
  amountFils: number;
  payee: string;
  supplierId?: string;
  relatedCustomerId?: string;
  relatedServiceName?: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  receiptFileUrl?: string;
  notes?: string;
  status: "POSTED" | "VOID";
  createdById: string;
  journalEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISupplier {
  _id: string;
  supplierName: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  balanceFils: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAccount {
  _id: string;
  code: string;
  name: string;
  type: AccountType;
  subType: AccountSubType;
  currency: string;
  currentBalanceFils: number;
  isSystem: boolean;
  description?: string;
}

export interface IJournalLine {
  accountCode: string;
  accountName: string;
  description?: string;
  debitFils: number;
  creditFils: number;
}

export interface IJournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  description: string;
  sourceDocumentType: "INVOICE" | "PAYMENT" | "EXPENSE" | "MANUAL" | "OPENING_BALANCE";
  sourceDocumentId?: string;
  lines: IJournalLine[];
  totalDebitFils: number;
  totalCreditFils: number;
  isReversed: boolean;
  reversedEntryId?: string;
  createdById: string;
  createdAt: string;
}

export interface ICompanySettings {
  _id?: string;
  companyName: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  tradeLicenseNumber: string;
  trn?: string;
  isVatRegistered: boolean;
  currency: string;
  timezone: string;
  bankDetails: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    swiftCode?: string;
    branch?: string;
  };
  invoicePrefix: string;
  invoiceNextSequence: number;
  invoiceDefaultNotes: string;
  invoicePaymentInstructions: string;
  logoUrl?: string;
}

export interface IDashboardStats {
  totalInvoicedFils: number;
  totalCollectedFils: number;
  outstandingReceivablesFils: number;
  overdueInvoicesFils: number;
  totalExpensesFils: number;
  netProfitFils: number;
  availableCashFils: number;
  totalActiveCustomers: number;
  totalInvoicesCount: number;
  unpaidInvoicesCount: number;
  revenueByMonth: { month: string; revenueFils: number; expenseFils: number }[];
  incomeBreakdown: { category: string; amountFils: number }[];
  expenseBreakdown: { category: string; amountFils: number }[];
  invoiceStatusSummary: { status: InvoiceStatus; count: number; totalFils: number }[];
  recentInvoices: IInvoice[];
  recentPayments: IPayment[];
}

export interface IAuditLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}
