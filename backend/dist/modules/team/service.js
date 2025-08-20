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
exports.leaveTeam = exports.getUserTeams = exports.updateMemberRole = exports.removeMember = exports.joinTeam = exports.addMemberToTeam = exports.deleteTeam = exports.updateTeam = exports.getTeamById = exports.getTeams = exports.createTeam = void 0;
const db_1 = __importDefault(require("../../lib/db"));
const createTeam = (userId, tournamentId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if tournament exists
    const tournament = yield db_1.default.tournament.findUnique({
        where: { id: tournamentId }
    });
    if (!tournament) {
        throw new Error('Tournament not found');
    }
    // Check if user is registered for the tournament
    let participant = yield db_1.default.tournamentParticipant.findUnique({
        where: {
            userId_tournamentId: {
                userId,
                tournamentId
            }
        }
    });
    // If not registered yet, register them
    if (!participant) {
        participant = yield db_1.default.tournamentParticipant.create({
            data: {
                userId,
                tournamentId
            }
        });
    }
    // Check if participant is already in a team
    if (participant.teamId) {
        throw new Error('You are already in a team for this tournament');
    }
    // Check if team name is unique in this tournament
    const existingTeam = yield db_1.default.team.findUnique({
        where: {
            name_tournamentId: {
                name: data.name,
                tournamentId
            }
        }
    });
    if (existingTeam) {
        throw new Error('Team name already exists in this tournament');
    }
    // Create team transaction to ensure all operations succeed or fail together
    return db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Create the team - FIX HERE: Use captainId instead of captain.connect
        const team = yield tx.team.create({
            data: {
                name: data.name,
                tournamentId: tournamentId,
                captainId: participant.id // Direct assignment of captainId
            }
        });
        // Add creator as team member
        yield tx.tournamentParticipant.update({
            where: { id: participant.id },
            data: {
                teamId: team.id
            }
        });
        // Return team with details
        return tx.team.findUniqueOrThrow({
            where: { id: team.id },
            include: {
                captain: {
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
                members: {
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
                tournament: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }));
});
exports.createTeam = createTeam;
const getTeams = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10, search, tournamentId) {
    const skip = (page - 1) * limit;
    // Build where clause for filtering
    let whereClause = {};
    if (search) {
        whereClause = {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
            ]
        };
    }
    if (tournamentId) {
        whereClause = Object.assign(Object.assign({}, whereClause), { tournamentId });
    }
    const [teams, totalCount] = yield Promise.all([
        db_1.default.team.findMany({
            where: whereClause,
            include: {
                captain: {
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
                _count: {
                    select: {
                        members: true
                    }
                },
                tournament: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        db_1.default.team.count({ where: whereClause })
    ]);
    return {
        teams,
        pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
        }
    };
});
exports.getTeams = getTeams;
const getTeamById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.default.team.findUnique({
        where: { id },
        include: {
            captain: {
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
            members: {
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
            tournament: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
});
exports.getTeamById = getTeamById;
const updateTeam = (id, userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify team exists
    const team = yield db_1.default.team.findUnique({
        where: { id },
        include: {
            captain: true
        }
    });
    if (!team) {
        throw new Error('Team not found');
    }
    // Verify user is team captain
    if (team.captain.userId !== userId) {
        throw new Error('Only the team captain can update team details');
    }
    // If changing name, check it's unique
    if (data.name && data.name !== team.name) {
        const existingTeam = yield db_1.default.team.findUnique({
            where: {
                name_tournamentId: {
                    name: data.name,
                    tournamentId: team.tournamentId
                }
            }
        });
        if (existingTeam && existingTeam.id !== id) {
            throw new Error('Team name already exists in this tournament');
        }
    }
    // Update team
    return db_1.default.team.update({
        where: { id },
        data,
        include: {
            captain: {
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
            members: {
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
            tournament: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
});
exports.updateTeam = updateTeam;
const deleteTeam = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify team exists
    const team = yield db_1.default.team.findUnique({
        where: { id },
        include: {
            captain: true,
            members: true
        }
    });
    if (!team) {
        throw new Error('Team not found');
    }
    // Verify user is team captain
    if (team.captain.userId !== userId) {
        throw new Error('Only the team captain can delete the team');
    }
    // Check if team is in active tournaments
    // This would require additional logic based on your tournament statuses
    // Delete team (this will automatically update the members teamId to null due to foreign key constraints)
    return db_1.default.team.delete({
        where: { id }
    });
});
exports.deleteTeam = deleteTeam;
const addMemberToTeam = (teamId, memberUserId, inviterId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify team exists
    const team = yield db_1.default.team.findUnique({
        where: { id: teamId },
        include: {
            captain: true,
            tournament: true,
            members: true
        }
    });
    if (!team) {
        throw new Error('Team not found');
    }
    // Verify inviter is team captain
    if (team.captain.userId !== inviterId) {
        throw new Error('Only the team captain can add members');
    }
    // Check if user exists
    const user = yield db_1.default.user.findUnique({
        where: { id: memberUserId }
    });
    if (!user) {
        throw new Error('User not found');
    }
    // Check if user is already in this team
    const existingMembership = team.members.find(member => member.userId === memberUserId);
    if (existingMembership) {
        throw new Error('User is already a member of this team');
    }
    // Check if user is already a participant in this tournament
    let participant = yield db_1.default.tournamentParticipant.findUnique({
        where: {
            userId_tournamentId: {
                userId: memberUserId,
                tournamentId: team.tournamentId
            }
        }
    });
    // If not already a participant, create a participant entry
    if (!participant) {
        participant = yield db_1.default.tournamentParticipant.create({
            data: {
                userId: memberUserId,
                tournamentId: team.tournamentId
            }
        });
    }
    else if (participant.teamId) {
        // If already in another team for this tournament
        throw new Error('User is already in another team for this tournament');
    }
    // Add to team
    return db_1.default.tournamentParticipant.update({
        where: { id: participant.id },
        data: { teamId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    avatar: true
                }
            }
        }
    });
});
exports.addMemberToTeam = addMemberToTeam;
const joinTeam = (teamId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify team exists
    const team = yield db_1.default.team.findUnique({
        where: { id: teamId },
        include: { tournament: true }
    });
    if (!team) {
        throw new Error('Team not found');
    }
    // Check if user is already a participant in this tournament
    let participant = yield db_1.default.tournamentParticipant.findUnique({
        where: {
            userId_tournamentId: {
                userId,
                tournamentId: team.tournamentId
            }
        }
    });
    // If not already a participant, create a participant entry
    if (!participant) {
        participant = yield db_1.default.tournamentParticipant.create({
            data: {
                userId,
                tournamentId: team.tournamentId
            }
        });
    }
    else if (participant.teamId) {
        // If already in another team for this tournament
        throw new Error('You are already in a team for this tournament');
    }
    // Join team
    return db_1.default.tournamentParticipant.update({
        where: { id: participant.id },
        data: { teamId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    avatar: true
                }
            },
            team: {
                include: {
                    captain: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
});
exports.joinTeam = joinTeam;
const removeMember = (teamId, memberId, requesterId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify team exists
    const team = yield db_1.default.team.findUnique({
        where: { id: teamId },
        include: {
            captain: true
        }
    });
    if (!team) {
        throw new Error('Team not found');
    }
    // Verify requester is team captain
    if (team.captain.userId !== requesterId) {
        throw new Error('Only the team captain can remove members');
    }
    // Get member to remove
    const member = yield db_1.default.tournamentParticipant.findFirst({
        where: {
            id: memberId,
            teamId
        }
    });
    if (!member) {
        throw new Error('Team member not found');
    }
    // Cannot remove captain through this method
    if (member.id === team.captainId) {
        throw new Error('Cannot remove the team captain. Transfer captainship first or delete the team.');
    }
    // Remove from team by setting teamId to null
    return db_1.default.tournamentParticipant.update({
        where: { id: memberId },
        data: { teamId: null }
    });
});
exports.removeMember = removeMember;
const updateMemberRole = (teamId, memberId, requesterId, newCaptainId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify team exists
    const team = yield db_1.default.team.findUnique({
        where: { id: teamId },
        include: {
            captain: true,
            members: true
        }
    });
    if (!team) {
        throw new Error('Team not found');
    }
    // Verify requester is team captain
    if (team.captain.userId !== requesterId) {
        throw new Error('Only the team captain can change member roles');
    }
    // If changing captain
    if (newCaptainId) {
        // Verify new captain is a team member
        const newCaptain = team.members.find(m => m.id === newCaptainId);
        if (!newCaptain) {
            throw new Error('New captain must be a team member');
        }
        // Update team with new captain
        return db_1.default.team.update({
            where: { id: teamId },
            data: { captainId: newCaptainId },
            include: {
                captain: {
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
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        });
    }
    throw new Error('No role change specified');
});
exports.updateMemberRole = updateMemberRole;
const getUserTeams = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get all teams where user is a member
    const participations = yield db_1.default.tournamentParticipant.findMany({
        where: {
            userId,
            teamId: { not: null }
        },
        include: {
            team: {
                include: {
                    captain: {
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
                    members: {
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
                    tournament: {
                        select: {
                            id: true,
                            name: true,
                            startDate: true
                        }
                    }
                }
            }
        }
    });
    return participations.map(p => p.team);
});
exports.getUserTeams = getUserTeams;
const leaveTeam = (teamId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Get the user's participation record
    const participation = yield db_1.default.tournamentParticipant.findFirst({
        where: {
            userId,
            teamId
        },
        include: {
            team: {
                include: {
                    captain: true
                }
            }
        }
    });
    if (!participation) {
        throw new Error('You are not a member of this team');
    }
    // Check if user is the captain
    if (((_a = participation.team) === null || _a === void 0 ? void 0 : _a.captain.userId) === userId) {
        throw new Error('Team captains cannot leave. Transfer captainship first or delete the team.');
    }
    // Remove from team by setting teamId to null
    return db_1.default.tournamentParticipant.update({
        where: { id: participation.id },
        data: { teamId: null }
    });
});
exports.leaveTeam = leaveTeam;
