"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReschedule = exports.validateJudgeAssignment = exports.validateDisputeReason = exports.validateMatchResult = exports.validateUpdateMatch = exports.validateCreateMatch = void 0;
const client_1 = require("@prisma/client");
const validateCreateMatch = (req, res, next) => {
    const { tournamentId, round, matchNumber, scheduledTime, teamAId, teamBId, participantAId, participantBId, bracketSection } = req.body;
    // Required fields
    if (!tournamentId || typeof tournamentId !== 'string') {
        res.status(400).json({ error: 'Tournament ID is required' });
        return;
    }
    if (round === undefined || typeof round !== 'number' || round < 1) {
        res.status(400).json({ error: 'Valid round number is required' });
        return;
    }
    if (matchNumber === undefined || typeof matchNumber !== 'number' || matchNumber < 1) {
        res.status(400).json({ error: 'Valid match number is required' });
        return;
    }
    // At least one participant or team must be provided
    if (!teamAId && !teamBId && !participantAId && !participantBId) {
        res.status(400).json({ error: 'At least one participant or team is required' });
        return;
    }
    // Validate participants and teams are provided correctly
    if ((teamAId && participantAId) || (teamBId && participantBId)) {
        res.status(400).json({ error: 'Cannot provide both team and individual participant for the same position' });
        return;
    }
    // Validate scheduled time if provided
    if (scheduledTime) {
        try {
            new Date(scheduledTime);
        }
        catch (error) {
            res.status(400).json({ error: 'Invalid scheduled time format' });
            return;
        }
    }
    next();
};
exports.validateCreateMatch = validateCreateMatch;
const validateUpdateMatch = (req, res, next) => {
    const { scheduledTime, status, teamAId, teamBId, participantAId, participantBId, judgeId, nextMatchId, startTime, endTime } = req.body;
    // Validate status if provided
    const validStatuses = Object.values(client_1.MatchStatus);
    if (status && !validStatuses.includes(status)) {
        res.status(400).json({
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
    }
    // Validate participants and teams are provided correctly
    if ((teamAId && participantAId) || (teamBId && participantBId)) {
        res.status(400).json({ error: 'Cannot provide both team and individual participant for the same position' });
        return;
    }
    // Validate dates if provided
    const dateFields = { scheduledTime, startTime, endTime };
    for (const [field, value] of Object.entries(dateFields)) {
        if (value) {
            try {
                new Date(value);
            }
            catch (error) {
                res.status(400).json({ error: `Invalid ${field} format` });
                return;
            }
        }
    }
    // Validate IDs are strings if provided
    const idFields = { teamAId, teamBId, participantAId, participantBId, judgeId, nextMatchId };
    for (const [field, value] of Object.entries(idFields)) {
        if (value !== undefined && value !== null && typeof value !== 'string') {
            res.status(400).json({ error: `${field} must be a string` });
            return;
        }
    }
    next();
};
exports.validateUpdateMatch = validateUpdateMatch;
const validateMatchResult = (req, res, next) => {
    const { winnerId, score, notes } = req.body;
    // Validate winner ID
    if (!winnerId || typeof winnerId !== 'string') {
        res.status(400).json({ error: 'Winner ID is required' });
        return;
    }
    // Validate score
    if (!score || typeof score !== 'object') {
        res.status(400).json({ error: 'Score object is required' });
        return;
    }
    // Check that score has at least one entry
    if (Object.keys(score).length === 0) {
        res.status(400).json({ error: 'Score must include at least one entry' });
        return;
    }
    // Verify all score values are numbers
    for (const [key, value] of Object.entries(score)) {
        if (typeof value !== 'number') {
            res.status(400).json({ error: 'All score values must be numbers' });
            return;
        }
    }
    // Validate notes if provided
    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
        res.status(400).json({ error: 'Notes must be a string' });
        return;
    }
    next();
};
exports.validateMatchResult = validateMatchResult;
const validateDisputeReason = (req, res, next) => {
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string') {
        res.status(400).json({ error: 'Dispute reason is required' });
        return;
    }
    if (reason.length < 10 || reason.length > 500) {
        res.status(400).json({ error: 'Dispute reason must be between 10 and 500 characters' });
        return;
    }
    next();
};
exports.validateDisputeReason = validateDisputeReason;
const validateJudgeAssignment = (req, res, next) => {
    const { judgeId } = req.body;
    if (!judgeId || typeof judgeId !== 'string') {
        res.status(400).json({ error: 'Judge ID is required' });
        return;
    }
    next();
};
exports.validateJudgeAssignment = validateJudgeAssignment;
const validateReschedule = (req, res, next) => {
    const { scheduledTime } = req.body;
    if (!scheduledTime) {
        res.status(400).json({ error: 'Scheduled time is required' });
        return;
    }
    try {
        new Date(scheduledTime);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid scheduled time format' });
        return;
    }
    next();
};
exports.validateReschedule = validateReschedule;
