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
exports.generateInitialBracket = generateInitialBracket;
exports.advanceWinnerToNextMatch = advanceWinnerToNextMatch;
exports.generateNextSwissRound = generateNextSwissRound;
const db_1 = __importDefault(require("../lib/db"));
const client_1 = require("@prisma/client");
/**
 * Generate an initial bracket for a tournament
 * @param tournamentId The ID of the tournament to generate a bracket for
 * @returns Array of created Match objects
 */
function generateInitialBracket(tournamentId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Fetch tournament details with participants and teams
        const tournament = yield db_1.default.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                participants: true,
                teams: {
                    include: {
                        members: true
                    }
                }
            }
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        // Based on tournament format, call the appropriate bracket generator
        switch ((_a = tournament.format) === null || _a === void 0 ? void 0 : _a.toUpperCase()) {
            case 'SINGLE_ELIMINATION':
                return generateSingleEliminationBracket(tournament);
            case 'DOUBLE_ELIMINATION':
                return generateDoubleEliminationBracket(tournament);
            case 'ROUND_ROBIN':
                return generateRoundRobinBracket(tournament);
            case 'SWISS':
                return generateSwissBracket(tournament);
            default:
                // Default to single elimination
                return generateSingleEliminationBracket(tournament);
        }
    });
}
/**
 * Generate a single elimination bracket
 */
function generateSingleEliminationBracket(tournament) {
    return __awaiter(this, void 0, void 0, function* () {
        let participants = [];
        // Handle team-based or individual tournaments
        if (tournament.isTeamBased) {
            // For team tournaments, use teams as participants
            participants = tournament.teams.map(team => ({
                id: team.id,
                type: 'team'
            }));
        }
        else {
            // For individual tournaments, use individual participants
            participants = tournament.participants.map(participant => ({
                id: participant.id,
                type: 'participant'
            }));
        }
        // Shuffle participants for random seeding
        participants = shuffleArray(participants);
        // Calculate bracket size (next power of 2)
        const bracketSize = getNextPowerOfTwo(participants.length);
        // Calculate the number of rounds needed
        const rounds = Math.log2(bracketSize);
        // Fill bracket with byes as needed
        const byesCount = bracketSize - participants.length;
        for (let i = 0; i < byesCount; i++) {
            participants.push({ id: 'bye', type: 'participant' });
        }
        // Create matches for each round
        const matches = [];
        let matchIndex = 1;
        // First round pairings with byes
        const firstRoundMatches = [];
        for (let i = 0; i < participants.length; i += 2) {
            const participant1 = participants[i];
            const participant2 = participants[i + 1];
            // If one is a bye, the other advances automatically
            if (participant1.id === 'bye' || participant2.id === 'bye') {
                // Skip creating match, this will be handled in the next round's seeding
                continue;
            }
            const match = yield db_1.default.match.create({
                data: Object.assign(Object.assign({ tournamentId: tournament.id, round: 1, matchNumber: matchIndex++, status: client_1.MatchStatus.PENDING, bracketSection: 'MAIN', scheduledTime: calculateMatchTime(tournament, 1, firstRoundMatches.length + 1) }, (participant1.type === 'team'
                    ? { teamAId: participant1.id }
                    : { participantAId: participant1.id })), (participant2.type === 'team'
                    ? { teamBId: participant2.id }
                    : { participantBId: participant2.id })),
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
            firstRoundMatches.push(match);
        }
        // Create subsequent round matches (empty initially)
        let previousRoundMatches = firstRoundMatches;
        for (let round = 2; round <= rounds; round++) {
            const roundMatches = [];
            const matchesInRound = Math.pow(2, rounds - round);
            for (let i = 0; i < matchesInRound; i++) {
                const match = yield db_1.default.match.create({
                    data: {
                        tournamentId: tournament.id,
                        round: round,
                        matchNumber: i + 1,
                        status: client_1.MatchStatus.PENDING,
                        bracketSection: 'MAIN',
                        scheduledTime: calculateMatchTime(tournament, round, i + 1)
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
                roundMatches.push(match);
            }
            // Link previous round matches to this round
            for (let i = 0; i < previousRoundMatches.length; i += 2) {
                const match1 = previousRoundMatches[i];
                const match2 = i + 1 < previousRoundMatches.length ? previousRoundMatches[i + 1] : null;
                const nextMatchIndex = Math.floor(i / 2);
                const nextMatch = roundMatches[nextMatchIndex];
                // Update match1 and match2 with nextMatchId
                if (match1) {
                    yield db_1.default.match.update({
                        where: { id: match1.id },
                        data: { nextMatchId: nextMatch.id }
                    });
                }
                if (match2) {
                    yield db_1.default.match.update({
                        where: { id: match2.id },
                        data: { nextMatchId: nextMatch.id }
                    });
                }
            }
            previousRoundMatches = roundMatches;
        }
        // Return all created matches
        return db_1.default.match.findMany({
            where: { tournamentId: tournament.id },
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
            orderBy: [
                { round: 'asc' },
                { matchNumber: 'asc' }
            ]
        });
    });
}
/**
 * Generate a double elimination bracket
 * This creates both a winners and losers bracket
 */
function generateDoubleEliminationBracket(tournament) {
    return __awaiter(this, void 0, void 0, function* () {
        let participants = [];
        // Handle team-based or individual tournaments
        if (tournament.isTeamBased) {
            // For team tournaments, use teams as participants
            participants = tournament.teams.map(team => ({
                id: team.id,
                type: 'team'
            }));
        }
        else {
            // For individual tournaments, use individual participants
            participants = tournament.participants.map(participant => ({
                id: participant.id,
                type: 'participant'
            }));
        }
        // Shuffle participants for random seeding
        participants = shuffleArray(participants);
        // Calculate bracket size (next power of 2)
        const bracketSize = getNextPowerOfTwo(participants.length);
        // Generate winners bracket (similar to single elimination)
        const winnersBracketMatches = yield generateBracketSection(tournament, participants, bracketSize, 'WINNERS');
        // Generate losers bracket
        const losersBracketMatches = yield generateLosersBracket(tournament, bracketSize, 'LOSERS');
        // Create finals match (winners bracket champion vs losers bracket champion)
        const finalsMatch = yield db_1.default.match.create({
            data: {
                tournamentId: tournament.id,
                round: Math.log2(bracketSize) + 1, // Final round
                matchNumber: 1,
                status: client_1.MatchStatus.PENDING,
                bracketSection: 'FINALS',
                scheduledTime: calculateMatchTime(tournament, Math.log2(bracketSize) + 1, 1)
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
        // Link winners and losers brackets to finals
        const winnersFinal = winnersBracketMatches.find(m => m.round === Math.log2(bracketSize) && m.bracketSection === 'WINNERS');
        const losersFinal = losersBracketMatches.find(m => m.round === Math.log2(bracketSize) * 2 - 1 && m.bracketSection === 'LOSERS');
        if (winnersFinal) {
            yield db_1.default.match.update({
                where: { id: winnersFinal.id },
                data: { nextMatchId: finalsMatch.id }
            });
        }
        if (losersFinal) {
            yield db_1.default.match.update({
                where: { id: losersFinal.id },
                data: { nextMatchId: finalsMatch.id }
            });
        }
        // Return all created matches
        return db_1.default.match.findMany({
            where: { tournamentId: tournament.id },
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
            orderBy: [
                { round: 'asc' },
                { matchNumber: 'asc' }
            ]
        });
    });
}
/**
 * Generate a round-robin bracket where each participant plays against all others
 */
function generateRoundRobinBracket(tournament) {
    return __awaiter(this, void 0, void 0, function* () {
        let participants = [];
        // Handle team-based or individual tournaments
        if (tournament.isTeamBased) {
            // For team tournaments, use teams as participants
            participants = tournament.teams.map(team => ({
                id: team.id,
                type: 'team'
            }));
        }
        else {
            // For individual tournaments, use individual participants
            participants = tournament.participants.map(participant => ({
                id: participant.id,
                type: 'participant'
            }));
        }
        // If odd number of participants, add a "bye" participant
        if (participants.length % 2 !== 0) {
            participants.push({ id: 'bye', type: 'participant' });
        }
        const n = participants.length;
        // Number of rounds is n-1 for even number of participants
        const rounds = n - 1;
        // Number of matches per round is n/2
        const matchesPerRound = n / 2;
        let matchIndex = 1;
        let createdMatches = [];
        // Algorithm for round-robin tournament (circle method)
        // Fix one participant and rotate the rest
        const fixed = participants[0];
        const rotating = participants.slice(1);
        for (let round = 1; round <= rounds; round++) {
            for (let match = 0; match < matchesPerRound; match++) {
                let participant1, participant2;
                if (match === 0) {
                    // First match of the round pairs the fixed participant with the first rotating
                    participant1 = fixed;
                    participant2 = rotating[0];
                }
                else {
                    // Other matches pair participants from the rotating array
                    participant1 = rotating[match];
                    participant2 = rotating[rounds - match];
                }
                // Skip if either participant is a bye
                if (participant1.id === 'bye' || participant2.id === 'bye') {
                    continue;
                }
                const matchData = yield db_1.default.match.create({
                    data: Object.assign(Object.assign({ tournamentId: tournament.id, round, matchNumber: matchIndex++, status: client_1.MatchStatus.PENDING, bracketSection: 'ROUND_ROBIN', scheduledTime: calculateMatchTime(tournament, round, match + 1) }, (participant1.type === 'team'
                        ? { teamAId: participant1.id }
                        : { participantAId: participant1.id })), (participant2.type === 'team'
                        ? { teamBId: participant2.id }
                        : { participantBId: participant2.id })),
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
                createdMatches.push(matchData);
            }
            // Rotate the participants (excluding the fixed one)
            rotating.push(rotating.shift()); // Move first element to the end
        }
        return createdMatches;
    });
}
/**
 * Generate a Swiss-system bracket
 */
function generateSwissBracket(tournament) {
    return __awaiter(this, void 0, void 0, function* () {
        let participants = [];
        // Handle team-based or individual tournaments
        if (tournament.isTeamBased) {
            // For team tournaments, use teams as participants
            participants = tournament.teams.map(team => ({
                id: team.id,
                type: 'team'
            }));
        }
        else {
            // For individual tournaments, use individual participants
            participants = tournament.participants.map(participant => ({
                id: participant.id,
                type: 'participant'
            }));
        }
        // Shuffle participants for initial random seeding
        participants = shuffleArray(participants);
        // In Swiss, we typically generate only the first round and subsequent rounds
        // are generated after each round completes based on standings
        // For now, just create the first round
        const matchesPerRound = Math.floor(participants.length / 2);
        let createdMatches = [];
        for (let i = 0; i < matchesPerRound; i++) {
            const participant1 = participants[i * 2];
            const participant2 = participants[i * 2 + 1];
            const matchData = yield db_1.default.match.create({
                data: Object.assign(Object.assign({ tournamentId: tournament.id, round: 1, matchNumber: i + 1, status: client_1.MatchStatus.PENDING, bracketSection: 'SWISS', scheduledTime: calculateMatchTime(tournament, 1, i + 1) }, (participant1.type === 'team'
                    ? { teamAId: participant1.id }
                    : { participantAId: participant1.id })), (participant2.type === 'team'
                    ? { teamBId: participant2.id }
                    : { participantBId: participant2.id })),
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
            createdMatches.push(matchData);
        }
        return createdMatches;
    });
}
/**
 * Generate the losers bracket for double elimination tournaments
 */
function generateLosersBracket(tournament, bracketSize, bracketSection) {
    return __awaiter(this, void 0, void 0, function* () {
        const totalRounds = Math.log2(bracketSize) * 2 - 1; // Double the rounds minus 1
        let createdMatches = [];
        // Create empty matches for the losers bracket
        for (let round = 1; round <= totalRounds; round++) {
            // Calculate matches in this round (varies based on round number)
            const matchesInRound = calculateLosersMatchCount(round, bracketSize);
            for (let match = 1; match <= matchesInRound; match++) {
                const matchData = yield db_1.default.match.create({
                    data: {
                        tournamentId: tournament.id,
                        round,
                        matchNumber: match,
                        status: client_1.MatchStatus.PENDING,
                        bracketSection,
                        scheduledTime: calculateMatchTime(tournament, round, match, bracketSection)
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
                createdMatches.push(matchData);
            }
        }
        // Link the matches properly
        // This is complex for losers bracket and requires specific wiring based on round
        return createdMatches;
    });
}
/**
 * Generate matches for a bracket section (winners/losers)
 */
function generateBracketSection(tournament, participants, bracketSize, bracketSection) {
    return __awaiter(this, void 0, void 0, function* () {
        const rounds = Math.log2(bracketSize);
        let matchIndex = 1;
        let allMatches = [];
        // First round pairings
        const firstRoundMatches = [];
        for (let i = 0; i < participants.length; i += 2) {
            const participant1 = participants[i];
            const participant2 = i + 1 < participants.length ? participants[i + 1] : { id: 'bye', type: 'participant' };
            // If one is a bye, the other advances automatically
            if (participant1.id === 'bye' || participant2.id === 'bye') {
                // Skip creating match, this will be handled in the next round's seeding
                continue;
            }
            const match = yield db_1.default.match.create({
                data: Object.assign(Object.assign({ tournamentId: tournament.id, round: 1, matchNumber: matchIndex++, status: client_1.MatchStatus.PENDING, bracketSection, scheduledTime: calculateMatchTime(tournament, 1, firstRoundMatches.length + 1, bracketSection) }, (participant1.type === 'team'
                    ? { teamAId: participant1.id }
                    : { participantAId: participant1.id })), (participant2.type === 'team'
                    ? { teamBId: participant2.id }
                    : { participantBId: participant2.id })),
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
            firstRoundMatches.push(match);
            allMatches.push(match);
        }
        // Create subsequent round matches (empty initially)
        let previousRoundMatches = firstRoundMatches;
        for (let round = 2; round <= rounds; round++) {
            const roundMatches = [];
            const matchesInRound = Math.pow(2, rounds - round);
            for (let i = 0; i < matchesInRound; i++) {
                const match = yield db_1.default.match.create({
                    data: {
                        tournamentId: tournament.id,
                        round,
                        matchNumber: i + 1,
                        status: client_1.MatchStatus.PENDING,
                        bracketSection,
                        scheduledTime: calculateMatchTime(tournament, round, i + 1, bracketSection)
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
                roundMatches.push(match);
                allMatches.push(match);
            }
            // Link previous round matches to this round
            for (let i = 0; i < previousRoundMatches.length; i += 2) {
                const match1 = previousRoundMatches[i];
                const match2 = i + 1 < previousRoundMatches.length ? previousRoundMatches[i + 1] : null;
                const nextMatchIndex = Math.floor(i / 2);
                const nextMatch = roundMatches[nextMatchIndex];
                // Update match1 and match2 with nextMatchId
                if (match1) {
                    yield db_1.default.match.update({
                        where: { id: match1.id },
                        data: { nextMatchId: nextMatch.id }
                    });
                }
                if (match2) {
                    yield db_1.default.match.update({
                        where: { id: match2.id },
                        data: { nextMatchId: nextMatch.id }
                    });
                }
            }
            previousRoundMatches = roundMatches;
        }
        return allMatches;
    });
}
/**
 * Advance a winner to the next match in the bracket
 * @param matchId The ID of the completed match
 * @param winnerId The ID of the winning participant/team
 */
function advanceWinnerToNextMatch(matchId, winnerId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get the current match
        const match = yield db_1.default.match.findUnique({
            where: { id: matchId },
            include: {
                teamA: true,
                teamB: true,
                participantA: true,
                participantB: true
            }
        });
        if (!match || !match.nextMatchId) {
            // This is a final match or there's no next match
            return;
        }
        // Get the next match
        const nextMatch = yield db_1.default.match.findUnique({
            where: { id: match.nextMatchId }
        });
        if (!nextMatch) {
            throw new Error('Next match not found');
        }
        // Determine if this winner should go to position A or B in the next match
        // This depends on the match number and bracket structure
        // For simple single elimination, even numbers go to A, odd to B
        let positionA = match.matchNumber % 2 === 0;
        if (match.bracketSection === 'LOSERS') {
            // In losers bracket, the logic can be different
            // This is a simplified approach and may need adjusting based on your exact bracket structure
            positionA = match.round % 2 === 0;
        }
        // Check if winner is a team or individual participant
        const isTeam = match.teamAId === winnerId || match.teamBId === winnerId;
        // Update the next match with the winner in the correct position
        if (isTeam) {
            yield db_1.default.match.update({
                where: { id: nextMatch.id },
                data: positionA
                    ? { teamAId: winnerId }
                    : { teamBId: winnerId }
            });
        }
        else {
            yield db_1.default.match.update({
                where: { id: nextMatch.id },
                data: positionA
                    ? { participantAId: winnerId }
                    : { participantBId: winnerId }
            });
        }
        // For double elimination tournaments, handle losers moving to the losers bracket
        if (match.bracketSection === 'WINNERS' && match.round < Math.log2(getNextPowerOfTwo(match.round))) {
            const losingTeamId = match.teamAId === winnerId ? match.teamBId : match.teamAId;
            const losingParticipantId = match.participantAId === winnerId ? match.participantBId : match.participantAId;
            // Find the corresponding losers bracket match
            const losersBracketMatch = yield findLosersMatch(match.tournamentId, match.round, match.matchNumber);
            if (losersBracketMatch) {
                // Update the losers bracket match with the loser in the correct position
                if (losingTeamId) {
                    yield db_1.default.match.update({
                        where: { id: losersBracketMatch.id },
                        data: { teamAId: losingTeamId }
                    });
                }
                else if (losingParticipantId) {
                    yield db_1.default.match.update({
                        where: { id: losersBracketMatch.id },
                        data: { participantAId: losingParticipantId }
                    });
                }
            }
        }
    });
}
/**
 * Find the appropriate losers bracket match for a winner's bracket loser
 */
function findLosersMatch(tournamentId, winnersBracketRound, matchNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        // This mapping depends on your specific bracket structure
        // Here's a simplified approach - in reality this can be quite complex
        const loserRound = winnersBracketRound * 2 - 1;
        const loserMatchNumber = Math.ceil(matchNumber / 2);
        return db_1.default.match.findFirst({
            where: {
                tournamentId,
                round: loserRound,
                matchNumber: loserMatchNumber,
                bracketSection: 'LOSERS'
            }
        });
    });
}
/**
 * Calculate the scheduled time for a match
 * @param tournament The tournament
 * @param round The round number
 * @param matchNumber The match number within the round
 * @param bracketSection Optional bracket section (winners/losers)
 */
function calculateMatchTime(tournament, round, matchNumber, bracketSection = 'MAIN') {
    // If tournament doesn't have a start date, return null
    if (!tournament.startDate) {
        return null;
    }
    // Calculate time based on tournament configuration
    // Default: 1 hour per match, with rounds starting on consecutive days
    const startDate = new Date(tournament.startDate);
    // Add days for the round (round 1 on day 1, round 2 on day 2, etc.)
    // For losers bracket, offset by half a day
    const dayOffset = round - 1;
    const hourOffset = bracketSection === 'LOSERS' ? 12 : 0;
    // Add hours for the match within the round (1 hour per match)
    const minutesPerMatch = 60;
    const matchOffset = (matchNumber - 1) * minutesPerMatch;
    const matchTime = new Date(startDate);
    matchTime.setDate(matchTime.getDate() + dayOffset);
    matchTime.setHours(matchTime.getHours() + hourOffset);
    matchTime.setMinutes(matchTime.getMinutes() + matchOffset);
    return matchTime;
}
/**
 * Calculate the number of matches in a specific round of the losers bracket
 */
function calculateLosersMatchCount(round, bracketSize) {
    const winnersRounds = Math.log2(bracketSize);
    if (round <= winnersRounds) {
        // First half of losers bracket
        return Math.pow(2, Math.floor((round - 1) / 2));
    }
    else {
        // Second half of losers bracket
        return Math.pow(2, Math.floor((2 * winnersRounds - round - 1) / 2));
    }
}
/**
 * Find the next power of 2 that is greater than or equal to n
 */
function getNextPowerOfTwo(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}
/**
 * Shuffle an array using the Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
/**
 * Generate next rounds for Swiss tournament after a round completes
 * Should be called after all matches in a round are completed
 */
function generateNextSwissRound(tournamentId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get the tournament
        const tournament = yield db_1.default.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                participants: true,
                teams: {
                    include: {
                        members: true
                    }
                }
            }
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        // Get all completed matches
        const completedMatches = yield db_1.default.match.findMany({
            where: {
                tournamentId,
                status: client_1.MatchStatus.COMPLETED
            },
            include: {
                teamA: true,
                teamB: true,
                participantA: true,
                participantB: true
            }
        });
        // Get current standings
        const standings = calculateStandings(tournament, completedMatches);
        // Determine the current round (completed rounds + 1)
        const currentRound = Math.max(...completedMatches.map(m => m.round), 0) + 1;
        // Pair participants based on standings (Swiss pairing algorithm)
        const pairs = pairParticipants(standings);
        // Create matches for the new round
        const newMatches = [];
        for (let i = 0; i < pairs.length; i++) {
            const [participant1, participant2] = pairs[i];
            const match = yield db_1.default.match.create({
                data: Object.assign(Object.assign({ tournamentId, round: currentRound, matchNumber: i + 1, status: client_1.MatchStatus.PENDING, bracketSection: 'SWISS', scheduledTime: calculateMatchTime(tournament, currentRound, i + 1) }, (participant1.type === 'team'
                    ? { teamAId: participant1.id }
                    : { participantAId: participant1.id })), (participant2.type === 'team'
                    ? { teamBId: participant2.id }
                    : { participantBId: participant2.id })),
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
            newMatches.push(match);
        }
        return newMatches;
    });
}
/**
 * Calculate current standings based on completed matches
 */
function calculateStandings(tournament, completedMatches) {
    const standings = {};
    // Initialize standings for all participants
    if (tournament.isTeamBased) {
        tournament.teams.forEach(team => {
            standings[team.id] = { id: team.id, type: 'team', wins: 0, losses: 0 };
        });
    }
    else {
        tournament.participants.forEach(participant => {
            standings[participant.id] = { id: participant.id, type: 'participant', wins: 0, losses: 0 };
        });
    }
    // Update standings based on completed matches
    completedMatches.forEach(match => {
        if (!match.result)
            return;
        const result = match.result;
        const winnerId = result.winnerId;
        // Determine the participants in the match
        let participantIds = [];
        if (match.teamAId)
            participantIds.push(match.teamAId);
        if (match.teamBId)
            participantIds.push(match.teamBId);
        if (match.participantAId)
            participantIds.push(match.participantAId);
        if (match.participantBId)
            participantIds.push(match.participantBId);
        // Update wins/losses
        participantIds.forEach(id => {
            if (standings[id]) {
                if (id === winnerId) {
                    standings[id].wins += 1;
                }
                else {
                    standings[id].losses += 1;
                }
            }
        });
    });
    // Convert to array and sort by wins (descending)
    return Object.values(standings).sort((a, b) => b.wins - a.wins);
}
/**
 * Pair participants for Swiss tournament based on standings
 */
function pairParticipants(standings) {
    // Group participants by number of wins
    const groupedByWins = {};
    standings.forEach(participant => {
        const wins = participant.wins;
        if (!groupedByWins[wins]) {
            groupedByWins[wins] = [];
        }
        groupedByWins[wins].push(participant);
    });
    // Sort win groups by descending wins
    const winGroups = Object.keys(groupedByWins)
        .map(Number)
        .sort((a, b) => b - a);
    const pairs = [];
    // Process each win group
    winGroups.forEach(wins => {
        const group = groupedByWins[wins];
        // If odd number, try to pair with someone from the next group
        if (group.length % 2 !== 0) {
            const nextGroup = winGroups.find(w => w < wins && groupedByWins[w].length > 0);
            if (nextGroup !== undefined) {
                // Move one participant up from the next group
                const promoted = groupedByWins[nextGroup].shift();
                group.push(promoted);
            }
        }
        // Shuffle the group to create random pairings within same win count
        const shuffled = shuffleArray(group);
        // Create pairs
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                pairs.push([shuffled[i], shuffled[i + 1]]);
            }
            else {
                // Handle bye for odd number of participants
                // In a real tournament, this participant would get a bye
                // and potentially get a free win
            }
        }
    });
    return pairs;
}
