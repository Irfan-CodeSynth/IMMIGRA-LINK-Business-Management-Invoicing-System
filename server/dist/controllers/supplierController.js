"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSuppliers = listSuppliers;
exports.createSupplier = createSupplier;
exports.getSupplier = getSupplier;
exports.updateSupplier = updateSupplier;
exports.deleteSupplier = deleteSupplier;
const Supplier_1 = require("../models/Supplier");
const shared_1 = require("@immigra/shared");
async function listSuppliers(req, res) {
    try {
        const suppliers = await Supplier_1.SupplierModel.find().sort({ supplierName: 1 });
        res.json({ success: true, data: suppliers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function createSupplier(req, res) {
    try {
        const parsed = shared_1.SupplierSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const supplier = await Supplier_1.SupplierModel.create(parsed.data);
        res.status(201).json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getSupplier(req, res) {
    try {
        const supplier = await Supplier_1.SupplierModel.findById(req.params.id);
        if (!supplier) {
            res.status(404).json({ success: false, message: "Supplier not found" });
            return;
        }
        res.json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function updateSupplier(req, res) {
    try {
        const parsed = shared_1.SupplierSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const supplier = await Supplier_1.SupplierModel.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true });
        if (!supplier) {
            res.status(404).json({ success: false, message: "Supplier not found" });
            return;
        }
        res.json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function deleteSupplier(req, res) {
    try {
        const supplier = await Supplier_1.SupplierModel.findById(req.params.id);
        if (!supplier) {
            res.status(404).json({ success: false, message: "Supplier not found" });
            return;
        }
        await Supplier_1.SupplierModel.findByIdAndDelete(supplier._id);
        res.json({ success: true, message: `Supplier "${supplier.supplierName}" deleted successfully`, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
