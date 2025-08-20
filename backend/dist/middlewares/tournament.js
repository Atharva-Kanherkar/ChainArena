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
exports.requireTournamentHost = void 0;
const db_1 = __importDefault(require("../lib/db"));
const requireTournamentHost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: tournamentId } = req.params;
        const userId = req.user.id;
        const tournament = yield db_1.default.tournament.findUnique({
            where: {
                id: tournamentId,
                hostId: userId // Check if user is the host
            }
        });
        if (!tournament) {
            return res.status(403).json({ error: 'You are not authorized to manage this tournament' });
        }
        next();
    }
    catch (error) {
        console.error('Error in requireTournamentHost middleware:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.requireTournamentHost = requireTournamentHost;
// For admin functionality, you could add a separate isAdmin flag to the User model
