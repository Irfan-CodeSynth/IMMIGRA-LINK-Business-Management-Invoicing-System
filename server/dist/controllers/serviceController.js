"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServices = listServices;
exports.createService = createService;
exports.updateService = updateService;
exports.toggleServiceStatus = toggleServiceStatus;
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
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const { defaultRateAed, costAed, governmentFeesAed, ...rest } = parsed.data;
        const service = await Service_1.ServiceModel.create({
            ...rest,
            defaultRateFils: (0, shared_1.aedToFils)(defaultRateAed),
            costFils: (0, shared_1.aedToFils)(costAed || 0),
            governmentFeesFils: (0, shared_1.aedToFils)(governmentFeesAed || 0),
        });
        res.status(201).json({ success: true, data: service });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function updateService(req, res) {
    try {
        const parsed = shared_2.ServiceSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const { defaultRateAed, costAed, governmentFeesAed, ...rest } = parsed.data;
        const service = await Service_1.ServiceModel.findByIdAndUpdate(req.params.id, {
            $set: {
                ...rest,
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
