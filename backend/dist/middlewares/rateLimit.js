"use strict";
// src/middlewares/rateLimit.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.standardLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Basic rate limit for most routes
exports.standardLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
// Stricter limit for auth endpoints
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10, // limit each IP to 10 auth requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
