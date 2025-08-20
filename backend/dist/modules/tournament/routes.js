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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tournamentController = __importStar(require("./controller"));
const auth_1 = require("../../middlewares/auth");
const validators_1 = require("./validators");
const permissions_1 = require("../../middlewares/permissions");
const router = (0, express_1.Router)();
// Public routes
router.get('/', tournamentController.getTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.get('/:id/participants', tournamentController.getTournamentParticipants);
router.get('/:id/teams', tournamentController.getTournamentTeams);
// router.get('/:id/matches/round/:round', tournamentController.getTournamentRoundMatches);
router.get('/:id/results', tournamentController.getTournamentResults);
router.get('/:id/announcements', tournamentController.getTournamentAnnouncements);
router.get('/:id/stats', tournamentController.getTournamentStatistics);
// Protected routes - require authentication
router.post('/', auth_1.authenticate, validators_1.validateCreateTournament, tournamentController.createTournament);
router.put('/:id', auth_1.authenticate, permissions_1.isTournamentHost, validators_1.validateUpdateTournament, tournamentController.updateTournament);
router.delete('/:id', auth_1.authenticate, permissions_1.isTournamentHost, tournamentController.deleteTournament);
// Tournament status management
router.put('/:id/status', auth_1.authenticate, permissions_1.isTournamentHost, validators_1.validateTournamentStatus, tournamentController.updateTournamentStatus);
// Registration routes
router.post('/:id/register', auth_1.authenticate, validators_1.validateRegistration, tournamentController.registerParticipant);
router.delete('/:id/unregister', auth_1.authenticate, tournamentController.unregisterParticipant);
// Spectator routes
router.post('/:id/spectate', auth_1.authenticate, tournamentController.spectateTournament);
router.delete('/:id/spectate', auth_1.authenticate, tournamentController.unspectateTournament);
// Create bracket (POST)
router.post('/:id/brackets', auth_1.authenticate, permissions_1.isTournamentHost, validators_1.validateBracketGeneration, tournamentController.generateBracket);
// // Get brackets (GET)
// router.get('/:id/brackets', tournamentController.getBrackets);
// // Reset brackets (DELETE)
// router.delete('/:id/brackets', authenticate, isTournamentHost, tournamentController.resetBrackets);
// Participant management
router.put('/:id/participants/:participantId/seed', auth_1.authenticate, permissions_1.isTournamentHost, tournamentController.updateParticipantSeed);
router.put('/:id/participants/:participantId/approve', auth_1.authenticate, permissions_1.isTournamentHost, tournamentController.approveParticipant);
router.delete('/:id/participants/:participantId', auth_1.authenticate, permissions_1.isTournamentHost, tournamentController.removeParticipant);
// Announcements
router.post('/:id/announcements', auth_1.authenticate, permissions_1.isTournamentHost, validators_1.validateAnnouncement, tournamentController.createAnnouncement);
// User-specific tournament routes
router.get('/me/hosting', auth_1.authenticate, tournamentController.getHostedTournaments);
router.get('/me/participating', auth_1.authenticate, tournamentController.getParticipatingTournaments);
router.get('/me/spectating', auth_1.authenticate, tournamentController.getSpectatedTournaments);
exports.default = router;
