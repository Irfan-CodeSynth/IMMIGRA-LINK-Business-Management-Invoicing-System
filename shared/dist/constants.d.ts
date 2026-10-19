export declare const APP_NAME = "IMMIGRA LINK BUSINESS SERVICES";
export declare const DEFAULT_CURRENCY = "AED";
export declare const TIMEZONE = "Asia/Dubai";
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    MANAGER = "MANAGER",
    ACCOUNTANT = "ACCOUNTANT",
    SALES = "SALES",
    CASHIER = "CASHIER",
    VIEWER = "VIEWER"
}
export declare enum CustomerType {
    INDIVIDUAL = "INDIVIDUAL",
    BUSINESS = "BUSINESS"
}
export declare enum ServiceCategory {
    IMMIGRATION = "Immigration Services",
    VISA = "Visa Services",
    LABOUR_MOHRE = "Labour and MOHRE Services",
    BUSINESS_SETUP = "Business Setup",
    DOCUMENT_CLEARING = "Document Clearing",
    GOVERNMENT_TRANSACTIONS = "Government Transactions",
    RTA_SERVICES = "RTA Services",
    GENERAL_CONSULTANCY = "General Consultancy",
    OTHER = "Other Services"
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    ISSUED = "ISSUED",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    VOID = "VOID"
}
export declare enum QuotationStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CONVERTED = "CONVERTED"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    BANK_TRANSFER = "BANK_TRANSFER",
    CARD = "CARD",
    CHEQUE = "CHEQUE",
    OTHER = "OTHER"
}
export declare enum AccountType {
    ASSET = "ASSET",
    LIABILITY = "LIABILITY",
    EQUITY = "EQUITY",
    REVENUE = "REVENUE",
    EXPENSE = "EXPENSE"
}
export declare enum AccountSubType {
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
    GOVERNMENT_FEES = "GOVERNMENT_FEES"
}
export declare const DEFAULT_CHART_OF_ACCOUNTS: {
    code: string;
    name: string;
    type: AccountType;
    subType: AccountSubType;
    isSystem: boolean;
}[];
//# sourceMappingURL=constants.d.ts.map