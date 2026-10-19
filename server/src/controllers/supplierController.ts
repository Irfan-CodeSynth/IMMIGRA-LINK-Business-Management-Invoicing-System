import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { SupplierModel } from "../models/Supplier";
import { SupplierSchema } from "@immigra/shared";

export async function listSuppliers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const suppliers = await SupplierModel.find().sort({ supplierName: 1 });
    res.json({ success: true, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createSupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = SupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const supplier = await SupplierModel.create(parsed.data);
    res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = SupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const supplier = await SupplierModel.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { new: true }
    );
    if (!supplier) {
      res.status(404).json({ success: false, message: "Supplier not found" });
      return;
    }

    res.json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
