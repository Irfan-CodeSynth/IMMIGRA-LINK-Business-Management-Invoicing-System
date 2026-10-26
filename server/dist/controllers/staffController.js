"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStaff = listStaff;
exports.createStaff = createStaff;
exports.toggleStaffStatus = toggleStaffStatus;
exports.deleteStaff = deleteStaff;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const shared_1 = require("@immigra/shared");
const AuditLog_1 = require("../models/AuditLog");
async function listStaff(req, res) {
    try {
        const users = await User_1.UserModel.find().select("-passwordHash").sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function createStaff(req, res) {
    try {
        const parsed = shared_1.UserCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const { email, password, name, role, phone } = parsed.data;
        const existing = await User_1.UserModel.findOne({ email: email.toLowerCase() });
        if (existing) {
            res.status(400).json({ success: false, message: "A staff member with this email already exists" });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await User_1.UserModel.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
            role,
            phone,
            isActive: true,
        });
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "CREATE_STAFF",
                entityType: "USER",
                entityId: user._id.toString(),
                details: { email: user.email, role: user.role },
            });
        }
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                isActive: user.isActive,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function toggleStaffStatus(req, res) {
    try {
        const user = await User_1.UserModel.findById(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: "Staff user not found" });
            return;
        }
        user.isActive = !user.isActive;
        await user.save();
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function deleteStaff(req, res) {
    try {
        const user = await User_1.UserModel.findById(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: "Staff user not found" });
            return;
        }
        // Safety checks
        if (req.user && req.user.userId === user._id.toString()) {
            res.status(400).json({ success: false, message: "You cannot delete your own logged-in account" });
            return;
        }
        if (user.role === shared_1.UserRole.SUPER_ADMIN) {
            const superAdminCount = await User_1.UserModel.countDocuments({ role: shared_1.UserRole.SUPER_ADMIN });
            if (superAdminCount <= 1) {
                res.status(400).json({ success: false, message: "Cannot delete the sole Super Admin account in the system" });
                return;
            }
        }
        await User_1.UserModel.findByIdAndDelete(user._id);
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "DELETE_STAFF",
                entityType: "USER",
                entityId: user._id.toString(),
                details: { email: user.email, name: user.name, role: user.role },
            });
        }
        res.json({ success: true, message: `Staff user "${user.name}" (${user.email}) deleted successfully`, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
