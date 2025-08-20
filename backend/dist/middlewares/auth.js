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
exports.authenticate = void 0;
exports.authenticateSupabase = authenticateSupabase;
const supabase_1 = require("../lib/supabase");
const db_1 = __importDefault(require("../lib/db"));
function authenticateSupabase(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Get token from Authorization header
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            if (!token) {
                res.status(401).json({ error: 'No token provided' });
                return;
            }
            // Verify the token with Supabase
            const { data: { user }, error } = yield supabase_1.supabase.auth.getUser(token);
            if (error || !user) {
                res.status(401).json({ error: 'Invalid or expired token' });
                return;
            }
            // Find the user in our database
            const dbUser = yield db_1.default.user.findUnique({
                where: { supabaseId: user.id },
            });
            if (!dbUser) {
                res.status(401).json({ error: 'User not found in system' });
                return;
            }
            // Attach user to request
            req.user = dbUser;
            next();
        }
        catch (error) {
            console.error('Authentication error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    });
}
// Legacy middleware - renamed to indicate it should be replaced
exports.authenticate = authenticateSupabase;
