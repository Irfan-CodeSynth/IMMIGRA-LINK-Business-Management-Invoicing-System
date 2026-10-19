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
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const { defaultRateAed, costAed, governmentFeesAed, ...rest } = parsed.data;

    const service = await ServiceModel.create({
      ...rest,
      defaultRateFils: aedToFils(defaultRateAed),
      costFils: aedToFils(costAed || 0),
      governmentFeesFils: aedToFils(governmentFeesAed || 0),
    });

    res.status(201).json({ success: true, data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = ServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const { defaultRateAed, costAed, governmentFeesAed, ...rest } = parsed.data;

    const service = await ServiceModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...rest,
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
    res.status(500).json({ success: false, message: error.message });
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
