import prisma from '../../lib/db';
import { 
  Match,
  MatchStatus, 
  Prisma, 
  Tournament, 
  TournamentStatus
} from '@prisma/client';
import { 
  CreateMatchData, 
  MatchWithTeams,
  UpdateMatchData, 
  MatchResult,
  PaginatedResult
} from './types';
import { generateInitialBracket, advanceWinnerToNextMatch } from '../../utils/brackets';
import * as prizeService from '../prize/service';

export const createMatch = async (data: CreateMatchData): Promise<MatchWithTeams> => {
  // Validate tournament exists and is in the right state
  const tournament = await prisma.tournament.findUnique({
    where: { id: data.tournamentId }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  // Parse dates
  const scheduledTime = data.scheduledTime ? new Date(data.scheduledTime) : null;

  // Create match
  const match = await prisma.match.create({
    data: {
      tournamentId: data.tournamentId,
      round: data.round,
      matchNumber: data.matchNumber,
      scheduledTime,
      teamAId: data.teamAId || null,
      teamBId: data.teamBId || null,
      participantAId: data.participantAId || null,
      participantBId: data.participantBId || null,
      bracketSection: data.bracketSection,
      judgeId: data.judgeId || null
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
      judge: true,
      tournament: true
    }
  });

  return match;
};

export const getMatches = async (
  page = 1,
  limit = 20,
  tournamentId?: string,
  status?: MatchStatus,
  round?: number
): Promise<PaginatedResult<MatchWithTeams>> => {
  const skip = (page - 1) * limit;

  // Build where clause
  let whereClause: Prisma.MatchWhereInput = {};
  
  if (tournamentId) {
    whereClause.tournamentId = tournamentId;
  }
  
  if (status) {
    whereClause.status = status;
  }
  
  if (round !== undefined) {
    whereClause.round = round;
  }

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
        judge: true,
        tournament: true
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

export const getMatchById = async (id: string): Promise<MatchWithTeams | null> => {
  return prisma.match.findUnique({
    where: { id },
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
      judge: true,
      tournament: true
    }
  });
};

export const updateMatch = async (
  id: string,
  data: UpdateMatchData
): Promise<MatchWithTeams> => {
  // Parse dates
  const updateData = {
    ...data,
    scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : undefined,
    startTime: data.startTime ? new Date(data.startTime) : undefined,
    endTime: data.endTime ? new Date(data.endTime) : undefined
  };

  return prisma.match.update({
    where: { id },
    data: updateData,
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
      judge: true,
      tournament: true
    }
  });
};

export const submitMatchResult = async (
  id: string, 
  userId: string,
  result: MatchResult
): Promise<MatchWithTeams> => {
  // Get the match
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: {
        include : {
          prize : true,
        }
      },
      teamA: true,
      teamB: true,
      participantA: {
        include: {
          user: true
        }
      },
      participantB: {
        include: {
          user: true
        }
      }
    }
  });

  if (!match) {
    throw new Error('Match not found');
  }

  // Verify the tournament is ongoing
  if (match.tournament.status !== TournamentStatus.ONGOING) {
    throw new Error('Tournament is not in progress');
  }

  // Verify match is ready for scoring
  if (match.status !== MatchStatus.PENDING && match.status !== MatchStatus.IN_PROGRESS) {
    throw new Error('Match cannot be scored in its current state');
  }

  // Verify the user has permission to submit result
  // This could be the tournament host, a judge, or a participant
  const isHost = match.tournament.hostId === userId;
  const isJudge = match.judgeId === userId;
  const isParticipant = (
    (match.participantA?.userId === userId) || 
    (match.participantB?.userId === userId) ||
    (match.teamA?.captainId && match.participantA?.id === match.teamA.captainId && match.participantA.userId === userId) ||
    (match.teamB?.captainId && match.participantB?.id === match.teamB.captainId && match.participantB.userId === userId)
  );

  if (!isHost && !isJudge && !isParticipant) {
    throw new Error('You do not have permission to submit this match result');
  }

  // Validate the winner ID matches one of the participants
  const validWinnerIds = [
    match.participantAId,
    match.participantBId,
    match.teamAId,
    match.teamBId
  ].filter(Boolean) as string[];

  if (!validWinnerIds.includes(result.winnerId)) {
    throw new Error('Winner ID must match one of the participants');
  }

  // Update the match with the result
  const updatedMatch = await prisma.match.update({
    where: { id },
    data: {
      status: MatchStatus.COMPLETED,
      result: result as any,
      endTime: new Date()
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
      judge: true,
      tournament: true
    }
  });

  // If this match has a next match, update it with the winner
  if (updatedMatch.nextMatchId) {
    await advanceWinnerToNextMatch(updatedMatch.id, result.winnerId);
  }
  try {
    // Check if tournament has prize info and match is completed
    
    if (match.tournament.prize && updatedMatch.status === MatchStatus.COMPLETED) {
      // Determine winner type (team or participant)
      const winnerType = updatedMatch.teamAId || updatedMatch.teamBId ? 'team' : 'participant';
      
      // Pass winner ID to prize service
      await prizeService.processMatchPayment(
        id,
        result.winnerId,
        winnerType
      );
    }
  } catch (error) {
    console.error(`Error processing prize payment for match ${id}:`, error);
  }
  return updatedMatch;
};

export const startMatch = async (id: string, userId: string): Promise<MatchWithTeams> => {
  // Get the match
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: true
    }
  });

  if (!match) {
    throw new Error('Match not found');
  }

  // Verify the tournament is ongoing
  if (match.tournament.status !== TournamentStatus.ONGOING) {
    throw new Error('Tournament is not in progress');
  }

  // Verify match is in pending state
  if (match.status !== MatchStatus.PENDING) {
    throw new Error('Match can only be started from pending state');
  }

  // Verify user has permission (host, judge, or participant)
  const isHost = match.tournament.hostId === userId;
  const isJudge = match.judgeId === userId;
  
  if (!isHost && !isJudge) {
    throw new Error('You do not have permission to start this match');
  }

  // Start the match
  return prisma.match.update({
    where: { id },
    data: {
      status: MatchStatus.IN_PROGRESS,
      startTime: new Date()
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
      judge: true,
      tournament: true
    }
  });
};

export const cancelMatch = async (id: string, userId: string): Promise<MatchWithTeams> => {
  // Get the match
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: true
    }
  });

  if (!match) {
    throw new Error('Match not found');
  }

  // Verify match status
  if (match.status === MatchStatus.COMPLETED || match.status === MatchStatus.CANCELLED) {
    throw new Error('Match cannot be cancelled in its current state');
  }

  // Verify user has permission (host or judge only)
  const isHost = match.tournament.hostId === userId;
  const isJudge = match.judgeId === userId;
  
  if (!isHost && !isJudge) {
    throw new Error('You do not have permission to cancel this match');
  }

  // Cancel the match
  return prisma.match.update({
    where: { id },
    data: {
      status: MatchStatus.CANCELLED
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
      judge: true,
      tournament: true
    }
  });
};

export const disputeMatchResult = async (id: string, userId: string, reason: string): Promise<MatchWithTeams> => {
  // Get the match
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: true,
      participantA: true,
      participantB: true,
      teamA: {
        include: {
          members: true
        }
      },
      teamB: {
        include: {
          members: true
        }
      }
    }
  });

  if (!match) {
    throw new Error('Match not found');
  }

  // Verify match status
  if (match.status !== MatchStatus.COMPLETED) {
    throw new Error('Only completed matches can be disputed');
  }

  // Verify user is a participant in the match
  const isParticipant = (
    (match.participantA?.userId === userId) || 
    (match.participantB?.userId === userId) ||
    (match.teamA?.members.some((m: any) => m.userId === userId)) ||
    (match.teamB?.members.some((m: any) => m.userId === userId))
  );

  if (!isParticipant) {
    throw new Error('Only participants can dispute match results');
  }

  // Update the match status and add dispute reason to the result
  const currentResult = match.result as any || {};
  const updatedResult = {
    ...currentResult,
    disputed: true,
    disputeReason: reason,
    disputedBy: userId,
    disputeTime: new Date()
  };

  return prisma.match.update({
    where: { id },
    data: {
      status: MatchStatus.DISPUTED,
      result: updatedResult
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
      judge: true,
      tournament: true
    }
  });
};

export const resolveDispute = async (id: string, userId: string, result: MatchResult): Promise<MatchWithTeams> => {
  // Get the match
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: {
        include: { prize: true } 
      }
    }
  });

  if (!match) {
    throw new Error('Match not found');
  }

  // Verify match is in disputed state
  if (match.status !== MatchStatus.DISPUTED) {
    throw new Error('Only disputed matches can be resolved');
  }

  // Verify user has permission (only host or judge can resolve disputes)
  const isHost = match.tournament.hostId === userId;
  const isJudge = match.judgeId === userId;
  
  if (!isHost && !isJudge) {
    throw new Error('Only the tournament host or match judge can resolve disputes');
  }

  // Update with the resolved result
  const currentResult = match.result as any || {};
  const resolvedResult = {
    ...result,
    disputeResolved: true,
    originalResult: currentResult,
    resolvedBy: userId,
    resolvedAt: new Date()
  };

  return prisma.match.update({
    where: { id },
    data: {
      status: MatchStatus.COMPLETED,
      result: resolvedResult as any
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
      judge: true,
      tournament: true
    }
  });
};

export const getTournamentMatches = async (
  tournamentId: string,
  page = 1,
  limit = 50,
  round?: number
): Promise<PaginatedResult<MatchWithTeams>> => {
  const skip = (page - 1) * limit;

  // Build where clause
  let whereClause: Prisma.MatchWhereInput = {
    tournamentId
  };
  
  if (round !== undefined) {
    whereClause.round = round;
  }

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
        judge: true,
        tournament: true
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

export const getUserMatches = async (
  userId: string,
  page = 1,
  limit = 20,
  status?: MatchStatus
): Promise<PaginatedResult<MatchWithTeams>> => {
  const skip = (page - 1) * limit;

  // Build where clause to find matches where user is a participant
  let whereClause: Prisma.MatchWhereInput = {
    OR: [
      {
        participantA: {
          userId
        }
      },
      {
        participantB: {
          userId
        }
      },
      {
        teamA: {
          members: {
            some: {
              userId
            }
          }
        }
      },
      {
        teamB: {
          members: {
            some: {
              userId
            }
          }
        }
      }
    ]
  };
  
  if (status) {
    whereClause.status = status;
  }

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
        judge: true,
        tournament: true
      },
      skip,
      take: limit,
      orderBy: { scheduledTime: 'asc' }
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

export const assignJudge = async (
  matchId: string,
  judgeId: string,
  requesterId: string
): Promise<MatchWithTeams> => {
  // Get the match
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true
    }
  });

  if (!match) {
    throw new Error('Match not found');
  }

  // Verify requester is tournament host
  if (match.tournament.hostId !== requesterId) {
    throw new Error('Only the tournament host can assign judges');
  }

  // Assign the judge
  return prisma.match.update({
    where: { id: matchId },
    data: {
      judgeId
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
      judge: true,
      tournament: true
    }
  });
};

export const generateBracket = async (
  tournamentId: string, 
  userId: string
): Promise<MatchWithTeams[]> => {
  // Verify tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: true
    }
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  // Verify user is tournament host
  if (tournament.hostId !== userId) {
    throw new Error('Only the tournament host can generate brackets');
  }

  // Verify tournament is in the right state
  if (tournament.status !== TournamentStatus.REGISTRATION_CLOSED) {
    throw new Error('Tournament must have registration closed before generating brackets');
  }

  // Check if there are enough participants
  if (tournament.minParticipants && tournament.participants.length < tournament.minParticipants) {
    throw new Error(`Not enough participants. Minimum required: ${tournament.minParticipants}`);
  }

  // Delete any existing matches for this tournament
  await prisma.match.deleteMany({
    where: { tournamentId }
  });

  // Generate the bracket based on tournament format
  const matches = await generateInitialBracket(tournamentId);

  // Move tournament to ONGOING status
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: TournamentStatus.ONGOING }
  });

  return matches;
};

export const rescheduleMatch = async (
  id: string,
  scheduledTime: string | Date,
  userId: string
): Promise<MatchWithTeams> => {
  // Get the match
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: true
    }
  });

  if (!match) {
    throw new Error('Match not found');
  }

  // Verify user has permission (host or judge)
  const isHost = match.tournament.hostId === userId;
  const isJudge = match.judgeId === userId;
  
  if (!isHost && !isJudge) {
    throw new Error('Only the tournament host or match judge can reschedule matches');
  }

  // Verify match status allows rescheduling
  if (match.status !== MatchStatus.PENDING && match.status !== MatchStatus.CANCELLED) {
    throw new Error('Only pending or cancelled matches can be rescheduled');
  }

  // Parse the scheduled time
  const newScheduledTime = new Date(scheduledTime);

  // Reschedule the match
  return prisma.match.update({
    where: { id },
    data: {
      scheduledTime: newScheduledTime,
      status: MatchStatus.PENDING
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
      judge: true,
      tournament: true
    }
  });
};