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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.getPrizePayments = exports.getTournamentPrize = void 0;
const prizeService = __importStar(require("./service"));
const db_1 = __importDefault(require("../../lib/db"));
/**
 * Get prize information for a tournament
 */
const getTournamentPrize = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tournamentId } = req.params;
        const prizeInfo = yield db_1.default.tournamentPrize.findUnique({
            where: { tournamentId },
            include: {
                payouts: {
                    orderBy: { createdAt: 'desc' },
                }
            }
        });
        if (!prizeInfo) {
            res.status(404).json({ error: 'No prize information found for this tournament' });
        }
        res.json(prizeInfo);
    }
    catch (error) {
        console.error('Error fetching tournament prize info:', error);
        res.status(500).json({ error: 'Failed to fetch prize information' });
    }
});
exports.getTournamentPrize = getTournamentPrize;
/**
 * Get prize payment history for a tournament
 */
const getPrizePayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tournamentId } = req.params;
        // Validate tournament exists
        const tournament = yield db_1.default.tournament.findUnique({
            where: { id: tournamentId }
        });
        if (!tournament) {
            res.status(404).json({ error: 'Tournament not found' });
        }
        // Get prize for tournament
        const prize = yield db_1.default.tournamentPrize.findUnique({
            where: { tournamentId }
        });
        if (!prize) {
            res.status(404).json({ error: 'No prize information found for this tournament' });
        }
        // Get payments
        const payments = yield db_1.default.prizePayment.findMany({
            where: { tournamentPrizeId: prize === null || prize === void 0 ? void 0 : prize.id },
            orderBy: { createdAt: 'desc' },
            include: {
                team: {
                    select: { id: true, name: true }
                },
                participant: {
                    include: {
                        user: {
                            select: { id: true, username: true, avatar: true }
                        }
                    }
                }
            }
        });
        res.json(payments);
    }
    catch (error) {
        console.error('Error fetching prize payments:', error);
        res.status(500).json({ error: 'Failed to fetch prize payments' });
    }
});
exports.getPrizePayments = getPrizePayments;
/**
 * Verify a Solana payment transaction
 * This endpoint can be used by frontend to confirm if a transaction is valid
 */
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { transactionSignature, expectedAmount, tokenType, tokenAddress } = req.body;
        if (!transactionSignature) {
            res.status(400).json({ error: 'Transaction signature is required' });
        }
        if (!expectedAmount) {
            res.status(400).json({ error: 'Expected amount is required' });
        }
        const isValid = yield prizeService.verifyEntryFeePayment(transactionSignature, expectedAmount, tokenType || 'SOL', tokenAddress);
        res.json({ isValid });
    }
    catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});
exports.verifyPayment = verifyPayment;
