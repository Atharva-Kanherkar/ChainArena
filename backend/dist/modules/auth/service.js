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
exports.registerUser = registerUser;
exports.syncUser = syncUser;
exports.loginUser = loginUser;
exports.logoutUser = logoutUser;
exports.linkWalletToUser = linkWalletToUser;
const db_1 = __importDefault(require("../../lib/db"));
function registerUser(email, name, supabaseUid) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if user exists in your database first
        const existingUserInDatabase = yield db_1.default.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase() },
                    { supabaseId: supabaseUid }
                ]
            }
        });
        if (existingUserInDatabase) {
            if (existingUserInDatabase.supabaseId === supabaseUid) {
                return { message: 'User already registered', userId: existingUserInDatabase.id };
            }
            throw new Error('User already registered with this email');
        }
        try {
            // Create user in our database
            const user = yield db_1.default.user.create({
                data: {
                    email: email.toLowerCase(),
                    username: name || email.split('@')[0],
                    supabaseId: supabaseUid,
                },
            });
            console.log(`User successfully created in database with ID: ${user.id}`);
            return { message: 'User registered successfully', userId: user.id };
        }
        catch (dbError) {
            console.error('Database error:', dbError);
            throw dbError;
        }
    });
}
function syncUser(supabaseUid, email) {
    return __awaiter(this, void 0, void 0, function* () {
        // Find user by Supabase ID
        const user = yield db_1.default.user.findUnique({
            where: { supabaseId: supabaseUid },
        });
        if (user) {
            // User exists, update email if it changed
            if (user.email !== email.toLowerCase()) {
                yield db_1.default.user.update({
                    where: { id: user.id },
                    data: { email: email.toLowerCase() }
                });
            }
            return { userId: user.id };
        }
        // User doesn't exist in our DB, create them
        const newUser = yield db_1.default.user.create({
            data: {
                email: email.toLowerCase(),
                username: email.split('@')[0],
                supabaseId: supabaseUid,
            },
        });
        return { userId: newUser.id };
    });
}
function loginUser(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        // We'll use Supabase directly from the frontend, this is just a stub
        throw new Error('Method not implemented - use Supabase client directly');
    });
}
function logoutUser() {
    return __awaiter(this, void 0, void 0, function* () {
        // We'll use Supabase directly from the frontend, this is just a stub
        throw new Error('Method not implemented - use Supabase client directly');
    });
}
// Add this function to your service file
function linkWalletToUser(userId, walletAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield db_1.default.user.update({
                where: { id: userId },
                data: { walletAddress }
            });
            return { success: true, userId: user.id };
        }
        catch (error) {
            console.error('Error linking wallet:', error);
            throw new Error('Failed to link wallet to user');
        }
    });
}
