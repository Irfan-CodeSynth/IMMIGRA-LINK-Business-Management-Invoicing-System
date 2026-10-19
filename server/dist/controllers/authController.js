"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.getMe = getMe;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const jwt_1 = require("../config/jwt");
const shared_1 = require("@immigra/shared");
const AuditLog_1 = require("../models/AuditLog");
async function login(req, res) {
    try {
        const parsed = shared_1.LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const { email, password } = parsed.data;
        const user = await User_1.UserModel.findOne({ email: email.toLowerCase() });
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: "Invalid email or inactive account" });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ success: false, message: "Invalid credentials" });
            return;
        }
        user.lastLoginAt = new Date();
        await user.save();
        const token = (0, jwt_1.signToken)({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
        });
        (0, jwt_1.setAuthCookie)(res, token);
        await AuditLog_1.AuditLogModel.create({
            userId: user._id,
            userName: user.name,
            action: "LOGIN",
            entityType: "AUTH",
            details: { email: user.email },
            ipAddress: req.ip,
        });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    avatarUrl: user.avatarUrl,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function logout(req, res) {
    (0, jwt_1.clearAuthCookie)(res);
    if (req.user) {
        await AuditLog_1.AuditLogModel.create({
            userId: req.user.userId,
            userName: req.user.name,
            action: "LOGOUT",
            entityType: "AUTH",
            ipAddress: req.ip,
        });
    }
    res.json({ success: true, message: "Logged out successfully" });
}
async function getMe(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }
    const user = await User_1.UserModel.findById(req.user.userId).select("-passwordHash");
    if (!user || !user.isActive) {
        res.status(401).json({ success: false, message: "Account not found or inactive" });
        return;
    }
    res.json({ success: true, data: user });
}
