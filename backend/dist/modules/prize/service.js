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
exports.processMatchPayment = exports.verifyEntryFeePayment = exports.createTournamentPrize = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const db_1 = __importDefault(require("../../lib/db"));
const solana_1 = require("../../lib/solana");
/**
 * Create prize configuration for a tournament
 */
const createTournamentPrize = (tournamentId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate input
    if (data.prizePool && parseFloat(data.prizePool) <= 0) {
        throw new Error('Prize pool must be greater than zero');
    }
    // Calculate platform fee
    const platformFeePercent = data.platformFeePercent || 5.0;
    // Create prize record 
    return db_1.default.tournamentPrize.create({
        data: {
            tournamentId,
            entryFee: data.entryFee,
            prizePool: data.prizePool,
            tokenType: data.tokenType || 'SOL',
            tokenAddress: data.tokenAddress,
            distribution: data.distribution || { first: 60, second: 30, third: 10 },
            platformFeePercent
        }
    });
});
exports.createTournamentPrize = createTournamentPrize;
/**
 * Verify a Solana payment transaction
 */
const verifyEntryFeePayment = (signature_1, expectedAmount_1, ...args_1) => __awaiter(void 0, [signature_1, expectedAmount_1, ...args_1], void 0, function* (signature, expectedAmount, tokenType = 'SOL', tokenAddress) {
    var _a, _b;
    try {
        console.log(`Verifying transaction ${signature} for ${expectedAmount} ${tokenType}`);
        // Fetch transaction
        const tx = yield solana_1.connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
        });
        if (!tx || ((_a = tx.meta) === null || _a === void 0 ? void 0 : _a.err)) {
            console.error(`Transaction verification failed: ${((_b = tx === null || tx === void 0 ? void 0 : tx.meta) === null || _b === void 0 ? void 0 : _b.err) || 'Not found'}`);
            return false;
        }
        // Calculate expected amount in smallest units
        let expectedAmountInSmallestUnit;
        if (tokenType === 'SOL') {
            expectedAmountInSmallestUnit = BigInt(Math.floor(parseFloat(expectedAmount) * web3_js_1.LAMPORTS_PER_SOL));
        }
        else if (tokenAddress) {
            const tokenMint = new web3_js_1.PublicKey(tokenAddress);
            const mintInfo = yield solana_1.connection.getParsedAccountInfo(tokenMint);
            if (!mintInfo.value || !('parsed' in mintInfo.value.data)) {
                return false;
            }
            const decimals = mintInfo.value.data.parsed.info.decimals;
            expectedAmountInSmallestUnit = BigInt(Math.floor(parseFloat(expectedAmount) * Math.pow(10, decimals)));
        }
        else {
            return false;
        }
        // Verify recipient is the platform wallet
        const expectedRecipient = solana_1.PLATFORM_FEE_ADDRESS;
        if (!expectedRecipient) {
            console.error("Expected recipient address is undefined. Check your PLATFORM_FEE_ADDRESS or PLATFORM_WALLET_ADDRESS environment variables.");
            return false;
        }
        // Check all instructions in the transaction
        const instructions = tx.transaction.message.instructions;
        for (const inst of instructions) {
            if ('parsed' in inst) {
                // For SOL transfers
                if (tokenType === 'SOL' && inst.programId.toString() === web3_js_1.SystemProgram.programId.toString()) {
                    if (inst.parsed.type === 'transfer') {
                        const { destination, lamports } = inst.parsed.info;
                        if (destination === expectedRecipient.toString() &&
                            BigInt(lamports) >= expectedAmountInSmallestUnit) {
                            return true;
                        }
                    }
                }
                // For SPL token transfers
                else if (tokenType !== 'SOL' && inst.programId.toString() === spl_token_1.TOKEN_PROGRAM_ID.toString()) {
                    if (inst.parsed.type === 'transfer' || inst.parsed.type === 'transferChecked') {
                        const { destination, amount, mint } = inst.parsed.info;
                        // Verify destination belongs to expected recipient
                        try {
                            const tokenAccount = yield solana_1.connection.getParsedAccountInfo(new web3_js_1.PublicKey(destination));
                            if (!tokenAccount.value || !('parsed' in tokenAccount.value.data)) {
                                continue;
                            }
                            const owner = tokenAccount.value.data.parsed.info.owner;
                            const tokenMint = tokenAccount.value.data.parsed.info.mint;
                            if (owner === expectedRecipient.toString() &&
                                tokenMint === tokenAddress &&
                                BigInt(amount) >= expectedAmountInSmallestUnit) {
                                return true;
                            }
                        }
                        catch (e) {
                            console.error("Error checking token account:", e);
                            continue;
                        }
                    }
                }
            }
        }
        return false;
    }
    catch (error) {
        console.error("Payment verification error:", error);
        return false;
    }
});
exports.verifyEntryFeePayment = verifyEntryFeePayment;
/**
 * Process prize payment when a match is completed
 */
const processMatchPayment = (matchId, winnerId, winnerType) => __awaiter(void 0, void 0, void 0, function* () {
    // Get match with tournament and prize info
    const match = yield db_1.default.match.findUnique({
        where: { id: matchId },
        include: {
            tournament: {
                include: { prize: true }
            }
        }
    });
    if (!match || !match.tournament.prize) {
        console.log(`No prize info found for match ${matchId}`);
        return null;
    }
    // Determine if this match triggers a payout
    const payoutInfo = yield shouldTriggerPayout(match);
    if (!payoutInfo.shouldPay || !payoutInfo.position) {
        console.log(`Match ${matchId} doesn't trigger a payout`);
        return null;
    }
    // Get wallet address for the winner
    const walletAddress = yield getParticipantWalletAddress(winnerId, winnerType);
    if (!walletAddress) {
        console.error(`No wallet address found for ${winnerType} ${winnerId}`);
        return null;
    }
    // Calculate prize amount
    const prizeAmount = calculatePrizeAmount(match.tournament.prize, payoutInfo.position);
    if (prizeAmount <= 0) {
        console.log(`Prize amount calculated as ${prizeAmount}, skipping payment`);
        return null;
    }
    // Convert to smallest unit
    let amountInSmallestUnit;
    const tokenType = match.tournament.prize.tokenType || 'SOL';
    const tokenAddress = match.tournament.prize.tokenAddress;
    if (tokenType === 'SOL') {
        amountInSmallestUnit = BigInt(Math.floor(prizeAmount * web3_js_1.LAMPORTS_PER_SOL));
    }
    else if (tokenAddress) {
        // Fetch token decimals for SPL token
        const tokenMint = new web3_js_1.PublicKey(tokenAddress);
        const mintInfo = yield solana_1.connection.getParsedAccountInfo(tokenMint);
        if (!mintInfo.value || !('parsed' in mintInfo.value.data)) {
            throw new Error(`Failed to get info for token ${tokenAddress}`);
        }
        const decimals = mintInfo.value.data.parsed.info.decimals;
        amountInSmallestUnit = BigInt(Math.floor(prizeAmount * Math.pow(10, decimals)));
    }
    else {
        throw new Error("Invalid token configuration");
    }
    // Calculate platform fee (take from prize amount)
    const feePercentage = match.tournament.prize.platformFeePercent / 100;
    const feeAmount = BigInt(Number(amountInSmallestUnit) * feePercentage);
    const winnerAmount = amountInSmallestUnit - feeAmount;
    try {
        // Send the prize payment
        const txSignature = yield sendSolanaPrize(walletAddress, winnerAmount, tokenType, tokenAddress || undefined, feeAmount // Platform fee
        );
        // Record the payment in the database
        const payment = yield db_1.default.prizePayment.create({
            data: {
                tournamentPrizeId: match.tournament.prize.id,
                amount: prizeAmount.toString(),
                position: payoutInfo.position,
                recipientType: winnerType,
                [winnerType === 'team' ? 'teamId' : 'participantId']: winnerId,
                txSignature,
                txConfirmed: true
            }
        });
        console.log(`Prize payment processed: ${txSignature}`);
        return payment;
    }
    catch (error) {
        console.error(`Failed to process prize payment:`, error);
        return null;
    }
});
exports.processMatchPayment = processMatchPayment;
/**
 * Sends a prize payment via Solana
 */
function sendSolanaPrize(recipientAddress_1, amount_1, tokenType_1, tokenMintAddress_1) {
    return __awaiter(this, arguments, void 0, function* (recipientAddress, amount, tokenType, tokenMintAddress, platformFee = BigInt(0)) {
        const recipientPublicKey = new web3_js_1.PublicKey(recipientAddress);
        const transaction = new web3_js_1.Transaction();
        try {
            if (tokenType === 'SOL') {
                // Add instruction to send prize to winner
                transaction.add(web3_js_1.SystemProgram.transfer({
                    fromPubkey: solana_1.platformKeypair.publicKey,
                    toPubkey: recipientPublicKey,
                    lamports: amount
                }));
                // If there's a platform fee, keep it in the platform wallet
                // This is handled automatically for SOL since we're just sending less
            }
            else if (tokenMintAddress) {
                // SPL Token transfer
                const mintPublicKey = new web3_js_1.PublicKey(tokenMintAddress);
                // Get the platform's token account
                const fromTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(solana_1.connection, solana_1.platformKeypair, mintPublicKey, solana_1.platformKeypair.publicKey);
                // Get the recipient's token account
                const toTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(solana_1.connection, solana_1.platformKeypair, // Payer for account creation if needed
                mintPublicKey, recipientPublicKey);
                // Add instruction to transfer token
                transaction.add((0, spl_token_1.createTransferInstruction)(fromTokenAccount.address, toTokenAccount.address, solana_1.platformKeypair.publicKey, amount));
                // Platform fee is handled automatically (kept in source account)
            }
            else {
                throw new Error(`Unsupported token type or missing mint address`);
            }
            // Sign and send the transaction
            const signature = yield solana_1.connection.sendTransaction(transaction, [solana_1.platformKeypair]);
            yield solana_1.connection.confirmTransaction(signature, 'confirmed');
            return signature;
        }
        catch (error) {
            console.error('Payment failed:', error);
            throw new Error(`Payment failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
/**
 * Determines if a match completion should trigger a prize payout
 */
function shouldTriggerPayout(match) {
    return __awaiter(this, void 0, void 0, function* () {
        // If match already has a payout, don't duplicate
        const existingPayment = yield db_1.default.prizePayment.findFirst({
            where: {
                tournamentPrize: {
                    tournamentId: match.tournamentId
                },
                // Link to this match's result somehow (this depends on your data model)
                OR: [
                    // For final match (1st place)
                    {
                        position: 'first',
                        createdAt: {
                            gte: match.endTime ? new Date(new Date(match.endTime).getTime() - 10 * 60 * 1000) : undefined,
                        }
                    },
                    // For other matches that might pay out
                    {
                        createdAt: {
                            gte: match.endTime ? new Date(new Date(match.endTime).getTime() - 10 * 60 * 1000) : undefined,
                        }
                    }
                ]
            }
        });
        if (existingPayment) {
            console.log(`Match ${match.id} already has a payment recorded`);
            return { shouldPay: false };
        }
        // Get all tournament matches to figure out tournament structure
        const allMatches = yield db_1.default.match.findMany({
            where: { tournamentId: match.tournamentId },
            orderBy: { round: 'desc' }
        });
        // Find max round (finals)
        const maxRound = Math.max(...allMatches.map(m => m.round));
        // Case: Final match - 1st place payout
        if (match.round === maxRound && !match.nextMatchId) {
            return { shouldPay: true, position: 'first' };
        }
        // Case: Final match loser - 2nd place
        if (match.round === maxRound && !match.nextMatchId) {
            // We need to determine who lost
            const result = match.result;
            if (!result || !result.winnerId) {
                return { shouldPay: false };
            }
            // Find the loser
            let loserId;
            if (match.teamAId && match.teamBId) {
                loserId = result.winnerId === match.teamAId ? match.teamBId : match.teamAId;
            }
            else if (match.participantAId && match.participantBId) {
                loserId = result.winnerId === match.participantAId ? match.participantBId : match.participantAId;
            }
            else {
                return { shouldPay: false };
            }
            // Check if 2nd place payment already exists
            const secondPlacePayment = yield db_1.default.prizePayment.findFirst({
                where: {
                    tournamentPrize: { tournamentId: match.tournamentId },
                    position: 'second'
                }
            });
            if (!secondPlacePayment) {
                return { shouldPay: true, position: 'second' };
            }
        }
        // Case: Semifinal losers - 3rd place
        if (match.round === maxRound - 1) {
            const result = match.result;
            if (!result || !result.winnerId) {
                return { shouldPay: false };
            }
            // Find the loser of semifinals
            let loserId;
            if (match.teamAId && match.teamBId) {
                loserId = result.winnerId === match.teamAId ? match.teamBId : match.teamAId;
            }
            else if (match.participantAId && match.participantBId) {
                loserId = result.winnerId === match.participantAId ? match.participantBId : match.participantAId;
            }
            else {
                return { shouldPay: false };
            }
            // Check if this is the first semifinal loser
            const thirdPlacePayments = yield db_1.default.prizePayment.findMany({
                where: {
                    tournamentPrize: { tournamentId: match.tournamentId },
                    position: 'third'
                }
            });
            // Only one 3rd place payment in most tournaments
            if (thirdPlacePayments.length === 0) {
                return { shouldPay: true, position: 'third' };
            }
        }
        // No payout for this match
        return { shouldPay: false };
    });
}
/**
 * Gets the wallet address for a participant or team
 */
function getParticipantWalletAddress(id, type) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (type === 'team') {
            // For team, get captain's wallet
            const team = yield db_1.default.team.findUnique({
                where: { id },
                include: { captain: { include: { user: true } } }
            });
            return ((_b = (_a = team === null || team === void 0 ? void 0 : team.captain) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.walletAddress) || null;
        }
        else {
            // For individual participant, get user's wallet
            const participant = yield db_1.default.tournamentParticipant.findUnique({
                where: { id },
                include: { user: true }
            });
            return ((_c = participant === null || participant === void 0 ? void 0 : participant.user) === null || _c === void 0 ? void 0 : _c.walletAddress) || null;
        }
    });
}
/**
 * Calculate prize amount based on position
 */
function calculatePrizeAmount(prize, position) {
    const distribution = prize.distribution;
    if (!distribution || typeof distribution[position] !== 'number') {
        console.warn(`No distribution percentage found for position ${position}`);
        return 0;
    }
    const totalPrizePool = parseFloat(prize.prizePool || '0');
    const percentage = distribution[position];
    return (totalPrizePool * percentage) / 100;
}
