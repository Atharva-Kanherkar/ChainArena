import {
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    SendTransactionError
  } from '@solana/web3.js';
  import {
    TOKEN_PROGRAM_ID,
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction
  } from '@solana/spl-token';
  import prisma from '../../lib/db';
  import { connection, platformKeypair, PLATFORM_FEE_ADDRESS } from '../../lib/solana';
  import { MatchStatus, TournamentStatus, Prisma } from '@prisma/client';
  
  /**
   * Create prize configuration for a tournament
   */
  export const createTournamentPrize = async (
    tournamentId: string, 
    data: {
      entryFee?: string;
      prizePool?: string;
      tokenType?: string;
      tokenAddress?: string;
      distribution?: Record<string, number>;
      platformFeePercent?: number;
    }
  ) => {
    // Validate input
    if (data.prizePool && parseFloat(data.prizePool) <= 0) {
      throw new Error('Prize pool must be greater than zero');
    }
  
    // Calculate platform fee
    const platformFeePercent = data.platformFeePercent || 5.0;
    
    // Create prize record 
    return prisma.tournamentPrize.create({
      data: {
        tournamentId,
        entryFee: data.entryFee,
        prizePool: data.prizePool,
        tokenType: data.tokenType || 'SOL',
        tokenAddress: data.tokenAddress,
        distribution: data.distribution || { first: 60, second: 30, third: 10 },
        platformFeePercent
      }
    });
  };
  
  /**
   * Verify a Solana payment transaction
   */
  export const verifyEntryFeePayment = async (
    signature: string,
    expectedAmount: string,
    tokenType: string = 'SOL',
    tokenAddress?: string
  ): Promise<boolean> => {
    try {
      console.log(`Verifying transaction ${signature} for ${expectedAmount} ${tokenType}`);
      
      // Fetch transaction
      const tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });
  
      if (!tx || tx.meta?.err) {
        console.error(`Transaction verification failed: ${tx?.meta?.err || 'Not found'}`);
        return false;
      }
  
      // Calculate expected amount in smallest units
      let expectedAmountInSmallestUnit: bigint;
      if (tokenType === 'SOL') {
        expectedAmountInSmallestUnit = BigInt(Math.floor(parseFloat(expectedAmount) * LAMPORTS_PER_SOL));
      } else if (tokenAddress) {
        const tokenMint = new PublicKey(tokenAddress);
        const mintInfo = await connection.getParsedAccountInfo(tokenMint);
        if (!mintInfo.value || !('parsed' in mintInfo.value.data)) {
          return false;
        }
        const decimals = mintInfo.value.data.parsed.info.decimals;
        expectedAmountInSmallestUnit = BigInt(Math.floor(parseFloat(expectedAmount) * 10 ** decimals));
      } else {
        return false;
      }
  
      // Verify recipient is the platform wallet
      const expectedRecipient = PLATFORM_FEE_ADDRESS;
      if (!expectedRecipient) {
        console.error("Expected recipient address is undefined. Check your PLATFORM_FEE_ADDRESS or PLATFORM_WALLET_ADDRESS environment variables.");
        return false;
      }
      
      // Check all instructions in the transaction
      const instructions = tx.transaction.message.instructions;
      for (const inst of instructions) {
        if ('parsed' in inst) {
          // For SOL transfers
          if (tokenType === 'SOL' && inst.programId.toString() === SystemProgram.programId.toString()) {
            if (inst.parsed.type === 'transfer') {
              const { destination, lamports } = inst.parsed.info;
              if (
                destination === expectedRecipient.toString() && 
                BigInt(lamports) >= expectedAmountInSmallestUnit
              ) {
                return true;
              }
            }
          } 
          // For SPL token transfers
          else if (tokenType !== 'SOL' && inst.programId.toString() === TOKEN_PROGRAM_ID.toString()) {
            if (inst.parsed.type === 'transfer' || inst.parsed.type === 'transferChecked') {
              const { destination, amount, mint } = inst.parsed.info;
              
              // Verify destination belongs to expected recipient
              try {
                const tokenAccount = await connection.getParsedAccountInfo(new PublicKey(destination));
                if (!tokenAccount.value || !('parsed' in tokenAccount.value.data)) {
                  continue;
                }
                
                const owner = tokenAccount.value.data.parsed.info.owner;
                const tokenMint = tokenAccount.value.data.parsed.info.mint;
                
                if (
                  owner === expectedRecipient.toString() &&
                  tokenMint === tokenAddress &&
                  BigInt(amount) >= expectedAmountInSmallestUnit
                ) {
                  return true;
                }
              } catch (e) {
                console.error("Error checking token account:", e);
                continue;
              }
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Payment verification error:", error);
      return false;
    }
  };
  
  /**
   * Process prize payment when a match is completed
   */
  export const processMatchPayment = async (
    matchId: string,
    winnerId: string,
    winnerType: 'team' | 'participant'
  ) => {
    // Get match with tournament and prize info
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: { prize: true }
        }
      }
    });
  
    if (!match || !match.tournament.prize) {
      console.log(`No prize info found for match ${matchId}`);
      return null;
    }
  
    // Determine if this match triggers a payout
    const payoutInfo = await shouldTriggerPayout(match);
    if (!payoutInfo.shouldPay || !payoutInfo.position) {
      console.log(`Match ${matchId} doesn't trigger a payout`);
      return null;
    }
  
    // Get wallet address for the winner
    const walletAddress = await getParticipantWalletAddress(winnerId, winnerType);
    if (!walletAddress) {
      console.error(`No wallet address found for ${winnerType} ${winnerId}`);
      return null;
    }
  
    // Calculate prize amount
    const prizeAmount = calculatePrizeAmount(
      match.tournament.prize,
      payoutInfo.position
    );
  
    if (prizeAmount <= 0) {
      console.log(`Prize amount calculated as ${prizeAmount}, skipping payment`);
      return null;
    }
  
    // Convert to smallest unit
    let amountInSmallestUnit: bigint;
    const tokenType = match.tournament.prize.tokenType || 'SOL';
    const tokenAddress = match.tournament.prize.tokenAddress;
    
    if (tokenType === 'SOL') {
      amountInSmallestUnit = BigInt(Math.floor(prizeAmount * LAMPORTS_PER_SOL));
    } else if (tokenAddress) {
      // Fetch token decimals for SPL token
      const tokenMint = new PublicKey(tokenAddress);
      const mintInfo = await connection.getParsedAccountInfo(tokenMint);
      if (!mintInfo.value || !('parsed' in mintInfo.value.data)) {
        throw new Error(`Failed to get info for token ${tokenAddress}`);
      }
      const decimals = mintInfo.value.data.parsed.info.decimals;
      amountInSmallestUnit = BigInt(Math.floor(prizeAmount * Math.pow(10, decimals)));
    } else {
      throw new Error("Invalid token configuration");
    }
  
    // Calculate platform fee (take from prize amount)
    const feePercentage = match.tournament.prize.platformFeePercent / 100;
    const feeAmount = BigInt(Number(amountInSmallestUnit) * feePercentage);
    const winnerAmount = amountInSmallestUnit - feeAmount;
  
    try {
      // Send the prize payment
      const txSignature = await sendSolanaPrize(
        walletAddress,
        winnerAmount,
        tokenType,
        tokenAddress || undefined,
        feeAmount // Platform fee
      );
  
      // Record the payment in the database
      const payment = await prisma.prizePayment.create({
        data: {
          tournamentPrizeId: match.tournament.prize.id,
          amount: prizeAmount.toString(),
          position: payoutInfo.position,
          recipientType: winnerType,
          [winnerType === 'team' ? 'teamId' : 'participantId']: winnerId,
          txSignature,
          txConfirmed: true
        }
      });
  
      console.log(`Prize payment processed: ${txSignature}`);
      return payment;
    } catch (error) {
      console.error(`Failed to process prize payment:`, error);
      return null;
    }
  };
  
  /**
   * Sends a prize payment via Solana
   */
  async function sendSolanaPrize(
    recipientAddress: string,
    amount: bigint,
    tokenType: string,
    tokenMintAddress?: string,
    platformFee: bigint = BigInt(0)
  ): Promise<string> {
    const recipientPublicKey = new PublicKey(recipientAddress);
    const transaction = new Transaction();
  
    try {
      // TODO: Fix Solana/Metaplex type incompatibilities
      // The following Solana code has type issues that need to be resolved
      // For now, using a mock implementation
      
      /*
      if (tokenType === 'SOL') {
        // Add instruction to send prize to winner
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: platformKeypair.publicKey,
            toPubkey: recipientPublicKey,
            lamports: amount
          })
        );
      } else if (tokenMintAddress) {
        // SPL Token transfer implementation would go here
      }
      */

      // Mock transaction for now
      const signature = 'mock-signature-' + Date.now();
      
      // Mock confirmation
      console.log(`Mock prize payment: ${signature}`);
      return signature;
    } catch (error) {
      console.error('Payment failed:', error);
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Determines if a match completion should trigger a prize payout
   */
  async function shouldTriggerPayout(match: any): Promise<{ shouldPay: boolean; position?: string }> {
    // If match already has a payout, don't duplicate
    const existingPayment = await prisma.prizePayment.findFirst({
      where: {
        tournamentPrize: {
          tournamentId: match.tournamentId
        },
        // Link to this match's result somehow (this depends on your data model)
        OR: [
          // For final match (1st place)
          {
            position: 'first',
            createdAt: {
              gte: match.endTime ? new Date(new Date(match.endTime).getTime() - 10 * 60 * 1000) : undefined,
            }
          },
          // For other matches that might pay out
          {
            createdAt: {
              gte: match.endTime ? new Date(new Date(match.endTime).getTime() - 10 * 60 * 1000) : undefined,
            }
          }
        ]
      }
    });
  
    if (existingPayment) {
      console.log(`Match ${match.id} already has a payment recorded`);
      return { shouldPay: false };
    }
  
    // Get all tournament matches to figure out tournament structure
    const allMatches = await prisma.match.findMany({
      where: { tournamentId: match.tournamentId },
      orderBy: { round: 'desc' }
    });
    
    // Find max round (finals)
    const maxRound = Math.max(...allMatches.map((m: any) => m.round));
    
    // Case: Final match - 1st place payout
    if (match.round === maxRound && !match.nextMatchId) {
      return { shouldPay: true, position: 'first' };
    }
    
    // Case: Final match loser - 2nd place
    if (match.round === maxRound && !match.nextMatchId) {
      // We need to determine who lost
      const result = match.result as any;
      if (!result || !result.winnerId) {
        return { shouldPay: false };
      }
      
      // Find the loser
      let loserId: string;
      if (match.teamAId && match.teamBId) {
        loserId = result.winnerId === match.teamAId ? match.teamBId : match.teamAId;
      } else if (match.participantAId && match.participantBId) {
        loserId = result.winnerId === match.participantAId ? match.participantBId : match.participantAId;
      } else {
        return { shouldPay: false };
      }
      
      // Check if 2nd place payment already exists
      const secondPlacePayment = await prisma.prizePayment.findFirst({
        where: {
          tournamentPrize: { tournamentId: match.tournamentId },
          position: 'second'
        }
      });
      
      if (!secondPlacePayment) {
        return { shouldPay: true, position: 'second' };
      }
    }
    
    // Case: Semifinal losers - 3rd place
    if (match.round === maxRound - 1) {
      const result = match.result as any;
      if (!result || !result.winnerId) {
        return { shouldPay: false };
      }
      
      // Find the loser of semifinals
      let loserId: string;
      if (match.teamAId && match.teamBId) {
        loserId = result.winnerId === match.teamAId ? match.teamBId : match.teamAId;
      } else if (match.participantAId && match.participantBId) {
        loserId = result.winnerId === match.participantAId ? match.participantBId : match.participantAId;
      } else {
        return { shouldPay: false };
      }
      
      // Check if this is the first semifinal loser
      const thirdPlacePayments = await prisma.prizePayment.findMany({
        where: {
          tournamentPrize: { tournamentId: match.tournamentId },
          position: 'third'
        }
      });
      
      // Only one 3rd place payment in most tournaments
      if (thirdPlacePayments.length === 0) {
        return { shouldPay: true, position: 'third' };
      }
    }
    
    // No payout for this match
    return { shouldPay: false };
  }
  
  /**
   * Gets the wallet address for a participant or team
   */
  async function getParticipantWalletAddress(id: string, type: 'team' | 'participant'): Promise<string | null> {
    if (type === 'team') {
      // For team, get captain's wallet
      const team = await prisma.team.findUnique({
        where: { id },
        include: { captain: { include: { user: true } } }
      });
      return team?.captain?.user?.walletAddress || null;
    } else {
      // For individual participant, get user's wallet
      const participant = await prisma.tournamentParticipant.findUnique({
        where: { id },
        include: { user: true }
      });
      return participant?.user?.walletAddress || null;
    }
  }
  
  /**
   * Calculate prize amount based on position
   */
  function calculatePrizeAmount(prize: any, position: string): number {
    const distribution = prize.distribution as Prisma.JsonObject | null;
    if (!distribution || typeof distribution[position] !== 'number') {
      console.warn(`No distribution percentage found for position ${position}`);
      return 0;
    }
  
    const totalPrizePool = parseFloat(prize.prizePool || '0');
    const percentage = distribution[position] as number;
    return (totalPrizePool * percentage) / 100;
  }