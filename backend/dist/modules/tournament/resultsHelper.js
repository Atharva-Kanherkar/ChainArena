"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStandings = calculateStandings;
const client_1 = require("@prisma/client");
const POINTS_WIN = 3;
// const POINTS_DRAW = 1; // Add if draws are implemented
/**
 * Calculates standings based on completed matches using a points system (3 for win).
 * Adapted from the logic previously in tournament/service.ts.
 */
function calculateStandings(tournament) {
    console.log(`Calculating standings (Points Based) for tournament: ${tournament.name} (${tournament.id})`);
    // Create record of participant/team stats
    const statsMap = new Map();
    // Helper to initialize or get stats
    const getStats = (id, name, isTeam, avatar) => {
        if (!statsMap.has(id)) {
            statsMap.set(id, {
                id,
                name,
                isTeam,
                avatar: avatar || null,
                wins: 0,
                losses: 0,
                score: 0
            });
        }
        return statsMap.get(id);
    };
    // Initialize from participants/teams list to include those with 0 matches played
    if (tournament.isTeamBased) {
        tournament.teams.forEach(team => {
            const name = team.name || `Team ${team.id.substring(0, 6)}`;
            getStats(team.id, name, true, team.logo);
        });
    }
    else {
        tournament.participants.forEach(p => {
            const name = p.user.username || p.user.email;
            getStats(p.id, name, false, p.user.avatar);
        });
    }
    // Process each completed match
    tournament.matches.forEach(match => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        if (match.status !== client_1.MatchStatus.COMPLETED || !match.result)
            return;
        const result = match.result; // Cast to access winnerId
        const winnerId = result.winnerId;
        // const isDraw = result.isDraw === true; // Uncomment if draws are handled
        // --- Simplified Logic: Only process if there's a winner ---
        if (!winnerId) {
            // Handle draws here if needed - award points, increment draw count
            // console.log(`Match ${match.id} is a draw or has no winner.`);
            return;
        }
        let loserId = null;
        let winnerEntity = null;
        let loserEntity = null;
        // Identify winner and loser entities (Team or Participant)
        if (tournament.isTeamBased) {
            if (match.teamAId) {
                const teamA = getStats(match.teamAId, ((_a = match.teamA) === null || _a === void 0 ? void 0 : _a.name) || `Team ${match.teamAId.substring(0, 6)}`, true, (_b = match.teamA) === null || _b === void 0 ? void 0 : _b.logo);
                if (match.teamAId === winnerId)
                    winnerEntity = teamA;
                else
                    loserEntity = teamA;
            }
            if (match.teamBId) {
                const teamB = getStats(match.teamBId, ((_c = match.teamB) === null || _c === void 0 ? void 0 : _c.name) || `Team ${match.teamBId.substring(0, 6)}`, true, (_d = match.teamB) === null || _d === void 0 ? void 0 : _d.logo);
                if (match.teamBId === winnerId)
                    winnerEntity = teamB;
                else
                    loserEntity = teamB;
            }
        }
        else {
            if (match.participantAId) {
                const participantA = getStats(match.participantAId, ((_f = (_e = match.participantA) === null || _e === void 0 ? void 0 : _e.user) === null || _f === void 0 ? void 0 : _f.username) || `User ${match.participantAId.substring(0, 6)}`, false, (_h = (_g = match.participantA) === null || _g === void 0 ? void 0 : _g.user) === null || _h === void 0 ? void 0 : _h.avatar);
                if (match.participantAId === winnerId)
                    winnerEntity = participantA;
                else
                    loserEntity = participantA;
            }
            if (match.participantBId) {
                const participantB = getStats(match.participantBId, ((_k = (_j = match.participantB) === null || _j === void 0 ? void 0 : _j.user) === null || _k === void 0 ? void 0 : _k.username) || `User ${match.participantBId.substring(0, 6)}`, false, (_m = (_l = match.participantB) === null || _l === void 0 ? void 0 : _l.user) === null || _m === void 0 ? void 0 : _m.avatar);
                if (match.participantBId === winnerId)
                    winnerEntity = participantB;
                else
                    loserEntity = participantB;
            }
        }
        // Update stats
        if (winnerEntity) {
            winnerEntity.wins += 1;
            winnerEntity.score += POINTS_WIN;
        }
        else {
            console.warn(`Match ${match.id}: Could not find winner entity for ID ${winnerId}`);
        }
        if (loserEntity) {
            loserEntity.losses += 1;
            // Loser gets 0 points
        }
        else {
            // This can happen if only one participant was set for the match, log warning
            if (winnerEntity) { // Only warn if we found a winner but no loser
                console.warn(`Match ${match.id}: Could not find loser entity (Winner: ${winnerId})`);
            }
        }
    });
    // Convert map to array and sort
    const sortedStandings = Array.from(statsMap.values()).sort((a, b) => {
        // 1. Sort by Score (Descending)
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        // 2. Tiebreaker: Wins (Descending)
        if (b.wins !== a.wins) {
            return b.wins - a.wins;
        }
        // 3. Tiebreaker: Losses (Ascending)
        if (a.losses !== b.losses) {
            return a.losses - b.losses;
        }
        // 4. Tiebreaker: Name (Ascending) - Fallback
        return a.name.localeCompare(b.name);
    });
    console.log("Calculated Standings (Top 5):", sortedStandings.slice(0, 5));
    return sortedStandings;
}
