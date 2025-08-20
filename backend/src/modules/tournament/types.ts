 
// Temporarily commented out to avoid runtime import errors
// import { Tournament, TournamentStatus,  User, TournamentParticipant, Team, TournamentPrize, Prisma } from '@prisma/client';

// Define types locally to avoid runtime issues
export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Define tournament formats as a proper enum
export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SWISS = 'SWISS',
  CUSTOM = 'CUSTOM'
}


// Define base tournament data structure
export interface BaseTournamentData {
  name: string;
  description?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  status?: TournamentStatus;
  format?: string; // Consider using an enum if you have fixed formats
  registrationDeadline?: string | Date | null;
  minParticipants?: number | null;
  maxParticipants?: number | null;
  teamSize?: number | null;
  isTeamBased?: boolean;
  // Add any other common fields
}

// Type for creating a tournament, extending base and adding prize fields
export interface CreateTournamentData extends BaseTournamentData {
  // Optional prize fields matching TournamentPrize schema
  entryFee?: string | number | null; // Allow number from form, convert to string in service
  tokenType?: string | null;
  tokenAddress?: string | null;
  prizePool?: string | number | null; // Allow number from form, convert to string in service
  distribution?: any | null; // Use any for JSON type to avoid runtime issues
  platformFeePercent?: number | null;
}

// Type for updating a tournament, making all fields optional
export interface UpdateTournamentData {
  name?: string;
  description?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  status?: TournamentStatus;
  format?: string;
  registrationDeadline?: string | Date | null;
  minParticipants?: number | null;
  maxParticipants?: number | null;
  teamSize?: number | null;
  isTeamBased?: boolean;

  // Optional prize fields for update/upsert
  entryFee?: string | number | null;
  tokenType?: string | null;
  tokenAddress?: string | null;
  prizePool?: string | number | null;
  distribution?: any | null;
  platformFeePercent?: number | null;
}


// Type for detailed tournament view, including relations
export interface TournamentWithDetails {
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
  minParticipants: number | null;
  maxParticipants: number | null;
  teamSize: number | null;
  isTeamBased: boolean;
  participants: any[];
  teams: any[];
  spectators: any[];
  matches: any[];
  achievements: any[];
  host: {
    id: string;
    username: string;
    avatar: string | null;
  };
  _count: {
    participants: number;
    teams: number;
    spectators: number;
  };
  // Make prize explicitly optional based on schema
  prize: any | null;
}

// Type for paginated results
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// You might have other types here...
export interface TournamentWithHost {
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
  minParticipants: number | null;
  maxParticipants: number | null;
  teamSize: number | null;
  isTeamBased: boolean;
  participants: any[];
  teams: any[];
  spectators: any[];
  matches: any[];
  achievements: any[];
  host: any;
}

// Add other specific types as needed...