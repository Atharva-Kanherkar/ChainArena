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
exports.terminateSession = exports.getSessions = exports.getUserById = exports.getUsers = exports.updateProfile = exports.getProfile = void 0;
const userService = __importStar(require("./service"));
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const user = yield userService.getUserById(userId);
        res.json(user);
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch profile' });
    }
});
exports.getProfile = getProfile;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { username, displayName, bio, avatar } = req.body;
        const updatedUser = yield userService.updateUser(userId, {
            username,
            avatar
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        res.status(400).json({ error: error.message || 'Failed to update profile' });
    }
});
exports.updateProfile = updateProfile;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const users = yield userService.getUsers(page, limit, search);
        res.json(users);
    }
    catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
});
exports.getUsers = getUsers;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield userService.getUserById(id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error getting user by ID:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch user' });
    }
});
exports.getUserById = getUserById;
// Change these references from service to userService:
// Make sure these are exported from the controller file
const getSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use userService instead of service
        const sessions = yield userService.getUserSessions(req.user.id);
        res.json({ sessions });
    }
    catch (error) {
        console.error('Error fetching user sessions:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch sessions' });
    }
});
exports.getSessions = getSessions;
const terminateSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Use userService instead of service
        yield userService.terminateSession(id, req.user.id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error terminating session:', error);
        res.status(500).json({ error: error.message || 'Failed to terminate session' });
    }
});
exports.terminateSession = terminateSession;
