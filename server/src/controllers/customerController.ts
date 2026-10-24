import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { CustomerModel } from "../models/Customer";
import { InvoiceModel } from "../models/Invoice";
import { PaymentModel } from "../models/Payment";
import { getNextSequence } from "../models/Sequence";
import { CustomerSchema } from "@immigra/shared";
import { AuditLogModel } from "../models/AuditLog";

export async function listCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, type, status, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (type) {
      query.customerType = type;
    }
    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    if (search) {
      const regex = new RegExp(String(search), "i");
      query.$or = [
        { displayName: regex },
        { companyName: regex },
        { phone: regex },
        { email: regex },
        { referenceNumber: regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      CustomerModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      CustomerModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    // Fetch related invoices and payments
    const [invoices, payments] = await Promise.all([
      InvoiceModel.find({ customerId: customer._id }).sort({ issueDate: -1 }),
      PaymentModel.find({ customerId: customer._id }).sort({ paymentDate: -1 }),
    ]);

    res.json({
      success: true,
      data: {
        customer,
        invoices,
        payments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = CustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Invalid customer data";
      res.status(400).json({ success: false, message: firstError, errors: parsed.error.flatten() });
      return;
    }

    const seq = await getNextSequence("CUSTOMER", 1001);
    const referenceNumber = `CUST-${seq}`;

    const customer = await CustomerModel.create({
      ...parsed.data,
      referenceNumber,
    });

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "CREATE_CUSTOMER",
        entityType: "CUSTOMER",
        entityId: customer._id.toString(),
        details: { referenceNumber, displayName: customer.displayName },
      });
    }

    res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = CustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Invalid customer data";
      res.status(400).json({ success: false, message: firstError, errors: parsed.error.flatten() });
      return;
    }

    const customer = await CustomerModel.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { new: true }
    );

    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "UPDATE_CUSTOMER",
        entityType: "CUSTOMER",
        entityId: customer._id.toString(),
        details: { displayName: customer.displayName },
      });
    }

    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleCustomerStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    const invoiceCount = await InvoiceModel.countDocuments({ customerId: customer._id });
    if (invoiceCount > 0) {
      customer.isActive = false;
      await customer.save();
      res.json({
        success: true,
        message: `Customer "${customer.displayName}" has ${invoiceCount} linked invoice(s). Safely archived customer to preserve fiscal audit trail.`,
        data: customer,
      });
      return;
    }

    await CustomerModel.findByIdAndDelete(customer._id);

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "DELETE_CUSTOMER",
        entityType: "CUSTOMER",
        entityId: customer._id.toString(),
        details: { displayName: customer.displayName, referenceNumber: customer.referenceNumber },
      });
    }

    res.json({ success: true, message: "Customer deleted successfully", data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
