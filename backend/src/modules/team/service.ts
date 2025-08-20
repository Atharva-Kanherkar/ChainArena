import prisma from '../../lib/db';
import { Prisma, TournamentParticipant } from '@prisma/client';

interface CreateTeamData {
  name: string;
  tag?: string;
  logo?: string;
}

interface UpdateTeamData {
  name?: string;
  tag?: string | null;
  logo?: string | null;
}

interface TeamWithDetails {
  id: string;
  name: string;
  tag?: string | null;
  logo?: string | null;
  tournamentId: string;
  createdAt: Date;
  updatedAt: Date;
  captain: TournamentParticipant & {
    user: {
      id: string;
      username: string | null;
      avatar: string | null;
    };
  };
  members: Array<TournamentParticipant & {
    user: {
      id: string;
      username: string | null;
      avatar: string | null;
    };
  }>;
  tournament: {
    id: string;
    name: string;
  };
}

export const createTeam = async (
  userId: string, 
  tournamentId: string,
  data: CreateTeamData
): Promise<TeamWithDetails> => {
  // Check if tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  // Check if user is registered for the tournament
  let participant = await prisma.tournamentParticipant.findUnique({
    where: {
      userId_tournamentId: {
        userId,
        tournamentId
      }
    }
  });
  
  // If not registered yet, register them
  if (!participant) {
    participant = await prisma.tournamentParticipant.create({
      data: {
        userId,
        tournamentId
      }
    });
  }
  
  // Check if participant is already in a team
  if (participant.teamId) {
    throw new Error('You are already in a team for this tournament');
  }
  
  // Check if team name is unique in this tournament
  const existingTeam = await prisma.team.findUnique({
    where: {
      name_tournamentId: {
        name: data.name,
        tournamentId
      }
    }
  });
  
  if (existingTeam) {
    throw new Error('Team name already exists in this tournament');
  }
  
  // Create team transaction to ensure all operations succeed or fail together
  return prisma.$transaction(async (tx: any) => {
    // Create the team - FIX HERE: Use captainId instead of captain.connect
    const team = await tx.team.create({
      data: {
        name: data.name,
        tournamentId: tournamentId,
        captainId: participant!.id  // Direct assignment of captainId
      }
    });
    
    // Add creator as team member
    await tx.tournamentParticipant.update({
      where: { id: participant!.id },
      data: {
        teamId: team.id
      }
    });
    
    // Return team with details
    return tx.team.findUniqueOrThrow({
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
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  });
};
export const getTeams = async (
  page = 1, 
  limit = 10, 
  search?: string,
  tournamentId?: string
) => {
  const skip = (page - 1) * limit;
  
  // Build where clause for filtering
  let whereClause: Prisma.TeamWhereInput = {};
  
  if (search) {
    whereClause = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
      ]
    };
  }
  
  if (tournamentId) {
    whereClause = {
      ...whereClause,
      tournamentId
    };
  }
  
  const [teams, totalCount] = await Promise.all([
    prisma.team.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' }
    }),
    prisma.team.count({ where: whereClause })
  ]);
  
  return {
    teams,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
};

export const getTeamById = async (id: string): Promise<TeamWithDetails | null> => {
  return prisma.team.findUnique({
    where: { id },
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
      },
      tournament: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
};

export const updateTeam = async (
  id: string, 
  userId: string, 
  data: UpdateTeamData
) => {
  // Verify team exists
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      captain: true
    }
  });
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Verify user is team captain
  if (team.captain.userId !== userId) {
    throw new Error('Only the team captain can update team details');
  }
  
  // If changing name, check it's unique
  if (data.name && data.name !== team.name) {
    const existingTeam = await prisma.team.findUnique({
      where: {
        name_tournamentId: {
          name: data.name,
          tournamentId: team.tournamentId
        }
      }
    });
    
    if (existingTeam && existingTeam.id !== id) {
      throw new Error('Team name already exists in this tournament');
    }
  }
  
  // Update team
  return prisma.team.update({
    where: { id },
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
      },
      tournament: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
};

export const deleteTeam = async (id: string, userId: string) => {
  // Verify team exists
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      captain: true,
      members: true
    }
  });
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Verify user is team captain
  if (team.captain.userId !== userId) {
    throw new Error('Only the team captain can delete the team');
  }
  
  // Check if team is in active tournaments
  // This would require additional logic based on your tournament statuses
  
  // Delete team (this will automatically update the members teamId to null due to foreign key constraints)
  return prisma.team.delete({
    where: { id }
  });
};

export const addMemberToTeam = async (teamId: string, memberUserId: string, inviterId: string) => {
  // Verify team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      captain: true,
      tournament: true,
      members: true
    }
  });
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Verify inviter is team captain
  if (team.captain.userId !== inviterId) {
    throw new Error('Only the team captain can add members');
  }
  
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: memberUserId }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if user is already in this team
  const existingMembership = team.members.find((member: any) => member.userId === memberUserId);
  if (existingMembership) {
    throw new Error('User is already a member of this team');
  }
  
  // Check if user is already a participant in this tournament
  let participant = await prisma.tournamentParticipant.findUnique({
    where: {
      userId_tournamentId: {
        userId: memberUserId,
        tournamentId: team.tournamentId
      }
    }
  });
  
  // If not already a participant, create a participant entry
  if (!participant) {
    participant = await prisma.tournamentParticipant.create({
      data: {
        userId: memberUserId,
        tournamentId: team.tournamentId
      }
    });
  } else if (participant.teamId) {
    // If already in another team for this tournament
    throw new Error('User is already in another team for this tournament');
  }
  
  // Add to team
  return prisma.tournamentParticipant.update({
    where: { id: participant.id },
    data: { teamId },
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
};

export const joinTeam = async (teamId: string, userId: string) => {
  // Verify team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { tournament: true }
  });
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Check if user is already a participant in this tournament
  let participant = await prisma.tournamentParticipant.findUnique({
    where: {
      userId_tournamentId: {
        userId,
        tournamentId: team.tournamentId
      }
    }
  });
  
  // If not already a participant, create a participant entry
  if (!participant) {
    participant = await prisma.tournamentParticipant.create({
      data: {
        userId,
        tournamentId: team.tournamentId
      }
    });
  } else if (participant.teamId) {
    // If already in another team for this tournament
    throw new Error('You are already in a team for this tournament');
  }
  
  // Join team
  return prisma.tournamentParticipant.update({
    where: { id: participant.id },
    data: { teamId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      team: {
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
          }
        }
      }
    }
  });
};

export const removeMember = async (teamId: string, memberId: string, requesterId: string) => {
  // Verify team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      captain: true
    }
  });
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Verify requester is team captain
  if (team.captain.userId !== requesterId) {
    throw new Error('Only the team captain can remove members');
  }
  
  // Get member to remove
  const member = await prisma.tournamentParticipant.findFirst({
    where: { 
      id: memberId,
      teamId
    }
  });
  
  if (!member) {
    throw new Error('Team member not found');
  }
  
  // Cannot remove captain through this method
  if (member.id === team.captainId) {
    throw new Error('Cannot remove the team captain. Transfer captainship first or delete the team.');
  }
  
  // Remove from team by setting teamId to null
  return prisma.tournamentParticipant.update({
    where: { id: memberId },
    data: { teamId: null }
  });
};

export const updateMemberRole = async (
  teamId: string, 
  memberId: string, 
  requesterId: string,
  newCaptainId?: string
) => {
  // Verify team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      captain: true,
      members: true
    }
  });
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Verify requester is team captain
  if (team.captain.userId !== requesterId) {
    throw new Error('Only the team captain can change member roles');
  }
  
  // If changing captain
  if (newCaptainId) {
    // Verify new captain is a team member
    const newCaptain = team.members.find((m: any) => m.id === newCaptainId);
    if (!newCaptain) {
      throw new Error('New captain must be a team member');
    }
    
    // Update team with new captain
    return prisma.team.update({
      where: { id: teamId },
      data: { captainId: newCaptainId },
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
  }
  
  throw new Error('No role change specified');
};

export const getUserTeams = async (userId: string) => {
  // Get all teams where user is a member
  const participations = await prisma.tournamentParticipant.findMany({
    where: {
      userId,
      teamId: { not: null }
    },
    include: {
      team: {
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
          },
          tournament: {
            select: {
              id: true,
              name: true,
              startDate: true
            }
          }
        }
      }
    }
  });
  
  return participations.map((p: any) => p.team);
};

export const leaveTeam = async (teamId: string, userId: string) => {
  // Get the user's participation record
  const participation = await prisma.tournamentParticipant.findFirst({
    where: {
      userId,
      teamId
    },
    include: {
      team: {
        include: {
          captain: true
        }
      }
    }
  });
  
  if (!participation) {
    throw new Error('You are not a member of this team');
  }
  
  // Check if user is the captain
  if (participation.team?.captain.userId === userId) {
    throw new Error('Team captains cannot leave. Transfer captainship first or delete the team.');
  }
  
  // Remove from team by setting teamId to null
  return prisma.tournamentParticipant.update({
    where: { id: participation.id },
    data: { teamId: null }
  });
};