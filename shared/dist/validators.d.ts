import { z } from "zod";
import { CustomerType, PaymentMethod, UserRole } from "./constants";
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const UserCreateSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string | undefined;
}>;
export declare const CustomerSchema: z.ZodObject<{
    customerType: z.ZodNativeEnum<typeof CustomerType>;
    displayName: z.ZodString;
    companyName: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodString;
    whatsapp: z.ZodOptional<z.ZodString>;
    nationality: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        emirate: z.ZodOptional<z.ZodString>;
        poBox: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        street?: string | undefined;
        city?: string | undefined;
        emirate?: string | undefined;
        poBox?: string | undefined;
    }, {
        street?: string | undefined;
        city?: string | undefined;
        emirate?: string | undefined;
        poBox?: string | undefined;
    }>>;
    tradeLicenseNumber: z.ZodOptional<z.ZodString>;
    trn: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    customerType: CustomerType;
    displayName: string;
    email?: string | undefined;
    companyName?: string | undefined;
    contactPerson?: string | undefined;
    whatsapp?: string | undefined;
    nationality?: string | undefined;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        emirate?: string | undefined;
        poBox?: string | undefined;
    } | undefined;
    tradeLicenseNumber?: string | undefined;
    trn?: string | undefined;
    notes?: string | undefined;
}, {
    phone: string;
    customerType: CustomerType;
    displayName: string;
    email?: string | undefined;
    companyName?: string | undefined;
    contactPerson?: string | undefined;
    whatsapp?: string | undefined;
    nationality?: string | undefined;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        emirate?: string | undefined;
        poBox?: string | undefined;
    } | undefined;
    tradeLicenseNumber?: string | undefined;
    trn?: string | undefined;
    notes?: string | undefined;
}>;
export declare const ServiceSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    category: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    defaultRateAed: z.ZodNumber;
    costAed: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    governmentFeesAed: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    revenueAccountCode: z.ZodDefault<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    category: string;
    defaultRateAed: number;
    costAed: number;
    governmentFeesAed: number;
    revenueAccountCode: string;
    isActive: boolean;
    description?: string | undefined;
}, {
    code: string;
    name: string;
    category: string;
    defaultRateAed: number;
    description?: string | undefined;
    costAed?: number | undefined;
    governmentFeesAed?: number | undefined;
    revenueAccountCode?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const InvoiceItemSchema: z.ZodObject<{
    serviceId: z.ZodOptional<z.ZodString>;
    serviceName: z.ZodString;
    clientName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodNumber;
    unitRateAed: z.ZodNumber;
    discountAed: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    serviceName: string;
    clientName: string;
    quantity: number;
    unitRateAed: number;
    discountAed: number;
    serviceId?: string | undefined;
}, {
    serviceName: string;
    quantity: number;
    unitRateAed: number;
    description?: string | undefined;
    serviceId?: string | undefined;
    clientName?: string | undefined;
    discountAed?: number | undefined;
}>;
export declare const InvoiceCreateSchema: z.ZodObject<{
    customerId: z.ZodString;
    issueDate: z.ZodString;
    dueDate: z.ZodString;
    supplyDate: z.ZodOptional<z.ZodString>;
    referenceNote: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        serviceId: z.ZodOptional<z.ZodString>;
        serviceName: z.ZodString;
        clientName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNumber;
        unitRateAed: z.ZodNumber;
        discountAed: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        serviceName: string;
        clientName: string;
        quantity: number;
        unitRateAed: number;
        discountAed: number;
        serviceId?: string | undefined;
    }, {
        serviceName: string;
        quantity: number;
        unitRateAed: number;
        description?: string | undefined;
        serviceId?: string | undefined;
        clientName?: string | undefined;
        discountAed?: number | undefined;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
    paymentTerms: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "ISSUED"]>>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "ISSUED";
    customerId: string;
    issueDate: string;
    dueDate: string;
    items: {
        description: string;
        serviceName: string;
        clientName: string;
        quantity: number;
        unitRateAed: number;
        discountAed: number;
        serviceId?: string | undefined;
    }[];
    notes?: string | undefined;
    supplyDate?: string | undefined;
    referenceNote?: string | undefined;
    paymentTerms?: string | undefined;
}, {
    customerId: string;
    issueDate: string;
    dueDate: string;
    items: {
        serviceName: string;
        quantity: number;
        unitRateAed: number;
        description?: string | undefined;
        serviceId?: string | undefined;
        clientName?: string | undefined;
        discountAed?: number | undefined;
    }[];
    status?: "DRAFT" | "ISSUED" | undefined;
    notes?: string | undefined;
    supplyDate?: string | undefined;
    referenceNote?: string | undefined;
    paymentTerms?: string | undefined;
}>;
export declare const QuotationCreateSchema: z.ZodObject<{
    customerId: z.ZodString;
    issueDate: z.ZodString;
    expiryDate: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        serviceId: z.ZodOptional<z.ZodString>;
        serviceName: z.ZodString;
        clientName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNumber;
        unitRateAed: z.ZodNumber;
        discountAed: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        serviceName: string;
        clientName: string;
        quantity: number;
        unitRateAed: number;
        discountAed: number;
        serviceId?: string | undefined;
    }, {
        serviceName: string;
        quantity: number;
        unitRateAed: number;
        description?: string | undefined;
        serviceId?: string | undefined;
        clientName?: string | undefined;
        discountAed?: number | undefined;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
    termsAndConditions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    issueDate: string;
    items: {
        description: string;
        serviceName: string;
        clientName: string;
        quantity: number;
        unitRateAed: number;
        discountAed: number;
        serviceId?: string | undefined;
    }[];
    expiryDate: string;
    notes?: string | undefined;
    termsAndConditions?: string | undefined;
}, {
    customerId: string;
    issueDate: string;
    items: {
        serviceName: string;
        quantity: number;
        unitRateAed: number;
        description?: string | undefined;
        serviceId?: string | undefined;
        clientName?: string | undefined;
        discountAed?: number | undefined;
    }[];
    expiryDate: string;
    notes?: string | undefined;
    termsAndConditions?: string | undefined;
}>;
export declare const PaymentAllocationSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    allocatedAmountAed: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    invoiceId: string;
    allocatedAmountAed: number;
}, {
    invoiceId: string;
    allocatedAmountAed: number;
}>;
export declare const PaymentCreateSchema: z.ZodObject<{
    customerId: z.ZodString;
    paymentDate: z.ZodString;
    amountAed: z.ZodNumber;
    paymentMethod: z.ZodNativeEnum<typeof PaymentMethod>;
    depositAccountCode: z.ZodString;
    referenceNumber: z.ZodOptional<z.ZodString>;
    allocations: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        invoiceId: z.ZodString;
        allocatedAmountAed: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        invoiceId: string;
        allocatedAmountAed: number;
    }, {
        invoiceId: string;
        allocatedAmountAed: number;
    }>, "many">>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    paymentDate: string;
    amountAed: number;
    paymentMethod: PaymentMethod;
    depositAccountCode: string;
    allocations: {
        invoiceId: string;
        allocatedAmountAed: number;
    }[];
    notes?: string | undefined;
    referenceNumber?: string | undefined;
}, {
    customerId: string;
    paymentDate: string;
    amountAed: number;
    paymentMethod: PaymentMethod;
    depositAccountCode: string;
    notes?: string | undefined;
    referenceNumber?: string | undefined;
    allocations?: {
        invoiceId: string;
        allocatedAmountAed: number;
    }[] | undefined;
}>;
export declare const ExpenseCreateSchema: z.ZodObject<{
    expenseDate: z.ZodString;
    category: z.ZodString;
    expenseAccountCode: z.ZodString;
    paymentAccountCode: z.ZodString;
    amountAed: z.ZodNumber;
    payee: z.ZodString;
    supplierId: z.ZodOptional<z.ZodString>;
    relatedCustomerId: z.ZodOptional<z.ZodString>;
    relatedServiceName: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodNativeEnum<typeof PaymentMethod>;
    referenceNumber: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category: string;
    amountAed: number;
    paymentMethod: PaymentMethod;
    expenseDate: string;
    expenseAccountCode: string;
    paymentAccountCode: string;
    payee: string;
    notes?: string | undefined;
    referenceNumber?: string | undefined;
    supplierId?: string | undefined;
    relatedCustomerId?: string | undefined;
    relatedServiceName?: string | undefined;
}, {
    category: string;
    amountAed: number;
    paymentMethod: PaymentMethod;
    expenseDate: string;
    expenseAccountCode: string;
    paymentAccountCode: string;
    payee: string;
    notes?: string | undefined;
    referenceNumber?: string | undefined;
    supplierId?: string | undefined;
    relatedCustomerId?: string | undefined;
    relatedServiceName?: string | undefined;
}>;
export declare const SupplierSchema: z.ZodObject<{
    supplierName: z.ZodString;
    contactPerson: z.ZodOptional<z.ZodString>;
    phone: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    address: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    supplierName: string;
    email?: string | undefined;
    contactPerson?: string | undefined;
    address?: string | undefined;
    notes?: string | undefined;
}, {
    phone: string;
    supplierName: string;
    email?: string | undefined;
    contactPerson?: string | undefined;
    address?: string | undefined;
    notes?: string | undefined;
}>;
export declare const SettingsUpdateSchema: z.ZodObject<{
    companyName: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    city: z.ZodDefault<z.ZodString>;
    address: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    website: z.ZodOptional<z.ZodString>;
    tradeLicenseNumber: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    trn: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    isVatRegistered: z.ZodDefault<z.ZodBoolean>;
    currency: z.ZodDefault<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    bankDetails: z.ZodOptional<z.ZodObject<{
        bankName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        accountTitle: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        accountNumber: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        iban: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        swiftCode: z.ZodOptional<z.ZodString>;
        branch: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        bankName: string;
        accountTitle: string;
        accountNumber: string;
        iban: string;
        swiftCode?: string | undefined;
        branch?: string | undefined;
    }, {
        bankName?: string | undefined;
        accountTitle?: string | undefined;
        accountNumber?: string | undefined;
        iban?: string | undefined;
        swiftCode?: string | undefined;
        branch?: string | undefined;
    }>>;
    invoicePrefix: z.ZodDefault<z.ZodString>;
    invoiceNextSequence: z.ZodDefault<z.ZodNumber>;
    invoiceDefaultNotes: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    invoicePaymentInstructions: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone: string;
    companyName: string;
    city: string;
    address: string;
    tradeLicenseNumber: string;
    trn: string;
    country: string;
    isVatRegistered: boolean;
    currency: string;
    timezone: string;
    invoicePrefix: string;
    invoiceNextSequence: number;
    invoiceDefaultNotes: string;
    invoicePaymentInstructions: string;
    website?: string | undefined;
    bankDetails?: {
        bankName: string;
        accountTitle: string;
        accountNumber: string;
        iban: string;
        swiftCode?: string | undefined;
        branch?: string | undefined;
    } | undefined;
}, {
    email: string;
    phone: string;
    companyName: string;
    address: string;
    city?: string | undefined;
    tradeLicenseNumber?: string | undefined;
    trn?: string | undefined;
    country?: string | undefined;
    website?: string | undefined;
    isVatRegistered?: boolean | undefined;
    currency?: string | undefined;
    timezone?: string | undefined;
    bankDetails?: {
        bankName?: string | undefined;
        accountTitle?: string | undefined;
        accountNumber?: string | undefined;
        iban?: string | undefined;
        swiftCode?: string | undefined;
        branch?: string | undefined;
    } | undefined;
    invoicePrefix?: string | undefined;
    invoiceNextSequence?: number | undefined;
    invoiceDefaultNotes?: string | undefined;
    invoicePaymentInstructions?: string | undefined;
}>;
//# sourceMappingURL=validators.d.ts.map