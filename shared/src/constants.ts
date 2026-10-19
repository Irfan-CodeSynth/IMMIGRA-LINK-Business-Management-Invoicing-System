export const APP_NAME = "IMMIGRA LINK BUSINESS SERVICES";
export const DEFAULT_CURRENCY = "AED";
export const TIMEZONE = "Asia/Dubai";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  MANAGER = "MANAGER",
  ACCOUNTANT = "ACCOUNTANT",
  SALES = "SALES",
  CASHIER = "CASHIER",
  VIEWER = "VIEWER",
}

export enum CustomerType {
  INDIVIDUAL = "INDIVIDUAL",
  BUSINESS = "BUSINESS",
}

export enum ServiceCategory {
  IMMIGRATION = "Immigration Services",
  VISA = "Visa Services",
  LABOUR_MOHRE = "Labour and MOHRE Services",
  BUSINESS_SETUP = "Business Setup",
  DOCUMENT_CLEARING = "Document Clearing",
  GOVERNMENT_TRANSACTIONS = "Government Transactions",
  RTA_SERVICES = "RTA Services",
  GENERAL_CONSULTANCY = "General Consultancy",
  OTHER = "Other Services",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  ISSUED = "ISSUED",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  VOID = "VOID",
}

export enum QuotationStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CONVERTED = "CONVERTED",
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  CARD = "CARD",
  CHEQUE = "CHEQUE",
  OTHER = "OTHER",
}

export enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  REVENUE = "REVENUE",
  EXPENSE = "EXPENSE",
}

export enum AccountSubType {
  CASH = "CASH",
  BANK = "BANK",
  ACCOUNTS_RECEIVABLE = "ACCOUNTS_RECEIVABLE",
  CURRENT_ASSET = "CURRENT_ASSET",
  FIXED_ASSET = "FIXED_ASSET",
  ACCOUNTS_PAYABLE = "ACCOUNTS_PAYABLE",
  CURRENT_LIABILITY = "CURRENT_LIABILITY",
  CUSTOMER_ADVANCES = "CUSTOMER_ADVANCES",
  OWNERS_EQUITY = "OWNERS_EQUITY",
  RETAINED_EARNINGS = "RETAINED_EARNINGS",
  OPERATING_REVENUE = "OPERATING_REVENUE",
  OTHER_INCOME = "OTHER_INCOME",
  DIRECT_COST = "DIRECT_COST",
  OPERATING_EXPENSE = "OPERATING_EXPENSE",
  GOVERNMENT_FEES = "GOVERNMENT_FEES",
}

export const DEFAULT_CHART_OF_ACCOUNTS = [
  // Assets (1000s)
  { code: "1010", name: "Cash in Hand (Petty Cash)", type: AccountType.ASSET, subType: AccountSubType.CASH, isSystem: true },
  { code: "1020", name: "Bank Account (Emirates NBD / ADCB)", type: AccountType.ASSET, subType: AccountSubType.BANK, isSystem: true },
  { code: "1200", name: "Accounts Receivable (Debtors)", type: AccountType.ASSET, subType: AccountSubType.ACCOUNTS_RECEIVABLE, isSystem: true },
  { code: "1300", name: "Prepaid Expenses & Deposits", type: AccountType.ASSET, subType: AccountSubType.CURRENT_ASSET, isSystem: false },
  
  // Liabilities (2000s)
  { code: "2010", name: "Accounts Payable (Creditors)", type: AccountType.LIABILITY, subType: AccountSubType.ACCOUNTS_PAYABLE, isSystem: true },
  { code: "2020", name: "Customer Advance Deposits (Unearned Revenue)", type: AccountType.LIABILITY, subType: AccountSubType.CUSTOMER_ADVANCES, isSystem: true },
  { code: "2030", name: "Accrued Salaries & Benefits", type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, isSystem: false },
  
  // Equity (3000s)
  { code: "3010", name: "Owner / Partner Capital", type: AccountType.EQUITY, subType: AccountSubType.OWNERS_EQUITY, isSystem: true },
  { code: "3020", name: "Retained Earnings", type: AccountType.EQUITY, subType: AccountSubType.RETAINED_EARNINGS, isSystem: true },
  
  // Revenue (4000s)
  { code: "4010", name: "Document Clearing & MOHRE Revenue", type: AccountType.REVENUE, subType: AccountSubType.OPERATING_REVENUE, isSystem: true },
  { code: "4020", name: "Visa & Immigration Processing Revenue", type: AccountType.REVENUE, subType: AccountSubType.OPERATING_REVENUE, isSystem: true },
  { code: "4030", name: "Business Setup & Licensing Revenue", type: AccountType.REVENUE, subType: AccountSubType.OPERATING_REVENUE, isSystem: true },
  { code: "4040", name: "General Consultancy Revenue", type: AccountType.REVENUE, subType: AccountSubType.OPERATING_REVENUE, isSystem: false },
  
  // Expenses (5000s)
  { code: "5010", name: "Government Transaction & Tasheel Fees", type: AccountType.EXPENSE, subType: AccountSubType.GOVERNMENT_FEES, isSystem: true },
  { code: "5020", name: "Office Rent", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, isSystem: false },
  { code: "5030", name: "Staff Salaries & Allowances", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, isSystem: false },
  { code: "5040", name: "Utilities (DEWA & Internet)", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, isSystem: false },
  { code: "5050", name: "Marketing, Advertising & Software", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, isSystem: false },
  { code: "5060", name: "Office Supplies & Miscellaneous", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, isSystem: false },
  { code: "5070", name: "Supplier Services Cost", type: AccountType.EXPENSE, subType: AccountSubType.DIRECT_COST, isSystem: false },
];
