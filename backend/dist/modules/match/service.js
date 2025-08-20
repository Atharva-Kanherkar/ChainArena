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
exports.rescheduleMatch = exports.generateBracket = exports.assignJudge = exports.getUserMatches = exports.getTournamentMatches = exports.resolveDispute = exports.disputeMatchResult = exports.cancelMatch = exports.startMatch = exports.submitMatchResult = exports.updateMatch = exports.getMatchById = exports.getMatches = exports.createMatch = void 0;
const db_1 = __importDefault(require("../../lib/db"));
const client_1 = require("@prisma/client");
const brackets_1 = require("../../utils/brackets");
const prizeService = __importStar(require("../prize/service"));
const createMatch = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate tournament exists and is in the right state
    const tournament = yield db_1.default.tournament.findUnique({
        where: { id: data.tournamentId }
    });
    if (!tournament) {
        throw new Error('Tournament not found');
    }
    // Parse dates
    const scheduledTime = data.scheduledTime ? new Date(data.scheduledTime) : null;
    // Create match
    const match = yield db_1.default.match.create({
        data: {
            tournamentId: data.tournamentId,
            round: data.round,
            matchNumber: data.matchNumber,
            scheduledTime,
            teamAId: data.teamAId || null,
            teamBId: data.teamBId || null,
            participantAId: data.participantAId || null,
            participantBId: data.participantBId || null,
            bracketSection: data.bracketSection,
            judgeId: data.judgeId || null
        },
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
    return match;
});
exports.createMatch = createMatch;
const getMatches = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 20, tournamentId, status, round) {
    const skip = (page - 1) * limit;
    // Build where clause
    let whereClause = {};
    if (tournamentId) {
        whereClause.tournamentId = tournamentId;
    }
    if (status) {
        whereClause.status = status;
    }
    if (round !== undefined) {
        whereClause.round = round;
    }
    const [matches, totalCount] = yield Promise.all([
        db_1.default.match.findMany({
            where: whereClause,
            include: {
                teamA: true,
                teamB: true,
                participantA: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                },
                participantB: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                },
                judge: true,
                tournament: true
            },
            skip,
            take: limit,
            orderBy: [
                { round: 'asc' },
                { matchNumber: 'asc' }
            ]
        }),
        db_1.default.match.count({ where: whereClause })
    ]);
    return {
        items: matches,
        pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
        }
    };
});
exports.getMatches = getMatches;
const getMatchById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.default.match.findUnique({
        where: { id },
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
});
exports.getMatchById = getMatchById;
const updateMatch = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Parse dates
    const updateData = Object.assign(Object.assign({}, data), { scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : undefined, startTime: data.startTime ? new Date(data.startTime) : undefined, endTime: data.endTime ? new Date(data.endTime) : undefined });
    return db_1.default.match.update({
        where: { id },
        data: updateData,
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
});
exports.updateMatch = updateMatch;
const submitMatchResult = (id, userId, result) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    // Get the match
    const match = yield db_1.default.match.findUnique({
        where: { id },
        include: {
            tournament: {
                include: {
                    prize: true,
                }
            },
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: true
                }
            },
            participantB: {
                include: {
                    user: true
                }
            }
        }
    });
    if (!match) {
        throw new Error('Match not found');
    }
    // Verify the tournament is ongoing
    if (match.tournament.status !== client_1.TournamentStatus.ONGOING) {
        throw new Error('Tournament is not in progress');
    }
    // Verify match is ready for scoring
    if (match.status !== client_1.MatchStatus.PENDING && match.status !== client_1.MatchStatus.IN_PROGRESS) {
        throw new Error('Match cannot be scored in its current state');
    }
    // Verify the user has permission to submit result
    // This could be the tournament host, a judge, or a participant
    const isHost = match.tournament.hostId === userId;
    const isJudge = match.judgeId === userId;
    const isParticipant = ((((_a = match.participantA) === null || _a === void 0 ? void 0 : _a.userId) === userId) ||
        (((_b = match.participantB) === null || _b === void 0 ? void 0 : _b.userId) === userId) ||
        (((_c = match.teamA) === null || _c === void 0 ? void 0 : _c.captainId) && ((_d = match.participantA) === null || _d === void 0 ? void 0 : _d.id) === match.teamA.captainId && match.participantA.userId === userId) ||
        (((_e = match.teamB) === null || _e === void 0 ? void 0 : _e.captainId) && ((_f = match.participantB) === null || _f === void 0 ? void 0 : _f.id) === match.teamB.captainId && match.participantB.userId === userId));
    if (!isHost && !isJudge && !isParticipant) {
        throw new Error('You do not have permission to submit this match result');
    }
    // Validate the winner ID matches one of the participants
    const validWinnerIds = [
        match.participantAId,
        match.participantBId,
        match.teamAId,
        match.teamBId
    ].filter(Boolean);
    if (!validWinnerIds.includes(result.winnerId)) {
        throw new Error('Winner ID must match one of the participants');
    }
    // Update the match with the result
    const updatedMatch = yield db_1.default.match.update({
        where: { id },
        data: {
            status: client_1.MatchStatus.COMPLETED,
            result: result,
            endTime: new Date()
        },
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
    // If this match has a next match, update it with the winner
    if (updatedMatch.nextMatchId) {
        yield (0, brackets_1.advanceWinnerToNextMatch)(updatedMatch.id, result.winnerId);
    }
    try {
        // Check if tournament has prize info and match is completed
        if (match.tournament.prize && updatedMatch.status === client_1.MatchStatus.COMPLETED) {
            // Determine winner type (team or participant)
            const winnerType = updatedMatch.teamAId || updatedMatch.teamBId ? 'team' : 'participant';
            // Pass winner ID to prize service
            yield prizeService.processMatchPayment(id, result.winnerId, winnerType);
        }
    }
    catch (error) {
        console.error(`Error processing prize payment for match ${id}:`, error);
    }
    return updatedMatch;
});
exports.submitMatchResult = submitMatchResult;
const startMatch = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the match
    const match = yield db_1.default.match.findUnique({
        where: { id },
        include: {
            tournament: true
        }
    });
    if (!match) {
        throw new Error('Match not found');
    }
    // Verify the tournament is ongoing
    if (match.tournament.status !== client_1.TournamentStatus.ONGOING) {
        throw new Error('Tournament is not in progress');
    }
    // Verify match is in pending state
    if (match.status !== client_1.MatchStatus.PENDING) {
        throw new Error('Match can only be started from pending state');
    }
    // Verify user has permission (host, judge, or participant)
    const isHost = match.tournament.hostId === userId;
    const isJudge = match.judgeId === userId;
    if (!isHost && !isJudge) {
        throw new Error('You do not have permission to start this match');
    }
    // Start the match
    return db_1.default.match.update({
        where: { id },
        data: {
            status: client_1.MatchStatus.IN_PROGRESS,
            startTime: new Date()
        },
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
});
exports.startMatch = startMatch;
const cancelMatch = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the match
    const match = yield db_1.default.match.findUnique({
        where: { id },
        include: {
            tournament: true
        }
    });
    if (!match) {
        throw new Error('Match not found');
    }
    // Verify match status
    if (match.status === client_1.MatchStatus.COMPLETED || match.status === client_1.MatchStatus.CANCELLED) {
        throw new Error('Match cannot be cancelled in its current state');
    }
    // Verify user has permission (host or judge only)
    const isHost = match.tournament.hostId === userId;
    const isJudge = match.judgeId === userId;
    if (!isHost && !isJudge) {
        throw new Error('You do not have permission to cancel this match');
    }
    // Cancel the match
    return db_1.default.match.update({
        where: { id },
        data: {
            status: client_1.MatchStatus.CANCELLED
        },
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
});
exports.cancelMatch = cancelMatch;
const disputeMatchResult = (id, userId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // Get the match
    const match = yield db_1.default.match.findUnique({
        where: { id },
        include: {
            tournament: true,
            participantA: true,
            participantB: true,
            teamA: {
                include: {
                    members: true
                }
            },
            teamB: {
                include: {
                    members: true
                }
            }
        }
    });
    if (!match) {
        throw new Error('Match not found');
    }
    // Verify match status
    if (match.status !== client_1.MatchStatus.COMPLETED) {
        throw new Error('Only completed matches can be disputed');
    }
    // Verify user is a participant in the match
    const isParticipant = ((((_a = match.participantA) === null || _a === void 0 ? void 0 : _a.userId) === userId) ||
        (((_b = match.participantB) === null || _b === void 0 ? void 0 : _b.userId) === userId) ||
        ((_c = match.teamA) === null || _c === void 0 ? void 0 : _c.members.some(m => m.userId === userId)) ||
        ((_d = match.teamB) === null || _d === void 0 ? void 0 : _d.members.some(m => m.userId === userId)));
    if (!isParticipant) {
        throw new Error('Only participants can dispute match results');
    }
    // Update the match status and add dispute reason to the result
    const currentResult = match.result || {};
    const updatedResult = Object.assign(Object.assign({}, currentResult), { disputed: true, disputeReason: reason, disputedBy: userId, disputeTime: new Date() });
    return db_1.default.match.update({
        where: { id },
        data: {
            status: client_1.MatchStatus.DISPUTED,
            result: updatedResult
        },
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
});
exports.disputeMatchResult = disputeMatchResult;
const resolveDispute = (id, userId, result) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the match
    const match = yield db_1.default.match.findUnique({
        where: { id },
        include: {
            tournament: {
                include: { prize: true }
            }
        }
    });
    if (!match) {
        throw new Error('Match not found');
    }
    // Verify match is in disputed state
    if (match.status !== client_1.MatchStatus.DISPUTED) {
        throw new Error('Only disputed matches can be resolved');
    }
    // Verify user has permission (only host or judge can resolve disputes)
    const isHost = match.tournament.hostId === userId;
    const isJudge = match.judgeId === userId;
    if (!isHost && !isJudge) {
        throw new Error('Only the tournament host or match judge can resolve disputes');
    }
    // Update with the resolved result
    const currentResult = match.result || {};
    const resolvedResult = Object.assign(Object.assign({}, result), { disputeResolved: true, originalResult: currentResult, resolvedBy: userId, resolvedAt: new Date() });
    return db_1.default.match.update({
        where: { id },
        data: {
            status: client_1.MatchStatus.COMPLETED,
            result: resolvedResult
        },
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
});
exports.resolveDispute = resolveDispute;
const getTournamentMatches = (tournamentId_1, ...args_1) => __awaiter(void 0, [tournamentId_1, ...args_1], void 0, function* (tournamentId, page = 1, limit = 50, round) {
    const skip = (page - 1) * limit;
    // Build where clause
    let whereClause = {
        tournamentId
    };
    if (round !== undefined) {
        whereClause.round = round;
    }
    const [matches, totalCount] = yield Promise.all([
        db_1.default.match.findMany({
            where: whereClause,
            include: {
                teamA: true,
                teamB: true,
                participantA: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                },
                participantB: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                },
                judge: true,
                tournament: true
            },
            skip,
            take: limit,
            orderBy: [
                { round: 'asc' },
                { matchNumber: 'asc' }
            ]
        }),
        db_1.default.match.count({ where: whereClause })
    ]);
    return {
        items: matches,
        pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
        }
    };
});
exports.getTournamentMatches = getTournamentMatches;
const getUserMatches = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, limit = 20, status) {
    const skip = (page - 1) * limit;
    // Build where clause to find matches where user is a participant
    let whereClause = {
        OR: [
            {
                participantA: {
                    userId
                }
            },
            {
                participantB: {
                    userId
                }
            },
            {
                teamA: {
                    members: {
                        some: {
                            userId
                        }
                    }
                }
            },
            {
                teamB: {
                    members: {
                        some: {
                            userId
                        }
                    }
                }
            }
        ]
    };
    if (status) {
        whereClause.status = status;
    }
    const [matches, totalCount] = yield Promise.all([
        db_1.default.match.findMany({
            where: whereClause,
            include: {
                teamA: true,
                teamB: true,
                participantA: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                },
                participantB: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                },
                judge: true,
                tournament: true
            },
            skip,
            take: limit,
            orderBy: { scheduledTime: 'asc' }
        }),
        db_1.default.match.count({ where: whereClause })
    ]);
    return {
        items: matches,
        pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
        }
    };
});
exports.getUserMatches = getUserMatches;
const assignJudge = (matchId, judgeId, requesterId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the match
    const match = yield db_1.default.match.findUnique({
        where: { id: matchId },
        include: {
            tournament: true
        }
    });
    if (!match) {
        throw new Error('Match not found');
    }
    // Verify requester is tournament host
    if (match.tournament.hostId !== requesterId) {
        throw new Error('Only the tournament host can assign judges');
    }
    // Assign the judge
    return db_1.default.match.update({
        where: { id: matchId },
        data: {
            judgeId
        },
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
});
exports.assignJudge = assignJudge;
const generateBracket = (tournamentId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify tournament exists
    const tournament = yield db_1.default.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            participants: true
        }
    });
    if (!tournament) {
        throw new Error('Tournament not found');
    }
    // Verify user is tournament host
    if (tournament.hostId !== userId) {
        throw new Error('Only the tournament host can generate brackets');
    }
    // Verify tournament is in the right state
    if (tournament.status !== client_1.TournamentStatus.REGISTRATION_CLOSED) {
        throw new Error('Tournament must have registration closed before generating brackets');
    }
    // Check if there are enough participants
    if (tournament.minParticipants && tournament.participants.length < tournament.minParticipants) {
        throw new Error(`Not enough participants. Minimum required: ${tournament.minParticipants}`);
    }
    // Delete any existing matches for this tournament
    yield db_1.default.match.deleteMany({
        where: { tournamentId }
    });
    // Generate the bracket based on tournament format
    const matches = yield (0, brackets_1.generateInitialBracket)(tournamentId);
    // Move tournament to ONGOING status
    yield db_1.default.tournament.update({
        where: { id: tournamentId },
        data: { status: client_1.TournamentStatus.ONGOING }
    });
    return matches;
});
exports.generateBracket = generateBracket;
const rescheduleMatch = (id, scheduledTime, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the match
    const match = yield db_1.default.match.findUnique({
        where: { id },
        include: {
            tournament: true
        }
    });
    if (!match) {
        throw new Error('Match not found');
    }
    // Verify user has permission (host or judge)
    const isHost = match.tournament.hostId === userId;
    const isJudge = match.judgeId === userId;
    if (!isHost && !isJudge) {
        throw new Error('Only the tournament host or match judge can reschedule matches');
    }
    // Verify match status allows rescheduling
    if (match.status !== client_1.MatchStatus.PENDING && match.status !== client_1.MatchStatus.CANCELLED) {
        throw new Error('Only pending or cancelled matches can be rescheduled');
    }
    // Parse the scheduled time
    const newScheduledTime = new Date(scheduledTime);
    // Reschedule the match
    return db_1.default.match.update({
        where: { id },
        data: {
            scheduledTime: newScheduledTime,
            status: client_1.MatchStatus.PENDING
        },
        include: {
            teamA: true,
            teamB: true,
            participantA: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            participantB: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            },
            judge: true,
            tournament: true
        }
    });
});
exports.rescheduleMatch = rescheduleMatch;
