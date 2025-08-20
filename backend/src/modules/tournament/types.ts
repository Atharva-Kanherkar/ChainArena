 
import { Tournament, TournamentStatus,  User, TournamentParticipant, Team, TournamentPrize } from '@prisma/client';
import { Prisma } from '@prisma/client'; // Import Prisma namespace for JsonValue

// Use Prisma's enum directly
export { TournamentStatus } from '@prisma/client';

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
  distribution?: Prisma.JsonValue | null; // Use Prisma.JsonValue for JSON type
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
  distribution?: Prisma.JsonValue | null;
  platformFeePercent?: number | null;
}


// Type for detailed tournament view, including relations
export interface TournamentWithDetails extends Omit<Tournament, 'host'> {
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
  prize: TournamentPrize | null;
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
export interface TournamentWithHost extends Tournament {
    host: User;
}

// Add other specific types as needed...