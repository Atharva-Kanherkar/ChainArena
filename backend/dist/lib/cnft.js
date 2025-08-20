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
exports.mintAchievementNft = mintAchievementNft;
const mpl_bubblegum_1 = require("@metaplex-foundation/mpl-bubblegum");
const umi_1 = require("@metaplex-foundation/umi");
const umi_uploader_nft_storage_1 = require("@metaplex-foundation/umi-uploader-nft-storage");
const solana_1 = require("./solana");
const db_1 = __importDefault(require("./db"));
// Remove bs58 import: import bs58 from 'bs58';
// --- Configuration ---
const NFT_STORAGE_TOKEN = process.env.NFT_STORAGE_TOKEN;
const MERKLE_TREE_ADDRESS_STR = process.env.MERKLE_TREE_ADDRESS;
const COLLECTION_MINT_ADDRESS_STR = process.env.COLLECTION_MINT_ADDRESS;
// --- End Configuration ---
let umi = solana_1.umi;
// Validate required configuration for cNFTs
if (!MERKLE_TREE_ADDRESS_STR || MERKLE_TREE_ADDRESS_STR === "YOUR_MERKLE_TREE_PUBLIC_KEY" ||
    !COLLECTION_MINT_ADDRESS_STR || COLLECTION_MINT_ADDRESS_STR === "YOUR_COLLECTION_NFT_MINT_PUBLIC_KEY") {
    console.error("CRITICAL: MERKLE_TREE_ADDRESS or COLLECTION_MINT_ADDRESS not configured in .env. cNFT features will be disabled.");
}
const MERKLE_TREE_ADDRESS = (MERKLE_TREE_ADDRESS_STR && MERKLE_TREE_ADDRESS_STR !== "YOUR_MERKLE_TREE_PUBLIC_KEY")
    ? (0, umi_1.publicKey)(MERKLE_TREE_ADDRESS_STR) : null;
const COLLECTION_MINT_ADDRESS = (COLLECTION_MINT_ADDRESS_STR && COLLECTION_MINT_ADDRESS_STR !== "YOUR_COLLECTION_NFT_MINT_PUBLIC_KEY")
    ? (0, umi_1.publicKey)(COLLECTION_MINT_ADDRESS_STR) : null;
// Add Bubblegum plugin
umi = umi.use((0, mpl_bubblegum_1.mplBubblegum)());
// Add NFT.Storage uploader if token is provided and valid
if (NFT_STORAGE_TOKEN && NFT_STORAGE_TOKEN !== "YOUR_NFT_STORAGE_API_KEY") {
    try {
        umi = umi.use((0, umi_uploader_nft_storage_1.nftStorageUploader)({ token: NFT_STORAGE_TOKEN }));
        console.log("NFT.Storage uploader configured.");
    }
    catch (e) {
        console.error("Failed to initialize NFT.Storage uploader (check token validity):", e);
    }
}
else {
    console.warn("NFT_STORAGE_TOKEN not found or is placeholder in .env. Metadata upload will fail.");
}
/**
 * Uploads metadata for the achievement NFT.
 */
function uploadMetadata(achievementType, tournamentName) {
    return __awaiter(this, void 0, void 0, function* () {
        // ... (keep existing uploadMetadata function) ...
        if (!umi.uploader) {
            throw new Error("Metadata uploader (NFT.Storage) is not configured or failed to initialize.");
        }
        console.log(`Uploading metadata for ${achievementType} - ${tournamentName}`);
        const metadata = {
            name: `${achievementType} - ${tournamentName}`,
            description: `Awarded for achieving ${achievementType} in the ${tournamentName} tournament.`,
            image: "https://via.placeholder.com/300.png/09f/fff?text=Achievement", // Placeholder Image
            attributes: [
                { trait_type: "Achievement Type", value: achievementType },
                { trait_type: "Tournament", value: tournamentName },
                { trait_type: "Platform", value: "Your Game Platform" },
            ],
            properties: {
                files: [{ uri: "https://via.placeholder.com/300.png/09f/fff?text=Achievement", type: "image/png" }],
                category: "image",
            },
        };
        try {
            const metadataUri = yield umi.uploader.uploadJson(metadata);
            console.log("Metadata uploaded:", metadataUri);
            return metadataUri;
        }
        catch (error) {
            console.error("Failed to upload metadata:", error);
            throw new Error(`Failed to upload achievement metadata: ${error instanceof Error ? error.message : error}`);
        }
    });
}
/**
 * Mints a compressed NFT achievement to a recipient.
 */
function mintAchievementNft(recipientAddress, achievementType, tournamentName, tournamentId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!MERKLE_TREE_ADDRESS || !COLLECTION_MINT_ADDRESS) {
            console.error("Cannot mint achievement: Merkle Tree or Collection Mint Address is not configured.");
            return null;
        }
        if (umi.identity.publicKey !== solana_1.platformKeypair.publicKey) {
            console.error("Cannot mint achievement: Platform keypair mismatch or not loaded correctly.");
            return null;
        }
        try {
            const recipient = (0, umi_1.publicKey)(recipientAddress);
            // 1. Upload Metadata
            const metadataUri = yield uploadMetadata(achievementType, tournamentName);
            // 2. Mint the cNFT
            console.log(`Minting ${achievementType} cNFT for ${recipientAddress} to tree ${MERKLE_TREE_ADDRESS}...`);
            const mintResult = yield (0, mpl_bubblegum_1.mintToCollectionV1)(umi, {
                leafOwner: recipient,
                merkleTree: MERKLE_TREE_ADDRESS,
                collectionMint: COLLECTION_MINT_ADDRESS,
                metadata: {
                    name: `${achievementType} - ${tournamentName}`,
                    uri: metadataUri,
                    sellerFeeBasisPoints: 0,
                    collection: { key: COLLECTION_MINT_ADDRESS, verified: true },
                    creators: [
                        { address: umi.identity.publicKey, verified: true, share: 100 },
                    ],
                },
            }).sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });
            // --- FIX: Encode signature as hex string ---
            // Convert Uint8Array signature to hex string
            const signatureHex = Buffer.from(mintResult.signature).toString('hex');
            console.log("Mint successful. Signature (Hex):", signatureHex);
            // 3. Get Asset ID (Placeholder using Hex Signature)
            const placeholderMintAddress = `sig_hex:${signatureHex}`; // Use hex signature
            // --- End FIX ---
            console.warn(`Storing placeholder mint address: ${placeholderMintAddress}. Implement DAS API lookup for actual assetId.`);
            // 4. Save to DB
            try {
                yield db_1.default.achievement.create({
                    data: {
                        userId,
                        tournamentId,
                        type: achievementType,
                        mintAddress: placeholderMintAddress,
                        metadataUri: metadataUri,
                    }
                });
                console.log(`Achievement record saved to DB for user ${userId}, tournament ${tournamentId}`);
            }
            catch (dbError) {
                console.error(`Failed to save achievement to DB for user ${userId}:`, dbError);
            }
            return placeholderMintAddress;
        }
        catch (error) {
            console.error(`Failed to mint achievement NFT for ${recipientAddress}:`, error);
            if (error instanceof Error && error.message.includes("owner does not have required")) {
                console.error("Potential issue: Platform wallet might not be the collection/tree authority.");
            }
            return null;
        }
    });
}
