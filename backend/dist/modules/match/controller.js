"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescheduleMatch = exports.generateBracket = exports.assignJudge = exports.getUserMatches = exports.getTournamentMatches = exports.resolveDispute = exports.disputeMatchResult = exports.cancelMatch = exports.startMatch = exports.submitMatchResult = exports.updateMatch = exports.createMatch = exports.getMatchById = exports.getMatches = void 0;
const matchService = __importStar(require("./service"));
const getMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const tournamentId = req.query.tournamentId;
        const status = req.query.status;
        const round = req.query.round ? parseInt(req.query.round) : undefined;
        const matches = yield matchService.getMatches(page, limit, tournamentId, status, round);
        res.json(matches);
    }
    catch (error) {
        console.error('Error getting matches:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch matches' });
    }
});
exports.getMatches = getMatches;
const getMatchById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const match = yield matchService.getMatchById(id);
        if (!match) {
            res.status(404).json({ error: 'Match not found' });
        }
        res.json(match);
    }
    catch (error) {
        console.error('Error getting match by ID:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch match' });
    }
});
exports.getMatchById = getMatchById;
const createMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const matchData = req.body;
        const match = yield matchService.createMatch(matchData);
        res.status(201).json(match);
    }
    catch (error) {
        console.error('Error creating match:', error);
        res.status(400).json({ error: error.message || 'Failed to create match' });
    }
});
exports.createMatch = createMatch;
const updateMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const match = yield matchService.updateMatch(id, updateData);
        res.json(match);
    }
    catch (error) {
        console.error('Error updating match:', error);
        res.status(400).json({ error: error.message || 'Failed to update match' });
    }
});
exports.updateMatch = updateMatch;
const submitMatchResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = req.body;
        const match = yield matchService.submitMatchResult(id, userId, result);
        res.json(match);
    }
    catch (error) {
        console.error('Error submitting match result:', error);
        res.status(400).json({ error: error.message || 'Failed to submit match result' });
    }
});
exports.submitMatchResult = submitMatchResult;
const startMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const match = yield matchService.startMatch(id, userId);
        res.json(match);
    }
    catch (error) {
        console.error('Error starting match:', error);
        res.status(400).json({ error: error.message || 'Failed to start match' });
    }
});
exports.startMatch = startMatch;
const cancelMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const match = yield matchService.cancelMatch(id, userId);
        res.json(match);
    }
    catch (error) {
        console.error('Error cancelling match:', error);
        res.status(400).json({ error: error.message || 'Failed to cancel match' });
    }
});
exports.cancelMatch = cancelMatch;
const disputeMatchResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { reason } = req.body;
        const match = yield matchService.disputeMatchResult(id, userId, reason);
        res.json(match);
    }
    catch (error) {
        console.error('Error disputing match result:', error);
        res.status(400).json({ error: error.message || 'Failed to dispute match result' });
    }
});
exports.disputeMatchResult = disputeMatchResult;
const resolveDispute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = req.body;
        const match = yield matchService.resolveDispute(id, userId, result);
        res.json(match);
    }
    catch (error) {
        console.error('Error resolving dispute:', error);
        res.status(400).json({ error: error.message || 'Failed to resolve dispute' });
    }
});
exports.resolveDispute = resolveDispute;
const getTournamentMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tournamentId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const round = req.query.round ? parseInt(req.query.round) : undefined;
        const matches = yield matchService.getTournamentMatches(tournamentId, page, limit, round);
        res.json(matches);
    }
    catch (error) {
        console.error('Error getting tournament matches:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tournament matches' });
    }
});
exports.getTournamentMatches = getTournamentMatches;
const getUserMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const matches = yield matchService.getUserMatches(userId, page, limit, status);
        res.json(matches);
    }
    catch (error) {
        console.error('Error getting user matches:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch user matches' });
    }
});
exports.getUserMatches = getUserMatches;
const assignJudge = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { judgeId } = req.body;
        const requesterId = req.user.id;
        const match = yield matchService.assignJudge(id, judgeId, requesterId);
        res.json(match);
    }
    catch (error) {
        console.error('Error assigning judge:', error);
        res.status(400).json({ error: error.message || 'Failed to assign judge' });
    }
});
exports.assignJudge = assignJudge;
const generateBracket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tournamentId } = req.params;
        const userId = req.user.id;
        const matches = yield matchService.generateBracket(tournamentId, userId);
        res.json(matches);
    }
    catch (error) {
        console.error('Error generating bracket:', error);
        res.status(400).json({ error: error.message || 'Failed to generate bracket' });
    }
});
exports.generateBracket = generateBracket;
const rescheduleMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { scheduledTime } = req.body;
        const userId = req.user.id;
        const match = yield matchService.rescheduleMatch(id, scheduledTime, userId);
        res.json(match);
    }
    catch (error) {
        console.error('Error rescheduling match:', error);
        res.status(400).json({ error: error.message || 'Failed to reschedule match' });
    }
});
exports.rescheduleMatch = rescheduleMatch;
