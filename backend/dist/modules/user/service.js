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
exports.getUsers = exports.updateUser = exports.getUserById = void 0;
exports.getUserSessions = getUserSessions;
exports.terminateSession = terminateSession;
const db_1 = __importDefault(require("../../lib/db"));
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            username: true,
            avatar: true, // Note: add this to your schema
            createdAt: true,
            updatedAt: true,
            // Get hosted tournaments
            hostedTournaments: {
                select: { id: true },
                take: 3
            },
            // Get participations
            participation: {
                select: { id: true, tournamentId: true },
                take: 3
            },
            // Get spectated tournaments through the many-to-many relation
            spectatedTournaments: {
                select: { id: true },
                take: 3
            }
        }
    });
    if (!user) {
        throw new Error('User not found');
    }
    // Transform the result to include role indicators
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Add role indicators
        isHost: user.hostedTournaments.length > 0,
        isParticipant: user.participation.length > 0,
        isSpectator: user.spectatedTournaments.length > 0,
        // Include some recent tournament data (optional)
        recentTournaments: {
            hosted: user.hostedTournaments.map(t => t.id),
            participating: user.participation.map(p => p.tournamentId),
            spectating: user.spectatedTournaments.map(t => t.id)
        }
    };
});
exports.getUserById = getUserById;
const updateUser = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if username is already taken if it's being updated
    if (data.username) {
        const existingUser = yield db_1.default.user.findFirst({
            where: {
                username: data.username,
                id: { not: id }
            }
        });
        if (existingUser) {
            throw new Error('Username is already taken');
        }
    }
    const user = yield db_1.default.user.update({
        where: { id },
        data,
        select: {
            id: true,
            email: true,
            username: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
            // Get hosted tournaments
            hostedTournaments: {
                select: { id: true },
                take: 3
            },
            // Get participations
            participation: {
                select: { id: true, tournamentId: true },
                take: 3
            },
            // Get spectated tournaments
            spectatedTournaments: {
                select: { id: true },
                take: 3
            }
        }
    });
    // Transform the result to include role indicators
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Add role indicators
        isHost: user.hostedTournaments.length > 0,
        isParticipant: user.participation.length > 0,
        isSpectator: user.spectatedTournaments.length > 0,
        // Include some recent tournament data (optional)
        recentTournaments: {
            hosted: user.hostedTournaments.map(t => t.id),
            participating: user.participation.map(p => p.tournamentId),
            spectating: user.spectatedTournaments.map(t => t.id)
        }
    };
});
exports.updateUser = updateUser;
const getUsers = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10, search) {
    const skip = (page - 1) * limit;
    let whereClause = {};
    if (search) {
        whereClause = {
            OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        };
    }
    const [users, totalCount] = yield Promise.all([
        db_1.default.user.findMany({
            where: whereClause,
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                createdAt: true,
                // Include counts to determine roles
                _count: {
                    select: {
                        hostedTournaments: true,
                        participation: true,
                        spectatedTournaments: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        db_1.default.user.count({ where: whereClause }),
    ]);
    // Transform users to include role indicators
    const transformedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        // Add role indicators based on relationship counts
        isHost: user._count.hostedTournaments > 0,
        isParticipant: user._count.participation > 0,
        isSpectator: user._count.spectatedTournaments > 0
    }));
    return {
        users: transformedUsers,
        pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit),
        }
    };
});
exports.getUsers = getUsers;
function getUserSessions(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // If you're not tracking sessions in your database yet,
        // you'll need to implement that first
        // For now, you could return mock data:
        return [
            {
                id: "current-session",
                device: "Current Browser",
                location: "Your Location",
                lastActive: new Date().toISOString(),
                current: true
            }
        ];
        // Once you implement session tracking, replace with:
        // return prisma.session.findMany({
        //   where: { userId },
        //   orderBy: { lastActive: 'desc' }
        // });
    });
}
function terminateSession(sessionId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // For now, just return success
        return { success: true };
        // Once you implement session tracking:
        // return prisma.session.delete({
        //   where: {
        //     id: sessionId,
        //     userId
        //   }
        // });
    });
}
