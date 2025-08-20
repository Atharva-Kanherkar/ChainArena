"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireJudgeOrAdmin = exports.requireOrganizer = exports.requireAdmin = void 0;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../lib/db"));
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== client_1.UserRole.ADMIN) {
        res.status(403).json({ error: 'Insufficient permissions: Admin role required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireOrganizer = (req, res, next) => {
    if (!req.user || (req.user.role !== client_1.UserRole.ORGANIZER && req.user.role !== client_1.UserRole.ADMIN)) {
        res.status(403).json({ error: 'Insufficient permissions: Organizer role required' });
    }
    next();
};
exports.requireOrganizer = requireOrganizer;
const requireJudgeOrAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
        }
        // Admin can always verify matches
        if (req.user.role === client_1.UserRole.ADMIN) {
            next();
        }
        const { id: matchId } = req.params;
        // Get the match
        const match = yield db_1.default.match.findUnique({
            where: { id: matchId },
            include: {
                tournament: true
            }
        });
        if (!match) {
            res.status(404).json({ error: 'Match not found' });
        }
        // Check if user is tournament organizer
        if ((match === null || match === void 0 ? void 0 : match.tournament.organizerId) === req.user.id) {
            next();
        }
        // Check if user is assigned judge for this match
        if ((match === null || match === void 0 ? void 0 : match.judgeId) === req.user.id) {
            next();
        }
        res.status(403).json({
            error: 'Insufficient permissions: Only admins, tournament organizers, or assigned judges can perform this action'
        });
    }
    catch (error) {
        console.error('Error in requireJudgeOrAdmin middleware:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.requireJudgeOrAdmin = requireJudgeOrAdmin;
