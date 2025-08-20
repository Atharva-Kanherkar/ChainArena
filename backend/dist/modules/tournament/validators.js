"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJudgeAssignment = exports.validateTournamentJoinCode = exports.validateMatchScheduling = exports.validateBracketGeneration = exports.validateParticipantSeed = exports.validateTeamMember = exports.validateAnnouncement = exports.validateTeamUpdate = exports.validateTeamCreation = exports.validateRegistration = exports.validateTournamentStatus = exports.validateUpdateTournament = exports.validateCreateTournament = void 0;
const validTournamentStatuses = [
    'DRAFT',
    'REGISTRATION_OPEN',
    'REGISTRATION_CLOSED',
    'ONGOING',
    'COMPLETED',
    'CANCELLED'
];
const validTournamentFormats = [
    'SINGLE_ELIMINATION',
    'DOUBLE_ELIMINATION',
    'ROUND_ROBIN',
    'SWISS',
    'CUSTOM'
];
const validateCreateTournament = (req, res, next) => {
    const { name, description, startDate, endDate, format, maxParticipants, minParticipants, teamSize, isTeamBased, registrationDeadline, status } = req.body;
    // Required fields
    if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Tournament name is required' });
        return;
    }
    if (name.length < 3 || name.length > 100) {
        res.status(400).json({ error: 'Tournament name must be between 3 and 100 characters' });
        return;
    }
    // Optional description
    if (description !== undefined && description !== null && typeof description !== 'string') {
        res.status(400).json({ error: 'Tournament description must be a string' });
        return;
    }
    // Date validations
    if (startDate) {
        const startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
            res.status(400).json({ error: 'Invalid start date format' });
            return;
        }
    }
    if (endDate) {
        const endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
            res.status(400).json({ error: 'Invalid end date format' });
            return;
        }
    }
    if (registrationDeadline) {
        const deadlineObj = new Date(registrationDeadline);
        if (isNaN(deadlineObj.getTime())) {
            res.status(400).json({ error: 'Invalid registration deadline format' });
            return;
        }
    }
    // Check date relationships
    if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (startDateObj > endDateObj) {
            res.status(400).json({ error: 'End date must be after start date' });
            return;
        }
    }
    if (startDate && registrationDeadline) {
        const startDateObj = new Date(startDate);
        const deadlineObj = new Date(registrationDeadline);
        if (deadlineObj > startDateObj) {
            res.status(400).json({ error: 'Registration deadline must be before start date' });
            return;
        }
    }
    // Format validation
    if (format && !validTournamentFormats.includes(format)) {
        res.status(400).json({
            error: `Invalid tournament format. Must be one of: ${validTournamentFormats.join(', ')}`
        });
        return;
    }
    // Status validation
    if (status && !validTournamentStatuses.includes(status)) {
        res.status(400).json({
            error: `Invalid tournament status. Must be one of: ${validTournamentStatuses.join(', ')}`
        });
        return;
    }
    // Participant counts
    if (maxParticipants !== undefined) {
        const max = Number(maxParticipants);
        if (isNaN(max) || max < 2) {
            res.status(400).json({ error: 'Max participants must be at least 2' });
            return;
        }
    }
    if (minParticipants !== undefined) {
        const min = Number(minParticipants);
        if (isNaN(min) || min < 2) {
            res.status(400).json({ error: 'Min participants must be at least 2' });
            return;
        }
    }
    if (minParticipants !== undefined && maxParticipants !== undefined) {
        const min = Number(minParticipants);
        const max = Number(maxParticipants);
        if (min > max) {
            res.status(400).json({ error: 'Min participants cannot be greater than max participants' });
            return;
        }
    }
    // Team size validation
    if (teamSize !== undefined) {
        const size = Number(teamSize);
        if (isNaN(size) || size < 1) {
            res.status(400).json({ error: 'Team size must be at least 1' });
            return;
        }
    }
    // IsTeamBased validation
    if (isTeamBased !== undefined && typeof isTeamBased !== 'boolean') {
        res.status(400).json({ error: 'isTeamBased must be a boolean' });
        return;
    }
    next();
};
exports.validateCreateTournament = validateCreateTournament;
const validateUpdateTournament = (req, res, next) => {
    const { name, description, startDate, endDate, format, maxParticipants, minParticipants, teamSize, isTeamBased, registrationDeadline } = req.body;
    // Optional name
    if (name !== undefined) {
        if (typeof name !== 'string') {
            res.status(400).json({ error: 'Tournament name must be a string' });
            return;
        }
        if (name.length < 3 || name.length > 100) {
            res.status(400).json({ error: 'Tournament name must be between 3 and 100 characters' });
            return;
        }
    }
    // Optional description
    if (description !== undefined && description !== null && typeof description !== 'string') {
        res.status(400).json({ error: 'Tournament description must be a string or null' });
        return;
    }
    // Date validations
    if (startDate !== undefined && startDate !== null) {
        const startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
            res.status(400).json({ error: 'Invalid start date format' });
            return;
        }
    }
    if (endDate !== undefined && endDate !== null) {
        const endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
            res.status(400).json({ error: 'Invalid end date format' });
            return;
        }
    }
    if (registrationDeadline !== undefined && registrationDeadline !== null) {
        const deadlineObj = new Date(registrationDeadline);
        if (isNaN(deadlineObj.getTime())) {
            res.status(400).json({ error: 'Invalid registration deadline format' });
            return;
        }
    }
    // Check date relationships
    if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (startDateObj > endDateObj) {
            res.status(400).json({ error: 'End date must be after start date' });
            return;
        }
    }
    if (startDate && registrationDeadline) {
        const startDateObj = new Date(startDate);
        const deadlineObj = new Date(registrationDeadline);
        if (deadlineObj > startDateObj) {
            res.status(400).json({ error: 'Registration deadline must be before start date' });
            return;
        }
    }
    // Format validation
    if (format !== undefined && !validTournamentFormats.includes(format)) {
        res.status(400).json({
            error: `Invalid tournament format. Must be one of: ${validTournamentFormats.join(', ')}`
        });
        return;
    }
    // Participant counts
    if (maxParticipants !== undefined) {
        const max = Number(maxParticipants);
        if (isNaN(max) || max < 2) {
            res.status(400).json({ error: 'Max participants must be at least 2' });
            return;
        }
    }
    if (minParticipants !== undefined) {
        const min = Number(minParticipants);
        if (isNaN(min) || min < 2) {
            res.status(400).json({ error: 'Min participants must be at least 2' });
            return;
        }
    }
    if (minParticipants !== undefined && maxParticipants !== undefined) {
        const min = Number(minParticipants);
        const max = Number(maxParticipants);
        if (min > max) {
            res.status(400).json({ error: 'Min participants cannot be greater than max participants' });
            return;
        }
    }
    // Team size validation
    if (teamSize !== undefined) {
        const size = Number(teamSize);
        if (isNaN(size) || size < 1) {
            res.status(400).json({ error: 'Team size must be at least 1' });
            return;
        }
    }
    // IsTeamBased validation
    if (isTeamBased !== undefined && typeof isTeamBased !== 'boolean') {
        res.status(400).json({ error: 'isTeamBased must be a boolean' });
        return;
    }
    next();
};
exports.validateUpdateTournament = validateUpdateTournament;
const validateTournamentStatus = (req, res, next) => {
    const { status } = req.body;
    if (!status) {
        res.status(400).json({ error: 'Tournament status is required' });
        return;
    }
    if (!validTournamentStatuses.includes(status)) {
        res.status(400).json({
            error: `Invalid tournament status. Must be one of: ${validTournamentStatuses.join(', ')}`
        });
        return;
    }
    next();
};
exports.validateTournamentStatus = validateTournamentStatus;
const validateRegistration = (req, res, next) => {
    const { teamId } = req.body;
    // TeamId is optional, but if provided must be a string
    if (teamId !== undefined && typeof teamId !== 'string') {
        res.status(400).json({ error: 'Team ID must be a string' });
        return;
    }
    next();
};
exports.validateRegistration = validateRegistration;
/**
 * Validates team creation request
 */
const validateTeamCreation = (req, res, next) => {
    const { name, description, logo } = req.body;
    // Team name is required
    if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Team name is required' });
        return;
    }
    if (name.length < 2 || name.length > 50) {
        res.status(400).json({ error: 'Team name must be between 2 and 50 characters' });
        return;
    }
    // Optional description
    if (description !== undefined && description !== null && typeof description !== 'string') {
        res.status(400).json({ error: 'Team description must be a string' });
        return;
    }
    // Optional logo URL
    if (logo !== undefined && logo !== null && typeof logo !== 'string') {
        res.status(400).json({ error: 'Team logo must be a string URL' });
        return;
    }
    next();
};
exports.validateTeamCreation = validateTeamCreation;
/**
 * Validates team update request
 */
const validateTeamUpdate = (req, res, next) => {
    const { name, description, logo } = req.body;
    // Optional name
    if (name !== undefined) {
        if (typeof name !== 'string') {
            res.status(400).json({ error: 'Team name must be a string' });
            return;
        }
        if (name.length < 2 || name.length > 50) {
            res.status(400).json({ error: 'Team name must be between 2 and 50 characters' });
            return;
        }
    }
    // Optional description
    if (description !== undefined && description !== null && typeof description !== 'string') {
        res.status(400).json({ error: 'Team description must be a string' });
        return;
    }
    // Optional logo URL
    if (logo !== undefined && logo !== null && typeof logo !== 'string') {
        res.status(400).json({ error: 'Team logo must be a string URL' });
        return;
    }
    next();
};
exports.validateTeamUpdate = validateTeamUpdate;
/**
 * Validates announcement creation request
 */
const validateAnnouncement = (req, res, next) => {
    const { title, content, importance } = req.body;
    // Title is required
    if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'Announcement title is required' });
        return;
    }
    if (title.length < 3 || title.length > 100) {
        res.status(400).json({ error: 'Announcement title must be between 3 and 100 characters' });
        return;
    }
    // Content is required
    if (!content || typeof content !== 'string') {
        res.status(400).json({ error: 'Announcement content is required' });
        return;
    }
    if (content.length < 10 || content.length > 5000) {
        res.status(400).json({ error: 'Announcement content must be between 10 and 5000 characters' });
        return;
    }
    // Optional importance level
    if (importance !== undefined) {
        const validImportance = ['low', 'medium', 'high', 'urgent'];
        if (!validImportance.includes(importance)) {
            res.status(400).json({
                error: `Invalid importance level. Must be one of: ${validImportance.join(', ')}`
            });
            return;
        }
    }
    next();
};
exports.validateAnnouncement = validateAnnouncement;
/**
 * Validates team member addition request
 */
const validateTeamMember = (req, res, next) => {
    const { userId } = req.body;
    if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: 'User ID is required' });
        return;
    }
    next();
};
exports.validateTeamMember = validateTeamMember;
/**
 * Validates participant seed update request
 */
const validateParticipantSeed = (req, res, next) => {
    const { seed } = req.body;
    if (seed === undefined || seed === null) {
        res.status(400).json({ error: 'Seed value is required' });
        return;
    }
    const seedNumber = Number(seed);
    if (isNaN(seedNumber) || seedNumber < 1) {
        res.status(400).json({ error: 'Seed must be a positive number' });
        return;
    }
    next();
};
exports.validateParticipantSeed = validateParticipantSeed;
/**
 * Validates bracket generation request
 */
const validateBracketGeneration = (req, res, next) => {
    const { seedMethod } = req.body;
    // Optional seedMethod
    if (seedMethod !== undefined) {
        const validMethods = ['random', 'manual', 'ranking'];
        if (!validMethods.includes(seedMethod)) {
            res.status(400).json({
                error: `Invalid seed method. Must be one of: ${validMethods.join(', ')}`
            });
            return;
        }
    }
    next();
};
exports.validateBracketGeneration = validateBracketGeneration;
/**
 * Validates match scheduling request
 */
const validateMatchScheduling = (req, res, next) => {
    const { matchId, scheduledTime, venueId } = req.body;
    // Match ID is required
    if (!matchId || typeof matchId !== 'string') {
        res.status(400).json({ error: 'Match ID is required' });
        return;
    }
    // Scheduled time is required
    if (!scheduledTime) {
        res.status(400).json({ error: 'Scheduled time is required' });
        return;
    }
    const scheduledTimeObj = new Date(scheduledTime);
    if (isNaN(scheduledTimeObj.getTime())) {
        res.status(400).json({ error: 'Invalid scheduled time format' });
        return;
    }
    // Optional venue ID
    if (venueId !== undefined && venueId !== null && typeof venueId !== 'string') {
        res.status(400).json({ error: 'Venue ID must be a string' });
        return;
    }
    next();
};
exports.validateMatchScheduling = validateMatchScheduling;
/**
 * Validates tournament join code for quick registration
 */
const validateTournamentJoinCode = (req, res, next) => {
    const { joinCode } = req.body;
    if (!joinCode || typeof joinCode !== 'string') {
        res.status(400).json({ error: 'Tournament join code is required' });
        return;
    }
    if (joinCode.length < 6 || joinCode.length > 20) {
        res.status(400).json({ error: 'Invalid join code format' });
        return;
    }
    next();
};
exports.validateTournamentJoinCode = validateTournamentJoinCode;
/**
 * Validates judging assignment for a match
 */
const validateJudgeAssignment = (req, res, next) => {
    const { judgeId, matchId } = req.body;
    // Judge ID is required
    if (!judgeId || typeof judgeId !== 'string') {
        res.status(400).json({ error: 'Judge ID is required' });
        return;
    }
    // Match ID is required
    if (!matchId || typeof matchId !== 'string') {
        res.status(400).json({ error: 'Match ID is required' });
        return;
    }
    next();
};
exports.validateJudgeAssignment = validateJudgeAssignment;
