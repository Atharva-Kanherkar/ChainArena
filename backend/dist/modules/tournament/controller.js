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
exports.getTournamentStatistics = exports.removeParticipant = exports.approveParticipant = exports.updateParticipantSeed = exports.getTournamentAnnouncements = exports.createAnnouncement = exports.getTournamentResults = exports.generateBracket = exports.getSpectatedTournaments = exports.getParticipatingTournaments = exports.getHostedTournaments = exports.getTournamentTeams = exports.getTournamentParticipants = exports.unspectateTournament = exports.spectateTournament = exports.unregisterParticipant = exports.registerParticipant = exports.updateTournamentStatus = exports.deleteTournament = exports.updateTournament = exports.getTournamentById = exports.getTournaments = exports.createTournament = void 0;
const tournamentService = __importStar(require("./service"));
const createTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const tournamentData = req.body;
        const tournament = yield tournamentService.createTournament(userId, tournamentData);
        res.status(201).json(tournament);
    }
    catch (error) {
        console.error('Error creating tournament:', error);
        res.status(400).json({ error: error.message || 'Failed to create tournament' });
    }
});
exports.createTournament = createTournament;
const getTournaments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const tournaments = yield tournamentService.getTournaments(page, limit, search, status);
        res.json(tournaments);
    }
    catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tournaments' });
    }
});
exports.getTournaments = getTournaments;
const getTournamentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const tournament = yield tournamentService.getTournamentById(id);
        if (!tournament) {
            res.status(404).json({ error: 'Tournament not found' });
        }
        res.json(tournament);
    }
    catch (error) {
        console.error('Error fetching tournament:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tournament' });
    }
});
exports.getTournamentById = getTournamentById;
const updateTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const tournamentData = req.body;
        const tournament = yield tournamentService.updateTournament(id, userId, tournamentData);
        res.json(tournament);
    }
    catch (error) {
        console.error('Error updating tournament:', error);
        res.status(400).json({ error: error.message || 'Failed to update tournament' });
    }
});
exports.updateTournament = updateTournament;
const deleteTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        yield tournamentService.deleteTournament(id, userId);
        res.json({ message: 'Tournament deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting tournament:', error);
        res.status(400).json({ error: error.message || 'Failed to delete tournament' });
    }
});
exports.deleteTournament = deleteTournament;
const updateTournamentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        const tournament = yield tournamentService.updateTournamentStatus(id, userId, status);
        res.json(tournament);
    }
    catch (error) {
        console.error('Error updating tournament status:', error);
        res.status(400).json({ error: error.message || 'Failed to update tournament status' });
    }
});
exports.updateTournamentStatus = updateTournamentStatus;
const registerParticipant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { entryFeeTx } = req.body; // Get transaction signature
        const registration = yield tournamentService.registerParticipant(id, userId, entryFeeTx // Pass payment transaction signature
        );
        res.status(201).json(registration);
    }
    catch (error) {
        console.error('Error registering for tournament:', error);
        res.status(400).json({ error: error.message || 'Failed to register for tournament' });
    }
});
exports.registerParticipant = registerParticipant;
const unregisterParticipant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        yield tournamentService.unregisterParticipant(id, userId);
        res.json({ message: 'Successfully unregistered from tournament' });
    }
    catch (error) {
        console.error('Error unregistering from tournament:', error);
        res.status(400).json({ error: error.message || 'Failed to unregister from tournament' });
    }
});
exports.unregisterParticipant = unregisterParticipant;
const spectateTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        yield tournamentService.addSpectator(id, userId);
        res.json({ message: 'Now spectating tournament' });
    }
    catch (error) {
        console.error('Error spectating tournament:', error);
        res.status(400).json({ error: error.message || 'Failed to spectate tournament' });
    }
});
exports.spectateTournament = spectateTournament;
const unspectateTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        yield tournamentService.removeSpectator(id, userId);
        res.json({ message: 'No longer spectating tournament' });
    }
    catch (error) {
        console.error('Error unspectating tournament:', error);
        res.status(400).json({ error: error.message || 'Failed to unspectate tournament' });
    }
});
exports.unspectateTournament = unspectateTournament;
const getTournamentParticipants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const participants = yield tournamentService.getTournamentParticipants(id, page, limit);
        res.json(participants);
    }
    catch (error) {
        console.error('Error fetching tournament participants:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tournament participants' });
    }
});
exports.getTournamentParticipants = getTournamentParticipants;
const getTournamentTeams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const teams = yield tournamentService.getTournamentTeams(id, page, limit);
        res.json(teams);
    }
    catch (error) {
        console.error('Error fetching tournament teams:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tournament teams' });
    }
});
exports.getTournamentTeams = getTournamentTeams;
const getHostedTournaments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const tournaments = yield tournamentService.getUserHostedTournaments(userId, page, limit);
        res.json(tournaments);
    }
    catch (error) {
        console.error('Error fetching hosted tournaments:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch hosted tournaments' });
    }
});
exports.getHostedTournaments = getHostedTournaments;
const getParticipatingTournaments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const tournaments = yield tournamentService.getUserParticipatingTournaments(userId, page, limit);
        res.json(tournaments);
    }
    catch (error) {
        console.error('Error fetching participating tournaments:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch participating tournaments' });
    }
});
exports.getParticipatingTournaments = getParticipatingTournaments;
const getSpectatedTournaments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const tournaments = yield tournamentService.getUserSpectatedTournaments(userId, page, limit);
        res.json(tournaments);
    }
    catch (error) {
        console.error('Error fetching spectated tournaments:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch spectated tournaments' });
    }
});
exports.getSpectatedTournaments = getSpectatedTournaments;
/**
 * Generate tournament bracket
 */
const generateBracket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { seedMethod = 'random' } = req.body;
        const matches = yield tournamentService.generateTournamentBracket(id, userId, seedMethod);
        res.status(201).json({
            message: 'Tournament bracket generated successfully',
            matches
        });
    }
    catch (error) {
        console.error('Error generating tournament bracket:', error);
        res.status(400).json({ error: error.message || 'Failed to generate tournament bracket' });
    }
});
exports.generateBracket = generateBracket;
// /**
//  * Get tournament matches for a specific round
//  */
// export const getTournamentRoundMatches = async (req: Request, res: Response) => {
//   try {
//     const { id, round } = req.params;
//     const roundNumber = parseInt(round);
//     if (isNaN(roundNumber)) {
//       return res.status(400).json({ error: 'Round must be a number' });
//     }
//     const matches = await tournamentService.getTournamentRoundMatches(id, roundNumber);
//     res.json(matches);
//   } catch (error: any) {
//     console.error('Error fetching tournament round matches:', error);
//     res.status(500).json({ error: error.message || 'Failed to fetch tournament round matches' });
//   }
// };
/**
 * Get tournament results
 */
const getTournamentResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const results = yield tournamentService.getTournamentResults(id);
        res.json(results);
    }
    catch (error) {
        console.error('Error fetching tournament results:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tournament results' });
    }
});
exports.getTournamentResults = getTournamentResults;
/**
 * Create tournament announcement
 */
const createAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const announcementData = req.body;
        const announcement = yield tournamentService.createAnnouncement(id, userId, announcementData);
        res.status(201).json(announcement);
    }
    catch (error) {
        console.error('Error creating announcement:', error);
        res.status(400).json({ error: error.message || 'Failed to create announcement' });
    }
});
exports.createAnnouncement = createAnnouncement;
/**
 * Get tournament announcements
 */
const getTournamentAnnouncements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const announcements = yield tournamentService.getTournamentAnnouncements(id, page, limit);
        res.json(announcements);
    }
    catch (error) {
        console.error('Error fetching tournament announcements:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tournament announcements' });
    }
});
exports.getTournamentAnnouncements = getTournamentAnnouncements;
/**
 * Update participant seed
 */
const updateParticipantSeed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, participantId } = req.params;
        const userId = req.user.id;
        const { seed } = req.body;
        const participant = yield tournamentService.updateParticipantSeed(id, participantId, userId, seed);
        res.json(participant);
    }
    catch (error) {
        console.error('Error updating participant seed:', error);
        res.status(400).json({ error: error.message || 'Failed to update participant seed' });
    }
});
exports.updateParticipantSeed = updateParticipantSeed;
/**
 * Approve participant
 */
const approveParticipant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, participantId } = req.params;
        const userId = req.user.id;
        const participant = yield tournamentService.approveParticipant(id, participantId, userId);
        res.json(participant);
    }
    catch (error) {
        console.error('Error approving participant:', error);
        res.status(400).json({ error: error.message || 'Failed to approve participant' });
    }
});
exports.approveParticipant = approveParticipant;
/**
 * Remove participant
 */
const removeParticipant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, participantId } = req.params;
        const userId = req.user.id;
        yield tournamentService.removeParticipant(id, participantId, userId);
        res.json({ message: 'Participant removed successfully' });
    }
    catch (error) {
        console.error('Error removing participant:', error);
        res.status(400).json({ error: error.message || 'Failed to remove participant' });
    }
});
exports.removeParticipant = removeParticipant;
/**
 * Get tournament statistics
 */
const getTournamentStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const stats = yield tournamentService.getTournamentStatistics(id);
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching tournament statistics:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tournament statistics' });
    }
});
exports.getTournamentStatistics = getTournamentStatistics;
