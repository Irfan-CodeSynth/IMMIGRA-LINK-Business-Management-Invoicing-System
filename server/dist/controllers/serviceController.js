"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServices = listServices;
exports.createService = createService;
exports.updateService = updateService;
exports.getService = getService;
exports.toggleServiceStatus = toggleServiceStatus;
exports.deleteService = deleteService;
const Service_1 = require("../models/Service");
const shared_1 = require("@immigra/shared");
const shared_2 = require("@immigra/shared");
async function listServices(req, res) {
    try {
        const { category, search, activeOnly } = req.query;
        const query = {};
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
        const services = await Service_1.ServiceModel.find(query).sort({ category: 1, name: 1 });
        res.json({ success: true, data: services });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function createService(req, res) {
    try {
        const parsed = shared_2.ServiceSchema.safeParse(req.body);
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
            const count = await Service_1.ServiceModel.countDocuments();
            let num = count + 1;
            cleanCode = `SRV-${num.toString().padStart(3, "0")}`;
            while (await Service_1.ServiceModel.exists({ code: cleanCode })) {
                num++;
                cleanCode = `SRV-${num.toString().padStart(3, "0")}`;
            }
        }
        else {
            // Check for duplicate code
            const existing = await Service_1.ServiceModel.findOne({ code: cleanCode });
            if (existing) {
                res.status(400).json({
                    success: false,
                    message: `Service code "${cleanCode}" is already in use. Please enter a different code or leave it blank to auto-generate.`,
                });
                return;
            }
        }
        const service = await Service_1.ServiceModel.create({
            ...rest,
            name: rest.name.trim(),
            code: cleanCode,
            defaultRateFils: (0, shared_1.aedToFils)(defaultRateAed),
            costFils: (0, shared_1.aedToFils)(costAed || 0),
            governmentFeesFils: (0, shared_1.aedToFils)(governmentFeesAed || 0),
        });
        res.status(201).json({ success: true, data: service });
    }
    catch (error) {
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
async function updateService(req, res) {
    try {
        const parsed = shared_2.ServiceSchema.safeParse(req.body);
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
            const existing = await Service_1.ServiceModel.findOne({
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
        }
        else {
            const currentService = await Service_1.ServiceModel.findById(req.params.id);
            cleanCode = currentService?.code || `SRV-${Date.now().toString().slice(-4)}`;
        }
        const service = await Service_1.ServiceModel.findByIdAndUpdate(req.params.id, {
            $set: {
                ...rest,
                name: rest.name.trim(),
                code: cleanCode,
                defaultRateFils: (0, shared_1.aedToFils)(defaultRateAed),
                costFils: (0, shared_1.aedToFils)(costAed || 0),
                governmentFeesFils: (0, shared_1.aedToFils)(governmentFeesAed || 0),
            },
        }, { new: true });
        if (!service) {
            res.status(404).json({ success: false, message: "Service not found" });
            return;
        }
        res.json({ success: true, data: service });
    }
    catch (error) {
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
async function getService(req, res) {
    try {
        const service = await Service_1.ServiceModel.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, message: "Service not found" });
            return;
        }
        res.json({ success: true, data: service });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function toggleServiceStatus(req, res) {
    try {
        const service = await Service_1.ServiceModel.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, message: "Service not found" });
            return;
        }
        service.isActive = !service.isActive;
        await service.save();
        res.json({ success: true, data: service });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function deleteService(req, res) {
    try {
        const service = await Service_1.ServiceModel.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, message: "Service not found" });
            return;
        }
        await Service_1.ServiceModel.findByIdAndDelete(service._id);
        res.json({ success: true, message: `Service "${service.name}" deleted successfully`, data: service });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
