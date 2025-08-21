// Temporary type declarations to fix Prisma import issues
// This file should be removed once Prisma client is properly generated

declare module '@prisma/client' {
  export enum TournamentStatus {
    DRAFT = 'DRAFT',
    REGISTRATION_OPEN = 'REGISTRATION_OPEN',
    REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
    ONGOING = 'ONGOING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
  }

  export enum MatchStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    DISPUTED = 'DISPUTED'
  }

  export interface User {
    id: string;
    email: string;
    username: string | null;
    password: string | null;
    avatar: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
    walletAddress: string | null;
    supabaseId: string | null;
    isAdmin: boolean;
    hostedTournaments: Tournament[];
    participation: TournamentParticipant[];
    spectatedTournaments: Tournament[];
    judgedMatches: Match[];
    _count?: {
      hostedTournaments?: number;
      participation?: number;
      spectatedTournaments?: number;
      judgedMatches?: number;
    };
  }

  export interface Tournament {
    id: string;
    name: string;
    description: string | null;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    status: TournamentStatus;
    format: string;
    registrationDeadline: Date | null;
    hostId: string;
    host: User;
    minParticipants: number | null;
    maxParticipants: number | null;
    teamSize: number | null;
    isTeamBased: boolean;
    participants: TournamentParticipant[];
    teams: Team[];
    spectators: User[];
    matches: Match[];
    prize: TournamentPrize | null;
    achievements: Achievement[];
    _count?: {
      participants?: number;
      teams?: number;
      spectators?: number;
      matches?: number;
      achievements?: number;
    };
  }

  export interface Team {
    id: string;
    name: string;
    description: string | null;
    logo: string | null;
    createdAt: Date;
    updatedAt: Date;
    tournamentId: string;
    tournament: Tournament;
    captainId: string;
    captain: TournamentParticipant;
    members: TournamentParticipant[];
    matchesAsTeamA: Match[];
    matchesAsTeamB: Match[];
    receivedPayments: PrizePayment[];
    _count?: {
      members?: number;
      matchesAsTeamA?: number;
      matchesAsTeamB?: number;
      receivedPayments?: number;
    };
  }

  export interface TournamentParticipant {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    seed: number | null;
    isApproved: boolean;
    entryFeeTx: string | null;
    userId: string;
    user: User;
    tournamentId: string;
    tournament: Tournament;
    teamId: string | null;
    team: Team | null;
    matchesAsParticipantA: Match[];
    matchesAsParticipantB: Match[];
    receivedPayments: PrizePayment[];
    Team: Team[];
  }

  export interface Match {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    scheduledTime: Date | null;
    startTime: Date | null;
    endTime: Date | null;
    status: MatchStatus;
    round: number;
    matchNumber: number;
    tournamentId: string;
    tournament: Tournament;
    teamAId: string | null;
    teamA: Team | null;
    teamBId: string | null;
    teamB: Team | null;
    participantAId: string | null;
    participantA: TournamentParticipant | null;
    participantBId: string | null;
    participantB: TournamentParticipant | null;
    nextMatchId: string | null;
    result: any;
    bracketSection: string | null;
    judgeId: string | null;
    judge: User | null;
  }

  export interface TournamentPrize {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tournamentId: string;
    tournament: Tournament;
    entryFee: string | null;
    prizePool: string | null;
    tokenType: string;
    tokenAddress: string | null;
    escrowAddress: string | null;
    escrowSignature: string | null;
    distribution: any;
    platformFeePercent: number;
    payouts: PrizePayment[];
  }

  export interface PrizePayment {
    id: string;
    createdAt: Date;
    tournamentPrizeId: string;
    tournamentPrize: TournamentPrize;
    amount: string;
    position: string;
    recipientType: string;
    teamId: string | null;
    participantId: string | null;
    team: Team | null;
    participant: TournamentParticipant | null;
    txSignature: string;
    txConfirmed: boolean;
  }

  export interface Achievement {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user: User;
    tournamentId: string;
    tournament: Tournament;
    type: string;
    mintAddress: string;
    metadataUri: string;
  }

  export interface TournamentAnnouncement {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    content: string;
    importance: string;
    tournamentId: string;
    tournament: Tournament;
    authorId: string;
    author: User;
  }

  export namespace Prisma {
    export interface MatchWhereInput {
      id?: string;
      tournamentId?: string;
      status?: MatchStatus;
      round?: number;
      teamAId?: string | null;
      teamBId?: string | null;
      participantAId?: string | null;
      participantBId?: string | null;
      judgeId?: string | null;
      bracketSection?: string | null;
      AND?: MatchWhereInput[];
      OR?: MatchWhereInput[];
      NOT?: MatchWhereInput[];
      tournament?: any;
      teamA?: any;
      teamB?: any;
      participantA?: any;
      participantB?: any;
      judge?: any;
    }

    export interface TournamentWhereInput {
      id?: string;
      hostId?: string;
      status?: TournamentStatus;
      name?: string | {
        contains?: string;
        mode?: string;
      };
      description?: string | {
        contains?: string;
        mode?: string;
      };
      isTeamBased?: boolean;
      AND?: TournamentWhereInput[];
      OR?: TournamentWhereInput[];
      NOT?: TournamentWhereInput[];
    }

    export interface UserWhereInput {
      id?: string;
      email?: string;
      username?: string;
      supabaseId?: string;
      walletAddress?: string;
      AND?: UserWhereInput[];
      OR?: UserWhereInput[];
      NOT?: UserWhereInput[];
    }

    export interface TeamWhereInput {
      id?: string;
      name?: string | {
        contains?: string;
        mode?: string;
      };
      description?: string | {
        contains?: string;
        mode?: string;
      };
      tournamentId?: string;
      captainId?: string;
      AND?: TeamWhereInput[];
      OR?: TeamWhereInput[];
      NOT?: TeamWhereInput[];
    }

    export interface TournamentUpdateInput {
      name?: string;
      description?: string | null;
      startDate?: Date | string | null;
      endDate?: Date | string | null;
      status?: TournamentStatus;
      format?: string;
      registrationDeadline?: Date | string | null;
      minParticipants?: number;
      maxParticipants?: number;
      teamSize?: number;
      isTeamBased?: boolean;
    }

    export interface TournamentPrizeUpdateInput {
      entryFee?: string | null;
      prizePool?: string | null;
      tokenType?: string;
      tokenAddress?: string | null;
      escrowAddress?: string | null;
      escrowSignature?: string | null;
      distribution?: JsonValue;
      platformFeePercent?: number;
    }

    export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
    export interface JsonObject {
      [key: string]: JsonValue;
    }
    export interface JsonArray extends Array<JsonValue> {}
  }

  export class PrismaClient {
    user: {
      findUnique: (args?: any) => Promise<User | null>;
      findMany: (args?: any) => Promise<User[]>;
      findFirst: (args?: any) => Promise<User | null>;
      create: (args: any) => Promise<User>;
      update: (args: any) => Promise<User>;
      upsert: (args: any) => Promise<User>;
      delete: (args: any) => Promise<User>;
      count: (args?: any) => Promise<number>;
    };
    
    tournament: {
      findUnique: (args?: any) => Promise<Tournament | null>;
      findMany: (args?: any) => Promise<Tournament[]>;
      findFirst: (args?: any) => Promise<Tournament | null>;
      create: (args: any) => Promise<Tournament>;
      update: (args: any) => Promise<Tournament>;
      upsert: (args: any) => Promise<Tournament>;
      delete: (args: any) => Promise<Tournament>;
      count: (args?: any) => Promise<number>;
    };
    
    team: {
      findUnique: (args?: any) => Promise<Team | null>;
      findMany: (args?: any) => Promise<Team[]>;
      findFirst: (args?: any) => Promise<Team | null>;
      create: (args: any) => Promise<Team>;
      update: (args: any) => Promise<Team>;
      upsert: (args: any) => Promise<Team>;
      delete: (args: any) => Promise<Team>;
      count: (args?: any) => Promise<number>;
    };
    
    tournamentParticipant: {
      findUnique: (args?: any) => Promise<TournamentParticipant | null>;
      findMany: (args?: any) => Promise<TournamentParticipant[]>;
      findFirst: (args?: any) => Promise<TournamentParticipant | null>;
      create: (args: any) => Promise<TournamentParticipant>;
      update: (args: any) => Promise<TournamentParticipant>;
      upsert: (args: any) => Promise<TournamentParticipant>;
      delete: (args: any) => Promise<TournamentParticipant>;
      count: (args?: any) => Promise<number>;
    };
    
    match: {
      findUnique: (args?: any) => Promise<Match | null>;
      findMany: (args?: any) => Promise<Match[]>;
      findFirst: (args?: any) => Promise<Match | null>;
      create: (args: any) => Promise<Match>;
      update: (args: any) => Promise<Match>;
      upsert: (args: any) => Promise<Match>;
      delete: (args: any) => Promise<Match>;
      deleteMany: (args: any) => Promise<{count: number}>;
      count: (args?: any) => Promise<number>;
      groupBy: (args: any) => Promise<any[]>;
    };
    
    tournamentPrize: {
      findUnique: (args?: any) => Promise<TournamentPrize | null>;
      findMany: (args?: any) => Promise<TournamentPrize[]>;
      findFirst: (args?: any) => Promise<TournamentPrize | null>;
      create: (args: any) => Promise<TournamentPrize>;
      update: (args: any) => Promise<TournamentPrize>;
      upsert: (args: any) => Promise<TournamentPrize>;
      delete: (args: any) => Promise<TournamentPrize>;
      count: (args?: any) => Promise<number>;
    };
    
    prizePayment: {
      findUnique: (args?: any) => Promise<PrizePayment | null>;
      findMany: (args?: any) => Promise<PrizePayment[]>;
      findFirst: (args?: any) => Promise<PrizePayment | null>;
      create: (args: any) => Promise<PrizePayment>;
      update: (args: any) => Promise<PrizePayment>;
      upsert: (args: any) => Promise<PrizePayment>;
      delete: (args: any) => Promise<PrizePayment>;
      count: (args?: any) => Promise<number>;
    };
    
    achievement: {
      findUnique: (args?: any) => Promise<Achievement | null>;
      findMany: (args?: any) => Promise<Achievement[]>;
      findFirst: (args?: any) => Promise<Achievement | null>;
      create: (args: any) => Promise<Achievement>;
      update: (args: any) => Promise<Achievement>;
      upsert: (args: any) => Promise<Achievement>;
      delete: (args: any) => Promise<Achievement>;
      count: (args?: any) => Promise<number>;
    };
    
    tournamentAnnouncement: {
      findUnique: (args?: any) => Promise<TournamentAnnouncement | null>;
      findMany: (args?: any) => Promise<TournamentAnnouncement[]>;
      findFirst: (args?: any) => Promise<TournamentAnnouncement | null>;
      create: (args: any) => Promise<TournamentAnnouncement>;
      update: (args: any) => Promise<TournamentAnnouncement>;
      upsert: (args: any) => Promise<TournamentAnnouncement>;
      delete: (args: any) => Promise<TournamentAnnouncement>;
      count: (args?: any) => Promise<number>;
    };
    
    $transaction: <T>(fn: (prisma: PrismaClient) => Promise<T>) => Promise<T>;
    $connect: () => Promise<void>;
    $disconnect: () => Promise<void>;

    constructor(options?: any);
  }

  export default PrismaClient;
}