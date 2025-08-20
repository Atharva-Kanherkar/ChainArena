"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMemberRole = exports.validateInviteMember = exports.validateUpdateTeam = exports.validateCreateTeam = void 0;
const validateCreateTeam = (req, res, next) => {
    const { name, tag, logo, tournamentId } = req.body;
    // Name validation
    if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Team name is required' });
        return;
    }
    if (name.length < 2 || name.length > 50) {
        res.status(400).json({ error: 'Team name must be between 2 and 50 characters' });
        return;
    }
    // Tournament ID validation
    if (!tournamentId || typeof tournamentId !== 'string') {
        res.status(400).json({ error: 'Tournament ID is required' });
        return;
    }
    // Tag validation (optional)
    if (tag !== undefined && tag !== null) {
        if (typeof tag !== 'string') {
            res.status(400).json({ error: 'Team tag must be a string' });
            return;
        }
        if (tag && (tag.length < 2 || tag.length > 10)) {
            res.status(400).json({ error: 'Team tag must be between 2 and 10 characters' });
            return;
        }
    }
    // Logo validation (optional)
    if (logo !== undefined && logo !== null) {
        if (typeof logo !== 'string') {
            res.status(400).json({ error: 'Logo URL must be a string' });
            return;
        }
        if (logo && logo.length > 255) {
            res.status(400).json({ error: 'Logo URL cannot exceed 255 characters' });
            return;
        }
    }
    next();
};
exports.validateCreateTeam = validateCreateTeam;
const validateUpdateTeam = (req, res, next) => {
    const { name, tag, logo } = req.body;
    // All fields are optional for update, but validate them if provided
    // Name validation (if provided)
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ error: 'Team name cannot be empty' });
            return;
        }
        if (name.length < 2 || name.length > 50) {
            res.status(400).json({ error: 'Team name must be between 2 and 50 characters' });
            return;
        }
    }
    // Tag validation (optional)
    if (tag !== undefined) {
        if (tag !== null && typeof tag !== 'string') {
            res.status(400).json({ error: 'Team tag must be a string or null' });
            return;
        }
        if (tag && (tag.length < 2 || tag.length > 10)) {
            res.status(400).json({ error: 'Team tag must be between 2 and 10 characters' });
            return;
        }
    }
    // Logo validation (optional)
    if (logo !== undefined) {
        if (logo !== null && typeof logo !== 'string') {
            res.status(400).json({ error: 'Logo URL must be a string or null' });
            return;
        }
        if (logo && logo.length > 255) {
            res.status(400).json({ error: 'Logo URL cannot exceed 255 characters' });
            return;
        }
    }
    next();
};
exports.validateUpdateTeam = validateUpdateTeam;
const validateInviteMember = (req, res, next) => {
    const { userId } = req.body;
    if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: 'User ID is required' });
        return;
    }
    next();
};
exports.validateInviteMember = validateInviteMember;
const validateMemberRole = (req, res, next) => {
    const { newCaptainId } = req.body;
    if (!newCaptainId || typeof newCaptainId !== 'string') {
        res.status(400).json({ error: 'New captain ID is required' });
        return;
    }
    next();
};
exports.validateMemberRole = validateMemberRole;
