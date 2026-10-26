"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CHART_OF_ACCOUNTS = exports.AccountSubType = exports.AccountType = exports.PaymentMethod = exports.QuotationStatus = exports.InvoiceStatus = exports.ServiceCategory = exports.CustomerType = exports.UserRole = exports.TIMEZONE = exports.DEFAULT_CURRENCY = exports.SOFTWARE_NAME = exports.APP_NAME = void 0;
exports.APP_NAME = "DeepX Ai Solutions";
exports.SOFTWARE_NAME = "DeepX Invoice System";
exports.DEFAULT_CURRENCY = "AED";
exports.TIMEZONE = "Asia/Dubai";
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["ACCOUNTANT"] = "ACCOUNTANT";
    UserRole["SALES"] = "SALES";
    UserRole["CASHIER"] = "CASHIER";
    UserRole["VIEWER"] = "VIEWER";
})(UserRole || (exports.UserRole = UserRole = {}));
var CustomerType;
(function (CustomerType) {
    CustomerType["INDIVIDUAL"] = "INDIVIDUAL";
    CustomerType["BUSINESS"] = "BUSINESS";
})(CustomerType || (exports.CustomerType = CustomerType = {}));
var ServiceCategory;
(function (ServiceCategory) {
    ServiceCategory["IMMIGRATION"] = "Immigration Services";
    ServiceCategory["VISA"] = "Visa Services";
    ServiceCategory["LABOUR_MOHRE"] = "Labour and MOHRE Services";
    ServiceCategory["BUSINESS_SETUP"] = "Business Setup";
    ServiceCategory["DOCUMENT_CLEARING"] = "Document Clearing";
    ServiceCategory["GOVERNMENT_TRANSACTIONS"] = "Government Transactions";
    ServiceCategory["RTA_SERVICES"] = "RTA Services";
    ServiceCategory["GENERAL_CONSULTANCY"] = "General Consultancy";
    ServiceCategory["OTHER"] = "Other Services";
})(ServiceCategory || (exports.ServiceCategory = ServiceCategory = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["ISSUED"] = "ISSUED";
    InvoiceStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["OVERDUE"] = "OVERDUE";
    InvoiceStatus["VOID"] = "VOID";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var QuotationStatus;
(function (QuotationStatus) {
    QuotationStatus["DRAFT"] = "DRAFT";
    QuotationStatus["SENT"] = "SENT";
    QuotationStatus["APPROVED"] = "APPROVED";
    QuotationStatus["REJECTED"] = "REJECTED";
    QuotationStatus["CONVERTED"] = "CONVERTED";
})(QuotationStatus || (exports.QuotationStatus = QuotationStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["CHEQUE"] = "CHEQUE";
    PaymentMethod["OTHER"] = "OTHER";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var AccountType;
(function (AccountType) {
    AccountType["ASSET"] = "ASSET";
    AccountType["LIABILITY"] = "LIABILITY";
    AccountType["EQUITY"] = "EQUITY";
    AccountType["REVENUE"] = "REVENUE";
    AccountType["EXPENSE"] = "EXPENSE";
})(AccountType || (exports.AccountType = AccountType = {}));
var AccountSubType;
(function (AccountSubType) {
    AccountSubType["CASH"] = "CASH";
    AccountSubType["BANK"] = "BANK";
    AccountSubType["ACCOUNTS_RECEIVABLE"] = "ACCOUNTS_RECEIVABLE";
    AccountSubType["CURRENT_ASSET"] = "CURRENT_ASSET";
    AccountSubType["FIXED_ASSET"] = "FIXED_ASSET";
    AccountSubType["ACCOUNTS_PAYABLE"] = "ACCOUNTS_PAYABLE";
    AccountSubType["CURRENT_LIABILITY"] = "CURRENT_LIABILITY";
    AccountSubType["CUSTOMER_ADVANCES"] = "CUSTOMER_ADVANCES";
    AccountSubType["OWNERS_EQUITY"] = "OWNERS_EQUITY";
    AccountSubType["RETAINED_EARNINGS"] = "RETAINED_EARNINGS";
    AccountSubType["OPERATING_REVENUE"] = "OPERATING_REVENUE";
    AccountSubType["OTHER_INCOME"] = "OTHER_INCOME";
    AccountSubType["DIRECT_COST"] = "DIRECT_COST";
    AccountSubType["OPERATING_EXPENSE"] = "OPERATING_EXPENSE";
    AccountSubType["GOVERNMENT_FEES"] = "GOVERNMENT_FEES";
})(AccountSubType || (exports.AccountSubType = AccountSubType = {}));
exports.DEFAULT_CHART_OF_ACCOUNTS = [
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
