import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { ServiceModel } from "../models/Service";
import { aedToFils } from "@immigra/shared";
import { ServiceSchema } from "@immigra/shared";

export async function listServices(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { category, search, activeOnly } = req.query;
    const query: any = {};

    if (category) {
      query.category = category;
    }
    if (activeOnly === "true") {
      query.isActive = true;
    }
    if (search) {
      const regex = new RegExp(String(search), "i");
      query.$or = [{ name: regex }, { code: regex }, { category: regex }];
    }

    const services = await ServiceModel.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, data: services });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createService(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = ServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Invalid service data";
      res.status(400).json({ success: false, message: firstError, errors: parsed.error.flatten() });
      return;
    }

    const { defaultRateAed, costAed, governmentFeesAed, ...rest } = parsed.data;
    let cleanCode = (rest.code || "").trim().toUpperCase();

    // If code is not provided, generate a unique sequential code
    if (!cleanCode) {
      const count = await ServiceModel.countDocuments();
      let num = count + 1;
      cleanCode = `SRV-${num.toString().padStart(3, "0")}`;
      while (await ServiceModel.exists({ code: cleanCode })) {
        num++;
        cleanCode = `SRV-${num.toString().padStart(3, "0")}`;
      }
    } else {
      // Check for duplicate code
      const existing = await ServiceModel.findOne({ code: cleanCode });
      if (existing) {
        res.status(400).json({
          success: false,
          message: `Service code "${cleanCode}" is already in use. Please enter a different code or leave it blank to auto-generate.`,
        });
        return;
      }
    }

    const service = await ServiceModel.create({
      ...rest,
      name: rest.name.trim(),
      code: cleanCode,
      defaultRateFils: aedToFils(defaultRateAed),
      costFils: aedToFils(costAed || 0),
      governmentFeesFils: aedToFils(governmentFeesAed || 0),
    });

    res.status(201).json({ success: true, data: service });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "A service with this code already exists. Please choose a unique service code.",
      });
      return;
    }
    res.status(500).json({ success: false, message: error.message || "Failed to create service" });
  }
}

export async function updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = ServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Invalid service data";
      res.status(400).json({ success: false, message: firstError, errors: parsed.error.flatten() });
      return;
    }

    const { defaultRateAed, costAed, governmentFeesAed, ...rest } = parsed.data;
    let cleanCode = (rest.code || "").trim().toUpperCase();

    // Check duplicate code on another service if provided
    if (cleanCode) {
      const existing = await ServiceModel.findOne({
        code: cleanCode,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        res.status(400).json({
          success: false,
          message: `Service code "${cleanCode}" is already in use by another service.`,
        });
        return;
      }
    } else {
      const currentService = await ServiceModel.findById(req.params.id);
      cleanCode = currentService?.code || `SRV-${Date.now().toString().slice(-4)}`;
    }

    const service = await ServiceModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...rest,
          name: rest.name.trim(),
          code: cleanCode,
          defaultRateFils: aedToFils(defaultRateAed),
          costFils: aedToFils(costAed || 0),
          governmentFeesFils: aedToFils(governmentFeesAed || 0),
        },
      },
      { new: true }
    );

    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    res.json({ success: true, data: service });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "A service with this code already exists. Please choose a unique service code.",
      });
      return;
    }
    res.status(500).json({ success: false, message: error.message || "Failed to update service" });
  }
}

export async function getService(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const service = await ServiceModel.findById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }
    res.json({ success: true, data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleServiceStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const service = await ServiceModel.findById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    service.isActive = !service.isActive;
    await service.save();

    res.json({ success: true, data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteService(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const service = await ServiceModel.findById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    await ServiceModel.findByIdAndDelete(service._id);
    res.json({ success: true, message: `Service "${service.name}" deleted successfully`, data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
