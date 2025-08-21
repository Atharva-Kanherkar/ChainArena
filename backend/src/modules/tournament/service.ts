 
import prisma from '../../lib/db';
import {
  CreateTournamentData,
  UpdateTournamentData,
  TournamentStatus,
  TournamentFormat,
  TournamentWithDetails,
  TournamentWithHost,
  PaginatedResult
} from './types';
import { Prisma, Tournament } from '@prisma/client';
// Assuming prizeService might be used elsewhere, but not needed for this specific fix
// import * as prizeService from '../prize/service';

// Helper function to map Prisma result to desired output type
function mapToTournamentWithDetails(tournament: any): TournamentWithDetails {
  // Ensure this function correctly handles the 'prize' field if it exists
  return {
    id: tournament.id,
    name: tournament.name,
    description: tournament.description,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
    status: tournament.status,
    format: tournament.format,
    registrationDeadline: tournament.registrationDeadline,
    host: tournament.host, // Assuming host is included
    hostId: tournament.hostId,
    minParticipants: tournament.minParticipants,
    maxParticipants: tournament.maxParticipants,
    teamSize: tournament.teamSize,
    isTeamBased: tournament.isTeamBased,
    _count: tournament._count, // Assuming _count is included
    prize: tournament.prize || null, // Pass prize if included, otherwise null
    // Add missing required fields with defaults
    participants: tournament.participants || [],
    teams: tournament.teams || [],
    spectators: tournament.spectators || [],
    matches: tournament.matches || [],
    achievements: tournament.achievements || []
  };
}

export const createTournament = async (
  userId: string,
  // Ensure CreateTournamentData includes optional prize fields from your form
  // e.g., entryFee?: string | number; tokenType?: string; tokenAddress?: string; prizePool?: string; distribution?: any; platformFeePercent?: number;
  data: CreateTournamentData
): Promise<TournamentWithDetails> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Separate prize data from main tournament data
  // Adjust these field names based on what you actually send from the frontend
  const {
    entryFee,
    tokenType,
    tokenAddress,
    prizePool,
    distribution,
    platformFeePercent,
    ...mainTournamentData // Rest of the data for the Tournament model
  } = data;

  // Prepare main tournament data, applying defaults and conversions
  const tournamentData = {
    name: mainTournamentData.name,
    description: mainTournamentData.description,
    startDate: mainTournamentData.startDate ? new Date(mainTournamentData.startDate) : null,
    endDate: mainTournamentData.endDate ? new Date(mainTournamentData.endDate) : null,
    hostId: userId,
    status: mainTournamentData.status || TournamentStatus.DRAFT, // Use enum
    format: mainTournamentData.format || 'SINGLE_ELIMINATION',
    maxParticipants: mainTournamentData.maxParticipants ? parseInt(String(mainTournamentData.maxParticipants), 10) : null,
    minParticipants: mainTournamentData.minParticipants ? parseInt(String(mainTournamentData.minParticipants), 10) : null,
    teamSize: mainTournamentData.teamSize ? parseInt(String(mainTournamentData.teamSize), 10) : null,
    isTeamBased: mainTournamentData.isTeamBased ?? false,
    registrationDeadline: mainTournamentData.registrationDeadline ? new Date(mainTournamentData.registrationDeadline) : null
    // organizerId is missing in your schema snippet for Tournament, add if needed
  };

  // Use a transaction to create both Tournament and TournamentPrize atomically
  const createdTournament = await prisma.$transaction(async (tx: any) => {
    // Step 1: Create the main tournament record
    const newTournament = await tx.tournament.create({
      data: tournamentData,
      // Include necessary relations needed immediately or for return type consistency *within* transaction if possible
      // Note: Including relations here might not always reflect subsequent creations within the same transaction easily.
      include: {
        host: { select: { id: true, username: true, avatar: true } },
        _count: { select: { participants: true, teams: true, spectators: true } }
      }
    });

    // Step 2: Check if prize data exists and is valid (e.g., entryFee > 0 or prizePool exists)
    const feeAmount = entryFee ? parseFloat(String(entryFee)) : 0; // Ensure it's a number
    const hasPrizePool = prizePool && String(prizePool).trim() !== '';

    // Only create prize record if there's a valid entry fee or a prize pool specified
    if (feeAmount > 0 || hasPrizePool) {
      await tx.tournamentPrize.create({
        data: {
          tournamentId: newTournament.id, // Link to the created tournament
          // Store entryFee as string or null, matching schema `String?`
          entryFee: feeAmount > 0 ? String(feeAmount) : null,
          // Default to SOL if not provided, matching schema `@default("SOL")`
          tokenType: tokenType || 'SOL',
          // Only store tokenAddress if tokenType is SPL (adjust if other types need it)
          tokenAddress: (tokenType && tokenType !== 'SOL') ? tokenAddress : null,
          // Store prizePool as string or null, matching schema `String?`
          prizePool: hasPrizePool ? String(prizePool) : null,
          // Use null for optional Json fields if null/undefined
          distribution: distribution || null,
          // Use provided fee or default from schema `@default(5.0)`
          platformFeePercent: platformFeePercent ?? 5.0
          // escrowAddress, escrowSignature can be added later if needed
        }
      });
    }

    // Return the tournament created in Step 1
    // Note: This object might not have the 'prize' field populated yet within the transaction context
    return newTournament;
  });

  // Step 3: Fetch the tournament again *outside* the transaction to ensure all relations (including prize) are loaded
  const tournamentWithDetails = await prisma.tournament.findUnique({
      where: { id: createdTournament.id },
      include: {
          host: { select: { id: true, username: true, avatar: true } },
          _count: { select: { participants: true, teams: true, spectators: true } },
          prize: true // <<< Crucial: Include the prize data
      }
  });

  // Should not happen if transaction succeeded and findUnique works, but good practice
  if (!tournamentWithDetails) {
      throw new Error("Failed to retrieve tournament details after creation.");
  }

  // Map the fully populated object for the final return value
  return mapToTournamentWithDetails(tournamentWithDetails);
};


// --- REST OF YOUR SERVICE FILE ---
// (getTournaments, getTournamentById, updateTournament, etc.)

export const getTournaments = async (
  page = 1,
  limit = 10,
  search?: string,
  status?: TournamentStatus
): Promise<PaginatedResult<TournamentWithDetails>> => {
  const skip = (page - 1) * limit;

  // Build where clause for filtering
  let whereClause: Prisma.TournamentWhereInput = {};

  if (search) {
    whereClause = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    };
  }

  if (status) {
    // Ensure status is part of the where clause if provided
    whereClause.status = status;
  }

  const [tournaments, totalCount] = await Promise.all([
    prisma.tournament.findMany({
      where: whereClause,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            participants: true,
            teams: true,
            spectators: true
          }
        },
        prize: true // <<< ADD THIS: Include prize info in list view as well
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tournament.count({ where: whereClause })
  ]);

  return {
    items: tournaments.map(mapToTournamentWithDetails),
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
};

// getTournamentById already includes prize: true, which is correct.
export const getTournamentById = async (id: string): Promise<TournamentWithDetails | null> => {
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      host: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      _count: {
        select: {
          participants: true,
          teams: true,
          spectators: true
        }
      },
      prize: true // Already correct
    }
  });

  return tournament ? mapToTournamentWithDetails(tournament) : null;
};


// updateTournament might also need to handle prize updates using upsert
export const updateTournament = async (
  id: string,
  userId: string,
  // Ensure UpdateTournamentData includes optional prize fields
  data: UpdateTournamentData
): Promise<TournamentWithDetails> => {
  // Check if tournament exists and user is host
  const tournament = await prisma.tournament.findFirst({
    where: {
      id,
      hostId: userId
    }
  });

  if (!tournament) {
    throw new Error('Tournament not found or you are not the host');
  }

  // Separate prize data from main tournament data
  const {
    entryFee,
    tokenType,
    tokenAddress,
    prizePool,
    distribution,
    platformFeePercent,
    ...mainTournamentData
  } = data;

  // Handle date conversions for main data
  const updateTournamentPayload: Prisma.TournamentUpdateInput = {
    ...mainTournamentData, // Include fields like name, description, etc. if they are in mainTournamentData
    startDate: mainTournamentData.startDate !== undefined
      ? (mainTournamentData.startDate ? new Date(mainTournamentData.startDate) : null)
      : undefined,
    endDate: mainTournamentData.endDate !== undefined
      ? (mainTournamentData.endDate ? new Date(mainTournamentData.endDate) : null)
      : undefined,
    registrationDeadline: mainTournamentData.registrationDeadline !== undefined
      ? (mainTournamentData.registrationDeadline ? new Date(mainTournamentData.registrationDeadline) : null)
      : undefined,
    // Add other main tournament fields that can be updated
    maxParticipants: mainTournamentData.maxParticipants !== undefined ? parseInt(String(mainTournamentData.maxParticipants), 10) : undefined,
    minParticipants: mainTournamentData.minParticipants !== undefined ? parseInt(String(mainTournamentData.minParticipants), 10) : undefined,
    teamSize: mainTournamentData.teamSize !== undefined ? parseInt(String(mainTournamentData.teamSize), 10) : undefined,
    isTeamBased: mainTournamentData.isTeamBased,
    format: mainTournamentData.format,
    status: mainTournamentData.status,
  };


 // ... inside updateTournament ...

  // Use transaction for updating tournament and potentially prize
  const updatedTournament = await prisma.$transaction(async (tx: any) => {
    // Step 1: Update the main tournament record
    const updatedMainTournament = await tx.tournament.update({
        where: { id },
        data: updateTournamentPayload,
        include: { // Include relations needed for the final return object
            host: { select: { id: true, username: true, avatar: true } },
            _count: { select: { participants: true, teams: true, spectators: true } }
        }
    });

    // Step 2: Check if any prize data was provided in the update
    const hasPrizeData = entryFee !== undefined || tokenType !== undefined || tokenAddress !== undefined || prizePool !== undefined || distribution !== undefined || platformFeePercent !== undefined;

    if (hasPrizeData) {
        // Prepare prize data for upsert - Build the update object conditionally
        const prizeUpdateData: Prisma.TournamentPrizeUpdateInput = {}; // Initialize empty update object

        if (entryFee !== undefined) {
            const feeAmount = parseFloat(String(entryFee));
            // Explicitly set to string if > 0, otherwise set to null to clear it
            prizeUpdateData.entryFee = feeAmount > 0 ? String(feeAmount) : null;
        }
        if (tokenType !== undefined) {
          if (tokenType === null) {
              // tokenType is required in DB with a default. Cannot set to null.
              // Option: Ignore the attempt to set to null.
              console.warn(`Attempted to set tokenType to null during prize update for tournament ${id}. Ignoring.`);
          } else {
              // tokenType is a non-null string, assign it.
              prizeUpdateData.tokenType = tokenType;
          }
      }
        if (tokenAddress !== undefined) {
             // Only allow setting if tokenType is not SOL (or handle based on your logic)
             // This assumes tokenType might also be changing in the same update
            prizeUpdateData.tokenAddress = tokenAddress;
        }
        if (prizePool !== undefined) {
            // Explicitly set to string if not empty, otherwise set to null to clear it
            prizeUpdateData.prizePool = (prizePool && String(prizePool).trim() !== '') ? String(prizePool) : null;
        }
        if (distribution !== undefined) {
            // Set to the provided value, using null if input is null/undefined
            prizeUpdateData.distribution = distribution || null;
        }
        if (platformFeePercent !== undefined) {
            // Ensure it's not null if the schema doesn't allow null
            prizeUpdateData.platformFeePercent = platformFeePercent ?? 5.0; // Use default if null provided? Or throw error? Check schema default.
        }

        // Use upsert: update existing prize record or create if it doesn't exist
        await tx.tournamentPrize.upsert({
            where: { tournamentId: id }, // Unique identifier
            create: { // Data if creating new - ensure this matches schema defaults/requirements
                tournamentId: id,
                entryFee: (entryFee !== undefined && parseFloat(String(entryFee)) > 0) ? String(entryFee) : null,
                tokenType: tokenType || 'SOL', // Default from schema
                tokenAddress: (tokenType && tokenType !== 'SOL') ? tokenAddress : null, // Use provided or null
                prizePool: (prizePool !== undefined && String(prizePool).trim() !== '') ? String(prizePool) : null,
                distribution: distribution || null,
                platformFeePercent: platformFeePercent ?? 5.0 // Default from schema
            },
            update: prizeUpdateData // Data if updating existing - now conditionally built
        });
    }

    return updatedMainTournament; // Return the updated main tournament from step 1
});

// ... rest of the function ...

  // Step 3: Fetch again outside transaction to ensure prize is included
  const finalTournament = await prisma.tournament.findUnique({
      where: { id: updatedTournament.id },
      include: {
          host: { select: { id: true, username: true, avatar: true } },
          _count: { select: { participants: true, teams: true, spectators: true } },
          prize: true // Include the potentially updated/created prize
      }
  });

  if (!finalTournament) {
      throw new Error("Failed to retrieve tournament details after update.");
  }

  return mapToTournamentWithDetails(finalTournament);
};


// ... (rest of your service functions: deleteTournament, updateTournamentStatus, registerParticipant, etc.) ...

// Ensure registerParticipant correctly uses the included prize data
export const registerParticipant = async (
  tournamentId: string,
  userId: string,
  entryFeeTx?: string // Optional transaction signature
) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      prize: true, // Correctly included
      participants: { // Optimization: only count or check existence if needed
        where: { userId } // Check if this specific user is already a participant
      },
      _count: { // Get total participant count separately if needed for max check
          select: { participants: true }
      }
    }
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
    throw new Error('Tournament registration is not open');
  }

  // Use _count for checking max participants
  if (tournament.maxParticipants && tournament._count?.participants && tournament._count.participants >= tournament.maxParticipants) {
    throw new Error('Tournament has reached maximum participants');
  }

  // Check if user is already registered (using the filtered include)
  if (tournament.participants.length > 0) {
    throw new Error('You are already registered for this tournament');
  }

  // Check if entry fee is required using the included prize data
  const feeRequired = tournament.prize?.entryFee && parseFloat(tournament.prize.entryFee) > 0;

  if (feeRequired) {
    if (!entryFeeTx) {
      throw new Error('Entry fee payment transaction is required for this tournament');
    }

    // Placeholder for actual verification logic - replace with your implementation
    // This likely involves calling a Solana RPC method to check the transaction details
    // const entryFeeVerified = await prizeService.verifyEntryFeePayment(...);
    const entryFeeVerified = true; // <-- Replace with actual verification call

    if (!entryFeeVerified) {
      throw new Error('Entry fee payment verification failed');
    }
  }
  // No 'else' needed here for entryFeeVerified, as it's only relevant if feeRequired is true

  // Create participant record
  const participant = await prisma.tournamentParticipant.create({
    data: {
      userId,
      tournamentId,
      // Only store entryFeeTx if a fee was required and presumably verified
      entryFeeTx: feeRequired ? entryFeeTx : null
    },
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

  return participant;
};

// ... (rest of the file) ...
export const unregisterParticipant = async (
  tournamentId: string, 
  userId: string
): Promise<void> => {
  // Check if tournament exists and is still in registration phase
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      OR: [
        { status: 'REGISTRATION_OPEN' },
        { status: 'REGISTRATION_CLOSED' }
      ]
    }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found or registration phase has ended');
  }
  
  // Check if participant exists
  const participant = await prisma.tournamentParticipant.findUnique({
    where: {
      userId_tournamentId: {
        userId,
        tournamentId
      }
    },
    include: {
      team: {
        include: {
          captain: true
        }
      }
    }
  });
  
  if (!participant) {
    throw new Error('You are not registered for this tournament');
  }
  
  // If participant is a team captain, prevent unregistration
  if (participant.team && participant.team.captain.userId === userId) {
    throw new Error('Team captains cannot unregister. Transfer captaincy first or delete the team.');
  }
  
  // Delete the participation record
  await prisma.tournamentParticipant.delete({
    where: {
      userId_tournamentId: {
        userId,
        tournamentId
      }
    }
  });
};

export const addSpectator = async (
  tournamentId: string, 
  userId: string
): Promise<void> => {
  // Check if tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  // Add spectator connection
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      spectators: {
        connect: { id: userId }
      }
    }
  });
};

export const removeSpectator = async (
  tournamentId: string, 
  userId: string
): Promise<void> => {
  // Check if tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  // Remove spectator connection
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      spectators: {
        disconnect: { id: userId }
      }
    }
  });
};

export const getTournamentParticipants = async (
  tournamentId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResult<any>> => {
  const skip = (page - 1) * limit;
  
  // Check if tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  const [participants, totalCount] = await Promise.all([
    prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        team: {
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
    prisma.tournamentParticipant.count({ where: { tournamentId } })
  ]);
  
  return {
    items: participants,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
};

export const getTournamentTeams = async (
  tournamentId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResult<any>> => {
  const skip = (page - 1) * limit;
  
  // Check if tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  const [teams, totalCount] = await Promise.all([
    prisma.team.findMany({
      where: { tournamentId },
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
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.team.count({ where: { tournamentId } })
  ]);
  
  return {
    items: teams,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
};

export const getUserHostedTournaments = async (
  userId: string,
  page = 1,
  limit = 10
): Promise<PaginatedResult<TournamentWithDetails>> => {
  const skip = (page - 1) * limit;
  
  const [tournaments, totalCount] = await Promise.all([
    prisma.tournament.findMany({
      where: { hostId: userId },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            participants: true,
            teams: true,
            spectators: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tournament.count({ where: { hostId: userId } })
  ]);
  
  return {
    items: tournaments.map(mapToTournamentWithDetails),
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
};

export const getUserParticipatingTournaments = async (
  userId: string,
  page = 1,
  limit = 10
): Promise<PaginatedResult<any>> => {
  const skip = (page - 1) * limit;
  
  const [participations, totalCount] = await Promise.all([
    prisma.tournamentParticipant.findMany({
      where: { userId },
      include: {
        tournament: {
          include: {
            host: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            _count: {
              select: {
                participants: true,
                teams: true
              }
            }
          }
        },
        team: {
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
    prisma.tournamentParticipant.count({ where: { userId } })
  ]);
  
  return {
    items: participations.map((p: any) => ({
      ...p.tournament,
      team: p.team,
      joinedAt: p.createdAt
    })),
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
};

export const getUserSpectatedTournaments = async (
  userId: string,
  page = 1,
  limit = 10
): Promise<PaginatedResult<TournamentWithDetails>> => {
  const skip = (page - 1) * limit;
  
  // Find user to get spectated tournaments
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      spectatedTournaments: {
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          host: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              participants: true,
              teams: true,
              spectators: true
            }
          }
        }
      },
      _count: {
        select: {
          spectatedTournaments: true
        }
      }
    }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    items: user.spectatedTournaments.map(mapToTournamentWithDetails),
    pagination: {
      total: user._count?.spectatedTournaments || 0,
      page,
      limit,
      pages: Math.ceil((user._count?.spectatedTournaments || 0) / limit)
    }
  };
};

/**
 * Generate tournament bracket
 */
export const generateTournamentBracket = async (
  tournamentId: string,
  userId: string,
  seedMethod: 'random' | 'manual' | 'ranking' = 'random'
): Promise<any> => {
  // Check if tournament exists and user is host
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      hostId: userId
    },
    include: {
      participants: true,
      teams: {
        include: {
          members: true
        }
      }
    }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found or you are not the host');
  }
  
  // Check if tournament is in the right state
  if (tournament.status !== 'REGISTRATION_CLOSED') {
    throw new Error('Tournament registration must be closed before generating brackets');
  }
  
  // Check if there are enough participants
  const participantCount = tournament.isTeamBased 
    ? tournament.teams.length
    : tournament.participants.length;
    
  if (tournament.minParticipants && participantCount < tournament.minParticipants) {
    throw new Error(`Not enough participants. Minimum required: ${tournament.minParticipants}`);
  }
  
  // Check if brackets already exist
  const existingMatches = await prisma.match.findFirst({
    where: { tournamentId }
  });
  
  if (existingMatches) {
    throw new Error('Tournament bracket has already been generated');
  }
  
  // Import from brackets utility
  const { generateInitialBracket } = await import('../../utils/brackets');
  
  // Generate brackets based on tournament format
  const matches = await generateInitialBracket(tournamentId);
  
  // Update tournament status to ONGOING
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: 'ONGOING' }
  });
  
  return matches;
};

/**
 * Create a new team for a tournament
 */
 /**
 * Create a new team for a tournament
 */
export const createTeam = async (
  tournamentId: string,
  captainId: string,
  data: { name: string; description?: string; logo?: string }
): Promise<any> => {
  // Check if tournament exists and is open for registration
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      status: 'REGISTRATION_OPEN'
    }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found or registration is not open');
  }
  
  // Check if the tournament is team-based
  if (!tournament.isTeamBased) {
    throw new Error('This tournament does not support teams');
  }
  
  // Check if user is already registered
  const existingParticipant = await prisma.tournamentParticipant.findUnique({
    where: {
      userId_tournamentId: {
        userId: captainId,
        tournamentId
      }
    }
  });
  
  if (existingParticipant) {
    throw new Error('You are already registered for this tournament');
  }
  
  // Check max participants if set
  if (tournament.maxParticipants) {
    const teamCount = await prisma.team.count({
      where: { tournamentId }
    });
    
    if (teamCount >= tournament.maxParticipants) {
      throw new Error('Tournament has reached maximum number of teams');
    }
  }
  
  // Execute in a transaction to ensure consistency
  return prisma.$transaction(async (tx: any) => {
    // Step 1: Create captain as participant first
    const captain = await tx.tournamentParticipant.create({
      data: {
        userId: captainId,
        tournamentId,
        entryFeeTx: null,
      }
    });
    
    // Step 2: Create the team with the captain
    const team = await tx.team.create({
      data: {
        name: data.name,
        description: data.description,
        logo: data.logo,
        tournamentId,
        captainId: captain.id
      }
    });
    
    // Step 3: Update the participant to be linked with the team
    const updatedCaptain = await tx.tournamentParticipant.update({
      where: { id: captain.id },
      data: { teamId: team.id }
    });
    
    // Return the team with all relationships
    return tx.team.findUnique({
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
        }
      }
    });
  });
};/**
 * Update team details
 */
export const updateTeam = async (
  tournamentId: string,
  teamId: string,
  captainId: string,
  data: { name?: string; description?: string; logo?: string }
): Promise<any> => {
  // Check if team exists and user is captain
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
      captain: {
        userId: captainId
      }
    }
  });
  
  if (!team) {
    throw new Error('Team not found or you are not the captain');
  }
  
  // Update team
  const updatedTeam = await prisma.team.update({
    where: { id: teamId },
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
      }
    }
  });
  
  return updatedTeam;
};

/**
 * Add member to team
 */
export const addTeamMember = async (
  tournamentId: string,
  teamId: string,
  captainId: string,
  userId: string
): Promise<any> => {
  // Check if team exists and user is captain
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
      captain: {
        userId: captainId,
        entryFeeTx : null,
      }
    },
    include: {
      _count: {
        select: { members: true }
      }
    }
  });
  
  if (!team) {
    throw new Error('Team not found or you are not the captain');
  }
  
  // Check if user is already in the team
  const existingMember = await prisma.tournamentParticipant.findFirst({
    where: {
      userId,
      teamId,
      entryFeeTx : null, 
    }
  });
  
  if (existingMember) {
    throw new Error('User is already a member of this team');
  }
  
  // Check if user is already participating in this tournament
  const existingParticipant = await prisma.tournamentParticipant.findUnique({
    where: {
      userId_tournamentId: {
        userId,
        tournamentId
      }
    }
  });
  
  if (existingParticipant) {
    throw new Error('User is already participating in this tournament');
  }
  
  // Check team size limit
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });
  
  if (tournament?.teamSize && team._count?.members && team._count.members >= tournament.teamSize) {
    throw new Error(`Team has reached maximum size of ${tournament.teamSize} members`);
  }
  
  // Add member to team
  await prisma.tournamentParticipant.create({
    data: {
      userId,
      tournamentId,
      teamId
    }
  });
  
  // Return updated team
  return prisma.team.findUnique({
    where: { id: teamId },
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
};

/**
 * Remove member from team
 */
export const removeTeamMember = async (
  tournamentId: string,
  teamId: string,
  captainId: string,
  memberId: string
): Promise<any> => {
  // Check if team exists and user is captain
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
      captain: {
        userId: captainId
      }
    }
  });
  
  if (!team) {
    throw new Error('Team not found or you are not the captain');
  }
  
  // Can't remove captain
  if (memberId === captainId) {
    throw new Error('Team captain cannot be removed');
  }
  
  // Check if member exists in team
  const member = await prisma.tournamentParticipant.findFirst({
    where: {
      userId: memberId,
      teamId
    }
  });
  
  if (!member) {
    throw new Error('User is not a member of this team');
  }
  
  // Remove member from team
  await prisma.tournamentParticipant.delete({
    where: {
      userId_tournamentId: {
        userId: memberId,
        tournamentId
      }
    }
  });
  
  // Return updated team
  return prisma.team.findUnique({
    where: { id: teamId },
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
};

/**
 * Get all matches for a tournament
 */
export const getTournamentMatches = async (
  tournamentId: string,
  page = 1,
  limit = 20,
  status?: string,
  bracketSection?: string
): Promise<PaginatedResult<any>> => {
  const skip = (page - 1) * limit;
  
  // Build where clause
  let whereClause: Prisma.MatchWhereInput = { tournamentId };
  
  if (status) {
    whereClause.status = status as any;
  }
  
  if (bracketSection) {
    whereClause.bracketSection = bracketSection;
  }
  
  // Execute queries
  const [matches, totalCount] = await Promise.all([
    prisma.match.findMany({
      where: whereClause,
      include: {
        teamA: true,
        teamB: true,
        participantA: {
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
        participantB: {
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
        judge: {
          select: {
            id: true,
            username: true,
            avatar: true
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
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' }
      ]
    }),
    prisma.match.count({ where: whereClause })
  ]);
  
  return {
    items: matches,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
};

/**
 * Get matches for a specific round in a tournament
 */
export const getTournamentRoundMatches = async (
  tournamentId: string,
  round: number
): Promise<any[]> => {
  const matches = await prisma.match.findMany({
    where: {
      tournamentId,
      round
    },
    include: {
      teamA: true,
      teamB: true,
      participantA: {
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
      participantB: {
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
      judge: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      }
    },
    orderBy: { matchNumber: 'asc' }
  });
  
  return matches;
};

/**
 * Get tournament results/standings
 */
export const getTournamentResults = async (tournamentId: string): Promise<any> => {
  // Check if tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  // Get all completed matches
  const matches = await prisma.match.findMany({
    where: {
      tournamentId,
      status: 'COMPLETED'
    },
    include: {
      teamA: true,
      teamB: true,
      participantA: {
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
      participantB: {
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
  
  // For completed tournaments, get winner
  let winner = null;
  if (tournament.status === 'COMPLETED') {
    // Find final match
    const finalMatch = matches.find((match: any) => {
      // Final match is typically the one with highest round number and no next match
      return !match.nextMatchId && match.status === 'COMPLETED';
    });
    
    if (finalMatch && finalMatch.result) {
      const result = finalMatch.result as any;
      
      // Determine winner entity
      if (finalMatch.teamAId && finalMatch.teamAId === result.winnerId) {
        winner = finalMatch.teamA;
      } else if (finalMatch.teamBId && finalMatch.teamBId === result.winnerId) {
        winner = finalMatch.teamB;
      } else if (finalMatch.participantAId && finalMatch.participantAId === result.winnerId) {
        winner = finalMatch.participantA;
      } else if (finalMatch.participantBId && finalMatch.participantBId === result.winnerId) {
        winner = finalMatch.participantB;
      }
    }
  }
  
  // Calculate standings
  const standings = calculateStandings(tournament, matches);
  
  return {
    tournamentId,
    tournamentName: tournament.name,
    status: tournament.status,
    winner,
    standings,
    completedMatches: matches.length
  };
};

/**
 * Calculate standings for tournament results
 */
function calculateStandings(tournament: any, matches: any[]): any[] {
  // Create record of participant stats
  const statsByParticipant: Record<string, {
    id: string,
    name: string,
    isTeam: boolean,
    avatar?: string,
    wins: number,
    losses: number,
    score: number
  }> = {};
  
  // Process each match
  matches.forEach(match => {
    if (!match.result) return;
    
    const result = match.result as any;
    const winnerId = result.winnerId;
    
    // Track team A stats
    if (match.teamAId) {
      const team = match.teamA;
      if (!statsByParticipant[team.id]) {
        statsByParticipant[team.id] = {
          id: team.id,
          name: team.name,
          isTeam: true,
          avatar: team.logo,
          wins: 0,
          losses: 0,
          score: 0
        };
      }
      
      if (team.id === winnerId) {
        statsByParticipant[team.id].wins += 1;
        statsByParticipant[team.id].score += 3; // 3 points for win
      } else {
        statsByParticipant[team.id].losses += 1;
      }
    }
    
    // Track team B stats
    if (match.teamBId) {
      const team = match.teamB;
      if (!statsByParticipant[team.id]) {
        statsByParticipant[team.id] = {
          id: team.id,
          name: team.name,
          isTeam: true,
          avatar: team.logo,
          wins: 0,
          losses: 0,
          score: 0
        };
      }
      
      if (team.id === winnerId) {
        statsByParticipant[team.id].wins += 1;
        statsByParticipant[team.id].score += 3; // 3 points for win
      } else {
        statsByParticipant[team.id].losses += 1;
      }
    }
    
    // Track participant A stats
    if (match.participantAId) {
      const participant = match.participantA;
      const user = participant.user;
      if (!statsByParticipant[participant.id]) {
        statsByParticipant[participant.id] = {
          id: participant.id,
          name: user.username,
          isTeam: false,
          avatar: user.avatar,
          wins: 0,
          losses: 0,
          score: 0
        };
      }
      
      if (participant.id === winnerId) {
        statsByParticipant[participant.id].wins += 1;
        statsByParticipant[participant.id].score += 3; // 3 points for win
      } else {
        statsByParticipant[participant.id].losses += 1;
      }
    }
    
    // Track participant B stats
    if (match.participantBId) {
      const participant = match.participantB;
      const user = participant.user;
      if (!statsByParticipant[participant.id]) {
        statsByParticipant[participant.id] = {
          id: participant.id,
          name: user.username,
          isTeam: false,
          avatar: user.avatar,
          wins: 0,
          losses: 0,
          score: 0
        };
      }
      
      if (participant.id === winnerId) {
        statsByParticipant[participant.id].wins += 1;
        statsByParticipant[participant.id].score += 3; // 3 points for win
      } else {
        statsByParticipant[participant.id].losses += 1;
      }
    }
  });
  
  // Convert to array and sort by score (descending)
  return Object.values(statsByParticipant).sort((a, b) => {
    // Sort by score first
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // If tied on score, sort by win ratio
    const aRatio = a.wins / (a.wins + a.losses) || 0;
    const bRatio = b.wins / (b.wins + b.losses) || 0;
    return bRatio - aRatio;
  });
}

/**
 * Create an announcement for a tournament
 */
export const createAnnouncement = async (
  tournamentId: string,
  userId: string,
  data: { title: string; content: string; importance?: string }
): Promise<any> => {
  // Check if tournament exists and user is host
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      hostId: userId
    }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found or you are not the host');
  }
  
  // Create announcement
  const announcement = await prisma.tournamentAnnouncement.create({
    data: {
      title: data.title,
      content: data.content,
      importance: data.importance || 'medium',
      tournamentId,
      authorId: userId
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      }
    }
  });
  
  return announcement;
};

/**
 * Get announcements for a tournament
 */
export const getTournamentAnnouncements = async (
  tournamentId: string,
  page = 1,
  limit = 10
): Promise<PaginatedResult<any>> => {
  const skip = (page - 1) * limit;
  
  // Check if tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  // Get announcements
  const [announcements, totalCount] = await Promise.all([
    prisma.tournamentAnnouncement.findMany({
      where: { tournamentId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tournamentAnnouncement.count({ where: { tournamentId } })
  ]);
  
  return {
    items: announcements,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
};

/**
 * Update a participant's seed
 */
export const updateParticipantSeed = async (
  tournamentId: string,
  participantId: string,
  hostId: string,
  seed: number
): Promise<any> => {
  // Check if tournament exists and user is host
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      hostId
    }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found or you are not the host');
  }
  
  // Check if participant exists
  const participant = await prisma.tournamentParticipant.findUnique({
    where: {
      id: participantId
    }
  });
  
  if (!participant || participant.tournamentId !== tournamentId) {
    throw new Error('Participant not found in this tournament');
  }
  
  // Update seed
  const updatedParticipant = await prisma.tournamentParticipant.update({
    where: { id: participantId },
    data: { seed },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      team: true
    }
  });
  
  return updatedParticipant;
};

/**
 * Approve a participant for a tournament
 */
export const approveParticipant = async (
  tournamentId: string,
  participantId: string,
  hostId: string
): Promise<any> => {
  // Check if tournament exists and user is host
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      hostId
    }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found or you are not the host');
  }
  
  // Check if participant exists
  const participant = await prisma.tournamentParticipant.findUnique({
    where: {
      id: participantId
    }
  });
  
  if (!participant || participant.tournamentId !== tournamentId) {
    throw new Error('Participant not found in this tournament');
  }
  
  // Update approval status
  const updatedParticipant = await prisma.tournamentParticipant.update({
    where: { id: participantId },
    data: { isApproved: true },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      team: true
    }
  });
  
  return updatedParticipant;
};

/**
 * Remove a participant from a tournament
 */
export const removeParticipant = async (
  tournamentId: string,
  participantId: string,
  hostId: string
): Promise<void> => {
  // Check if tournament exists and user is host
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      hostId
    }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found or you are not the host');
  }
  
  // Check if participant exists
  const participant = await prisma.tournamentParticipant.findUnique({
    where: {
      id: participantId
    }
  });
  
  if (!participant || participant.tournamentId !== tournamentId) {
    throw new Error('Participant not found in this tournament');
  }
  
  // If participant is a team captain, prevent removal
  if (participant.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: participant.teamId,
        captain: {
          id: participantId
        }
      }
    });
    
    if (team) {
      throw new Error('Cannot remove team captain. Delete the team instead.');
    }
  }
  
  // Delete participant
  await prisma.tournamentParticipant.delete({
    where: { id: participantId }
  });
};

/**
 * Get tournament statistics
 */
export const getTournamentStatistics = async (tournamentId: string): Promise<any> => {
  // Check if tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      _count: {
        select: {
          participants: true,
          teams: true,
          spectators: true
        }
      }
    }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  // Get match statistics
  const matchStats = await prisma.match.groupBy({
    by: ['status'],
    where: { tournamentId },
    _count: true
  });
  
  // Build match status counts
  const matchCounts: Record<string, number> = {
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    DISPUTED: 0
  };
  
  matchStats.forEach((stat: any) => {
    matchCounts[stat.status] = stat._count;
  });
  
  // Total matches
  const totalMatches = Object.values(matchCounts).reduce((a, b) => a + b, 0);
  
  // Get average match duration
  const completedMatches = await prisma.match.findMany({
    where: { 
      tournamentId,
      status: 'COMPLETED',
      startTime: { not: null },
      endTime: { not: null }
    },
    select: {
      startTime: true,
      endTime: true
    }
  });
  
  let averageDurationMs = 0;
  if (completedMatches.length > 0) {
    const totalDurationMs = completedMatches.reduce((sum: any, match: any) => {
      const duration = match.endTime!.getTime() - match.startTime!.getTime();
      return sum + duration;
    }, 0);
    averageDurationMs = totalDurationMs / completedMatches.length;
  }
  
  // Calculate completion percentage
  const completionPercentage = totalMatches > 0 
    ? (matchCounts.COMPLETED / totalMatches) * 100 
    : 0;
  
  return {
    tournamentId,
    tournamentName: tournament.name,
    status: tournament.status,
    participantCount: tournament._count?.participants || 0,
    teamCount: tournament._count?.teams || 0,
    spectatorCount: tournament._count?.spectators || 0,
    matchStatistics: {
      total: totalMatches,
      ...matchCounts,
      averageDurationMinutes: Math.round(averageDurationMs / 60000),
      completionPercentage: Math.round(completionPercentage)
    },
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    duration: tournament.startDate && tournament.endDate 
      ? Math.ceil((tournament.endDate.getTime() - tournament.startDate.getTime()) / (1000 * 3600 * 24))
      : null
  };
};
// ... other imports and functions ...

// --- ADD THESE FUNCTIONS ---

export const deleteTournament = async (id: string, userId: string): Promise<void> => {
  // Verify the user is the host before deleting
  const tournament = await prisma.tournament.findFirst({
    where: {
      id,
      hostId: userId,
    },
    select: { id: true } // Only select necessary field
  });

  if (!tournament) {
    // Either tournament doesn't exist or user is not the host
    throw new Error('Tournament not found or you do not have permission to delete it.');
  }

  // Perform the deletion
  // Note: onDelete: Cascade in your schema for TournamentPrize should handle related prize deletion.
  // Check if other relations need manual cleanup depending on your schema settings.
  await prisma.tournament.delete({
    where: { id },
  });

  // No return value needed for successful deletion
};


export const updateTournamentStatus = async (
  id: string,
  userId: string,
  status: TournamentStatus
): Promise<TournamentWithDetails> => {
  // Verify the user is the host before updating status
  const tournament = await prisma.tournament.findFirst({
    where: {
      id,
      hostId: userId,
    },
    select: { id: true, status: true } // Select current status if needed for validation
  });

  if (!tournament) {
    throw new Error('Tournament not found or you do not have permission to update its status.');
  }

  // Optional: Add validation logic here if needed
  // e.g., prevent changing status from COMPLETED back to REGISTRATION_OPEN

  // Update the status
  const updatedTournament = await prisma.tournament.update({
    where: { id },
    data: { status },
    // Include relations needed for the return type
    include: {
      host: { select: { id: true, username: true, avatar: true } },
      _count: { select: { participants: true, teams: true, spectators: true } },
      prize: true
    }
  });

  return mapToTournamentWithDetails(updatedTournament);
};


// --- END OF ADDED FUNCTIONS ---

// ... rest of your service.ts file ...