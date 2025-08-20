"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_FEE_ADDRESS = exports.PLATFORM_WALLET_ADDRESS = exports.platformWeb3Keypair = exports.platformKeypair = exports.umi = exports.connection = void 0;
const web3_js_1 = require("@solana/web3.js");
const umi_bundle_defaults_1 = require("@metaplex-foundation/umi-bundle-defaults");
const umi_1 = require("@metaplex-foundation/umi");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Remove bs58 import: import bs58 from 'bs58';
// Load environment variables
dotenv_1.default.config();
// Determine RPC endpoint based on environment
const SOLANA_NETWORK = (process.env.SOLANA_NETWORK || 'devnet');
const rpcEndpoint = process.env.SOLANA_RPC_ENDPOINT || (0, web3_js_1.clusterApiUrl)(SOLANA_NETWORK);
// Initialize Solana web3.js connection
exports.connection = new web3_js_1.Connection(rpcEndpoint, 'confirmed');
console.log(`Web3.js Connected to Solana ${SOLANA_NETWORK} at ${rpcEndpoint}`);
// --- Initialize Keypairs (Both Web3.js and Umi) ---
let platformWeb3Keypair;
let platformUmiKeypair;
// Function to load/generate dev keypair (returns web3.js Keypair)
const getDevKeypair = () => {
    try {
        const devKeypairPath = path_1.default.join(__dirname, '..', '..', 'dev-keypair.json');
        if (fs_1.default.existsSync(devKeypairPath)) {
            const secretKeyString = fs_1.default.readFileSync(devKeypairPath, 'utf-8');
            const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
            return web3_js_1.Keypair.fromSecretKey(secretKey);
        }
        console.log('Generating a new development keypair...');
        const newKeypair = web3_js_1.Keypair.generate();
        fs_1.default.writeFileSync(devKeypairPath, JSON.stringify(Array.from(newKeypair.secretKey)), 'utf-8');
        console.log(`Development keypair saved to ${devKeypairPath}`);
        return newKeypair;
    }
    catch (error) {
        console.error('Error creating/loading dev keypair:', error);
        return web3_js_1.Keypair.generate(); // Fallback
    }
};
// --- Create a temporary Umi instance JUST for keypair creation ---
const tempUmi = (0, umi_bundle_defaults_1.createUmi)(rpcEndpoint);
try {
    const secretString = process.env.PLATFORM_KEYPAIR_SECRET;
    let secretKeyBytes = null;
    if (secretString) {
        console.log("Attempting to load platform keypair from environment (JSON array format ONLY)...");
        // --- Simplified Logic: Only parse JSON array ---
        if (secretString.trim().startsWith('[') && secretString.trim().endsWith(']')) {
            try {
                const parsedArray = JSON.parse(secretString);
                if (Array.isArray(parsedArray) && parsedArray.length === 64 && parsedArray.every(n => typeof n === 'number' && n >= 0 && n <= 255)) {
                    secretKeyBytes = new Uint8Array(parsedArray);
                }
                else {
                    throw new Error('Invalid JSON array format or length (expected 64 numbers).');
                }
            }
            catch (jsonError) {
                console.error("Failed to parse PLATFORM_KEYPAIR_SECRET as JSON array:", jsonError);
                // No fallback to bs58
            }
        }
        else {
            console.error("PLATFORM_KEYPAIR_SECRET is not in the expected JSON array format (e.g., [1,2,3,...]).");
        }
        // --- End Simplified Logic ---
        if (secretKeyBytes) {
            exports.platformWeb3Keypair = platformWeb3Keypair = web3_js_1.Keypair.fromSecretKey(secretKeyBytes);
            exports.platformKeypair = platformUmiKeypair = tempUmi.eddsa.createKeypairFromSecretKey(secretKeyBytes);
            console.log(`Platform wallet initialized from environment: ${platformWeb3Keypair.publicKey.toString()}`);
        }
        else {
            throw new Error("Failed to derive secret key bytes from PLATFORM_KEYPAIR_SECRET.");
        }
    }
    else if (process.env.NODE_ENV !== 'production') {
        console.warn("⚠️ PLATFORM_KEYPAIR_SECRET not found. Using a development keypair.");
        exports.platformWeb3Keypair = platformWeb3Keypair = getDevKeypair();
        exports.platformKeypair = platformUmiKeypair = tempUmi.eddsa.createKeypairFromSecretKey(platformWeb3Keypair.secretKey);
        console.log(`Using development platform wallet: ${platformWeb3Keypair.publicKey.toString()}`);
    }
    else {
        throw new Error("PLATFORM_KEYPAIR_SECRET is required in production mode");
    }
}
catch (error) {
    console.error("CRITICAL: Failed to initialize platform keypair:", error);
    if (process.env.NODE_ENV !== 'production') {
        console.warn("⚠️ Falling back to a random keypair for development. MINTING WILL LIKELY FAIL.");
        exports.platformWeb3Keypair = platformWeb3Keypair = web3_js_1.Keypair.generate();
        exports.platformKeypair = platformUmiKeypair = tempUmi.eddsa.createKeypairFromSecretKey(platformWeb3Keypair.secretKey);
        console.log(`Random platform wallet: ${platformWeb3Keypair.publicKey.toString()}`);
    }
    else {
        process.exit(1); // Exit if keypair fails in production
    }
}
// --- Initialize MAIN Umi Instance ---
exports.umi = (0, umi_bundle_defaults_1.createUmi)(rpcEndpoint)
    .use((0, umi_1.keypairIdentity)(platformUmiKeypair));
console.log(`Umi instance initialized for wallet: ${exports.umi.identity.publicKey}`);
exports.PLATFORM_WALLET_ADDRESS = platformWeb3Keypair.publicKey.toString();
exports.PLATFORM_FEE_ADDRESS = process.env.PLATFORM_FEE_ADDRESS || exports.PLATFORM_WALLET_ADDRESS;
