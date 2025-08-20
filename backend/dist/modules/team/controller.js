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
exports.leaveTeam = exports.getMyTeams = exports.updateMemberRole = exports.removeMember = exports.joinTeam = exports.inviteMember = exports.deleteTeam = exports.updateTeam = exports.getTeamById = exports.getTeams = exports.createTeam = void 0;
const teamService = __importStar(require("./service"));
const createTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, tag, logo, tournamentId } = req.body;
        const userId = req.user.id;
        const team = yield teamService.createTeam(userId, tournamentId, {
            name,
            tag,
            logo
        });
        res.status(201).json(team);
    }
    catch (error) {
        console.error('Error creating team:', error);
        res.status(400).json({ error: error.message || 'Failed to create team' });
    }
});
exports.createTeam = createTeam;
const getTeams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const tournamentId = req.query.tournamentId;
        const teams = yield teamService.getTeams(page, limit, search, tournamentId);
        res.json(teams);
    }
    catch (error) {
        console.error('Error getting teams:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch teams' });
    }
});
exports.getTeams = getTeams;
const getTeamById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const team = yield teamService.getTeamById(id);
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
        }
        res.json(team);
    }
    catch (error) {
        console.error('Error getting team by ID:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch team' });
    }
});
exports.getTeamById = getTeamById;
const updateTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, tag, logo } = req.body;
        const userId = req.user.id;
        const team = yield teamService.updateTeam(id, userId, {
            name,
            tag,
            logo
        });
        res.json(team);
    }
    catch (error) {
        console.error('Error updating team:', error);
        res.status(400).json({ error: error.message || 'Failed to update team' });
    }
});
exports.updateTeam = updateTeam;
const deleteTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        yield teamService.deleteTeam(id, userId);
        res.json({ message: 'Team deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting team:', error);
        res.status(400).json({ error: error.message || 'Failed to delete team' });
    }
});
exports.deleteTeam = deleteTeam;
const inviteMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const inviterId = req.user.id;
        const member = yield teamService.addMemberToTeam(id, userId, inviterId);
        res.status(201).json(member);
    }
    catch (error) {
        console.error('Error adding team member:', error);
        res.status(400).json({ error: error.message || 'Failed to add team member' });
    }
});
exports.inviteMember = inviteMember;
const joinTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const membership = yield teamService.joinTeam(id, userId);
        res.json(membership);
    }
    catch (error) {
        console.error('Error joining team:', error);
        res.status(400).json({ error: error.message || 'Failed to join team' });
    }
});
exports.joinTeam = joinTeam;
const removeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, memberId } = req.params;
        const requesterId = req.user.id;
        yield teamService.removeMember(id, memberId, requesterId);
        res.json({ message: 'Team member removed successfully' });
    }
    catch (error) {
        console.error('Error removing team member:', error);
        res.status(400).json({ error: error.message || 'Failed to remove team member' });
    }
});
exports.removeMember = removeMember;
const updateMemberRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, memberId } = req.params;
        const { role } = req.body;
        const requesterId = req.user.id;
        const membership = yield teamService.updateMemberRole(id, memberId, requesterId, role);
        res.json(membership);
    }
    catch (error) {
        console.error('Error updating member role:', error);
        res.status(400).json({ error: error.message || 'Failed to update member role' });
    }
});
exports.updateMemberRole = updateMemberRole;
const getMyTeams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const teams = yield teamService.getUserTeams(userId);
        res.json(teams);
    }
    catch (error) {
        console.error('Error getting user teams:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch user teams' });
    }
});
exports.getMyTeams = getMyTeams;
const leaveTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        yield teamService.leaveTeam(id, userId);
        res.json({ message: 'Successfully left team' });
    }
    catch (error) {
        console.error('Error leaving team:', error);
        res.status(400).json({ error: error.message || 'Failed to leave team' });
    }
});
exports.leaveTeam = leaveTeam;
