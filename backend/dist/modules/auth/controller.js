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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkWallet = exports.walletAuth = exports.logout = exports.login = exports.sync = exports.register = void 0;
const service = __importStar(require("./service"));
const db_1 = __importDefault(require("../../lib/db"));
const web3_js_1 = require("@solana/web3.js");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Add JwtPayload here
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = require("../../lib/supabase");
dotenv_1.default.config();
dotenv_1.default.config();
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, supabase_uid } = req.body;
        if (!email || !supabase_uid) {
            res.status(400).json({ error: 'Email and Supabase ID are required' });
            return;
        }
        const result = yield service.registerUser(email, name, supabase_uid);
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Registration error:', error);
        // Ensure a JSON response is always sent on error
        const statusCode = error.status || 500; // Use error status if available, else 500
        const message = error.message || 'An unexpected error occurred during registration.';
        // Check if it looks like a Supabase rate limit error specifically
        if (typeof error.message === 'string' && error.message.includes('rate limit')) {
            res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
        }
        else {
            res.status(statusCode).json({ error: message });
        }
    }
});
exports.register = register;
const sync = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, email } = req.body;
        if (!user_id || !email) {
            res.status(400).json({ error: 'User ID and email are required' });
            return;
        }
        const result = yield service.syncUser(user_id, email);
        res.json(result);
    }
    catch (error) {
        console.error('User sync error:', error);
        res.status(500).json({ error: error.message || 'User sync failed' });
    }
});
exports.sync = sync;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(400).json({ error: 'Use Supabase client directly for authentication' });
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(400).json({ error: 'Use Supabase client directly for authentication' });
});
exports.logout = logout;
const walletAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { wallet_address, signature, message, nonce } = req.body;
        if (!wallet_address || !signature || !message) {
            res.status(400).json({ error: 'Wallet address, signature and message are required' });
            return;
        }
        // Verify signature here (this requires Solana web3.js)
        // This is pseudo-code - implement the actual verification
        const isSignatureValid = yield verifySignature(wallet_address, signature, message);
        if (!isSignatureValid) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }
        // Check if wallet already exists in your database
        const existingUser = yield db_1.default.user.findFirst({
            where: { walletAddress: wallet_address }
        });
        if (existingUser) {
            // Generate a session for existing user
            // This is where you would create a Supabase session or JWT
            const token = generateToken(existingUser);
            res.status(200).json({ token, userId: existingUser.id });
            return;
        }
        // For new wallets, generate a temporary token for email connection
        const tempToken = generateTempToken(wallet_address);
        res.status(200).json({
            token: tempToken,
            isNewUser: true
        });
    }
    catch (error) {
        console.error('Wallet authentication error:', error);
        res.status(500).json({ error: error.message || 'Wallet authentication failed' });
    }
});
exports.walletAuth = walletAuth;
// Verify Solana wallet signature
function verifySignature(walletAddress, signature, message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const publicKey = new web3_js_1.PublicKey(walletAddress);
            // Convert base64 signature to Uint8Array
            const signatureUint8 = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
            // Convert message to Uint8Array
            const messageUint8 = new TextEncoder().encode(message);
            // Verify the signature
            return tweetnacl_1.default.sign.detached.verify(messageUint8, signatureUint8, publicKey.toBytes());
        }
        catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    });
}
// Generate JWT for authenticated user
function generateToken(user) {
    const payload = {
        walletAddress: user.walletAddress,
        userId: user.id
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
}
// Generate temporary token for wallet connection flow
function generateTempToken(walletAddress) {
    const payload = {
        walletAddress,
        temp: true
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
}
// Add this function to link wallet to existing email account
const linkWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tempToken, email, password } = req.body;
        if (!tempToken || !email || !password) {
            res.status(400).json({ error: 'Token, email and password are required' });
            return;
        }
        // Verify the temporary token
        let decodedToken;
        try {
            const verifiedToken = jsonwebtoken_1.default.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
            // Type guard to ensure it's an object with walletAddress
            if (typeof verifiedToken === 'string' || !('walletAddress' in verifiedToken)) {
                res.status(401).json({ error: 'Invalid token format' });
                return;
            }
            decodedToken = verifiedToken;
        }
        catch (error) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        if (!decodedToken.walletAddress || !decodedToken.temp) {
            res.status(401).json({ error: 'Invalid token type' });
            return;
        }
        // Authenticate user with Supabase
        const { data: { user }, error } = yield supabase_1.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error || !user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        // Find the user in our database
        const dbUser = yield db_1.default.user.findUnique({
            where: { supabaseId: user.id }
        });
        if (!dbUser) {
            res.status(401).json({ error: 'User not found in system' });
            return;
        }
        // Link wallet to user
        yield service.linkWalletToUser(dbUser.id, decodedToken.walletAddress);
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Wallet linking error:', error);
        res.status(500).json({ error: error.message || 'Failed to link wallet' });
    }
});
exports.linkWallet = linkWallet;
