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
exports.isTeamMember = exports.isTeamCaptain = exports.isTournamentParticipant = exports.isTournamentHost = exports.isSystemAdmin = void 0;
const db_1 = __importDefault(require("../lib/db"));
// Check if user is a system administrator
const isSystemAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const user = yield db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { isAdmin: true } // Assuming you add an isAdmin flag to your schema
        });
        if (!user || !user.isAdmin) {
            res.status(403).json({ error: 'Admin privileges required' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.isSystemAdmin = isSystemAdmin;
// Check if user is host of a tournament
const isTournamentHost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Tournament ID is required' });
            return;
        }
        const tournament = yield db_1.default.tournament.findFirst({
            where: {
                id,
                hostId: req.user.id
            }
        });
        if (!tournament) {
            res.status(403).json({ error: 'Only the tournament host can perform this action' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Error checking tournament host:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.isTournamentHost = isTournamentHost;
// Check if user is participant in a tournament
const isTournamentParticipant = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Tournament ID is required' });
            return;
        }
        const participant = yield db_1.default.tournamentParticipant.findFirst({
            where: {
                tournamentId: id,
                userId: req.user.id
            }
        });
        if (!participant) {
            res.status(403).json({ error: 'Only tournament participants can perform this action' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Error checking tournament participant:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.isTournamentParticipant = isTournamentParticipant;
// Additional export of existing middleware functions...
const isTeamCaptain = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id: teamId } = req.params;
        if (!teamId) {
            res.status(400).json({ error: 'Team ID is required' });
            return;
        }
        const team = yield db_1.default.team.findUnique({
            where: { id: teamId },
            include: {
                captain: true
            }
        });
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        if (team.captain.userId !== req.user.id) {
            res.status(403).json({ error: 'Only the team captain can perform this action' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Error checking team captain:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.isTeamCaptain = isTeamCaptain;
// Check if user is team member
const isTeamMember = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id: teamId } = req.params;
        if (!teamId) {
            res.status(400).json({ error: 'Team ID is required' });
            return;
        }
        // Find if user is a team member
        const participant = yield db_1.default.tournamentParticipant.findFirst({
            where: {
                userId: req.user.id,
                teamId
            }
        });
        if (!participant) {
            res.status(403).json({ error: 'Only team members can perform this action' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Error checking team membership:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.isTeamMember = isTeamMember;
