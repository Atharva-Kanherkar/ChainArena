import { Request, Response, NextFunction } from 'express';
import { TournamentStatus, TournamentFormat } from './types';

const validTournamentStatuses: TournamentStatus[] = [
  TournamentStatus.DRAFT, 
  TournamentStatus.REGISTRATION_OPEN, 
  TournamentStatus.REGISTRATION_CLOSED, 
  TournamentStatus.ONGOING, 
  TournamentStatus.COMPLETED, 
  TournamentStatus.CANCELLED
];

const validTournamentFormats: string[] = [
  'SINGLE_ELIMINATION', 
  'DOUBLE_ELIMINATION', 
  'ROUND_ROBIN', 
  'SWISS', 
  'CUSTOM'
];

export const validateCreateTournament = (req: Request, res: Response, next: NextFunction) => {
  const { 
    name, 
    description, 
    startDate, 
    endDate, 
    format, 
    maxParticipants, 
    minParticipants,
    teamSize,
    isTeamBased,
    registrationDeadline,
    status
  } = req.body;
  
  // Required fields
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Tournament name is required' });
    return;
  }
  
  if (name.length < 3 || name.length > 100) {
    res.status(400).json({ error: 'Tournament name must be between 3 and 100 characters' });
    return;
  }
  
  // Optional description
  if (description !== undefined && description !== null && typeof description !== 'string') {
    res.status(400).json({ error: 'Tournament description must be a string' });
    return;
  }
  
  // Date validations
  if (startDate) {
    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      res.status(400).json({ error: 'Invalid start date format' });
      return;
    }
  }
  
  if (endDate) {
    const endDateObj = new Date(endDate);
    if (isNaN(endDateObj.getTime())) {
      res.status(400).json({ error: 'Invalid end date format' });
      return;
    }
  }
  
  if (registrationDeadline) {
    const deadlineObj = new Date(registrationDeadline);
    if (isNaN(deadlineObj.getTime())) {
      res.status(400).json({ error: 'Invalid registration deadline format' });
      return;
    }
  }
  
  // Check date relationships
  if (startDate && endDate) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (startDateObj > endDateObj) {
      res.status(400).json({ error: 'End date must be after start date' });
      return;
    }
  }
  
  if (startDate && registrationDeadline) {
    const startDateObj = new Date(startDate);
    const deadlineObj = new Date(registrationDeadline);
    
    if (deadlineObj > startDateObj) {
      res.status(400).json({ error: 'Registration deadline must be before start date' });
      return;
    }
  }
  
  // Format validation
  if (format && !validTournamentFormats.includes(format)) {
    res.status(400).json({ 
      error: `Invalid tournament format. Must be one of: ${validTournamentFormats.join(', ')}` 
    });
    return;
  }
  
  // Status validation
  if (status && !validTournamentStatuses.includes(status as TournamentStatus)) {
    res.status(400).json({ 
      error: `Invalid tournament status. Must be one of: ${validTournamentStatuses.join(', ')}` 
    });
    return;
  }
  
  // Participant counts
  if (maxParticipants !== undefined) {
    const max = Number(maxParticipants);
    if (isNaN(max) || max < 2) {
      res.status(400).json({ error: 'Max participants must be at least 2' });
      return;
    }
  }
  
  if (minParticipants !== undefined) {
    const min = Number(minParticipants);
    if (isNaN(min) || min < 2) {
      res.status(400).json({ error: 'Min participants must be at least 2' });
      return;
    }
  }
  
  if (minParticipants !== undefined && maxParticipants !== undefined) {
    const min = Number(minParticipants);
    const max = Number(maxParticipants);
    
    if (min > max) {
      res.status(400).json({ error: 'Min participants cannot be greater than max participants' });
      return;
    }
  }
  
  // Team size validation
  if (teamSize !== undefined) {
    const size = Number(teamSize);
    if (isNaN(size) || size < 1) {
      res.status(400).json({ error: 'Team size must be at least 1' });
      return;
    }
  }
  
  // IsTeamBased validation
  if (isTeamBased !== undefined && typeof isTeamBased !== 'boolean') {
    res.status(400).json({ error: 'isTeamBased must be a boolean' });
    return;
  }
  
  next();
};

export const validateUpdateTournament = (req: Request, res: Response, next: NextFunction) => {
  const { 
    name, 
    description, 
    startDate, 
    endDate, 
    format, 
    maxParticipants, 
    minParticipants,
    teamSize,
    isTeamBased,
    registrationDeadline
  } = req.body;
  
  // Optional name
  if (name !== undefined) {
    if (typeof name !== 'string') {
      res.status(400).json({ error: 'Tournament name must be a string' });
      return;
    }
    
    if (name.length < 3 || name.length > 100) {
      res.status(400).json({ error: 'Tournament name must be between 3 and 100 characters' });
      return;
    }
  }
  
  // Optional description
  if (description !== undefined && description !== null && typeof description !== 'string') {
    res.status(400).json({ error: 'Tournament description must be a string or null' });
    return;
  }
  
  // Date validations
  if (startDate !== undefined && startDate !== null) {
    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      res.status(400).json({ error: 'Invalid start date format' });
      return;
    }
  }
  
  if (endDate !== undefined && endDate !== null) {
    const endDateObj = new Date(endDate);
    if (isNaN(endDateObj.getTime())) {
      res.status(400).json({ error: 'Invalid end date format' });
      return;
    }
  }
  
  if (registrationDeadline !== undefined && registrationDeadline !== null) {
    const deadlineObj = new Date(registrationDeadline);
    if (isNaN(deadlineObj.getTime())) {
      res.status(400).json({ error: 'Invalid registration deadline format' });
      return;
    }
  }
  
  // Check date relationships
  if (startDate && endDate) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (startDateObj > endDateObj) {
      res.status(400).json({ error: 'End date must be after start date' });
      return;
    }
  }
  
  if (startDate && registrationDeadline) {
    const startDateObj = new Date(startDate);
    const deadlineObj = new Date(registrationDeadline);
    
    if (deadlineObj > startDateObj) {
      res.status(400).json({ error: 'Registration deadline must be before start date' });
      return;
    }
  }
  
  // Format validation
  if (format !== undefined && !validTournamentFormats.includes(format)) {
    res.status(400).json({ 
      error: `Invalid tournament format. Must be one of: ${validTournamentFormats.join(', ')}` 
    });
    return;
  }
  
  // Participant counts
  if (maxParticipants !== undefined) {
    const max = Number(maxParticipants);
    if (isNaN(max) || max < 2) {
      res.status(400).json({ error: 'Max participants must be at least 2' });
      return;
    }
  }
  
  if (minParticipants !== undefined) {
    const min = Number(minParticipants);
    if (isNaN(min) || min < 2) {
      res.status(400).json({ error: 'Min participants must be at least 2' });
      return;
    }
  }
  
  if (minParticipants !== undefined && maxParticipants !== undefined) {
    const min = Number(minParticipants);
    const max = Number(maxParticipants);
    
    if (min > max) {
      res.status(400).json({ error: 'Min participants cannot be greater than max participants' });
      return;
    }
  }
  
  // Team size validation
  if (teamSize !== undefined) {
    const size = Number(teamSize);
    if (isNaN(size) || size < 1) {
      res.status(400).json({ error: 'Team size must be at least 1' });
      return;
    }
  }
  
  // IsTeamBased validation
  if (isTeamBased !== undefined && typeof isTeamBased !== 'boolean') {
    res.status(400).json({ error: 'isTeamBased must be a boolean' });
    return;
  }
  
  next();
};

export const validateTournamentStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  
  if (!status) {
    res.status(400).json({ error: 'Tournament status is required' });
    return;
  }
  
  if (!validTournamentStatuses.includes(status as TournamentStatus)) {
    res.status(400).json({ 
      error: `Invalid tournament status. Must be one of: ${validTournamentStatuses.join(', ')}` 
    });
    return;
  }
  
  next();
};

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.body;
  
  // TeamId is optional, but if provided must be a string
  if (teamId !== undefined && typeof teamId !== 'string') {
    res.status(400).json({ error: 'Team ID must be a string' });
    return;
  }
  
  next();
};

/**
 * Validates team creation request
 */
export const validateTeamCreation = (req: Request, res: Response, next: NextFunction) => {
  const { name, description, logo } = req.body;
  
  // Team name is required
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Team name is required' });
    return;
  }
  
  if (name.length < 2 || name.length > 50) {
    res.status(400).json({ error: 'Team name must be between 2 and 50 characters' });
    return;
  }
  
  // Optional description
  if (description !== undefined && description !== null && typeof description !== 'string') {
    res.status(400).json({ error: 'Team description must be a string' });
    return;
  }
  
  // Optional logo URL
  if (logo !== undefined && logo !== null && typeof logo !== 'string') {
    res.status(400).json({ error: 'Team logo must be a string URL' });
    return;
  }
  
  next();
};

/**
 * Validates team update request
 */
export const validateTeamUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { name, description, logo } = req.body;
  
  // Optional name
  if (name !== undefined) {
    if (typeof name !== 'string') {
      res.status(400).json({ error: 'Team name must be a string' });
      return;
    }
    
    if (name.length < 2 || name.length > 50) {
      res.status(400).json({ error: 'Team name must be between 2 and 50 characters' });
      return;
    }
  }
  
  // Optional description
  if (description !== undefined && description !== null && typeof description !== 'string') {
    res.status(400).json({ error: 'Team description must be a string' });
    return;
  }
  
  // Optional logo URL
  if (logo !== undefined && logo !== null && typeof logo !== 'string') {
    res.status(400).json({ error: 'Team logo must be a string URL' });
    return;
  }
  
  next();
};

/**
 * Validates announcement creation request
 */
export const validateAnnouncement = (req: Request, res: Response, next: NextFunction) => {
  const { title, content, importance } = req.body;
  
  // Title is required
  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'Announcement title is required' });
    return;
  }
  
  if (title.length < 3 || title.length > 100) {
    res.status(400).json({ error: 'Announcement title must be between 3 and 100 characters' });
    return;
  }
  
  // Content is required
  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'Announcement content is required' });
    return;
  }
  
  if (content.length < 10 || content.length > 5000) {
    res.status(400).json({ error: 'Announcement content must be between 10 and 5000 characters' });
    return;
  }
  
  // Optional importance level
  if (importance !== undefined) {
    const validImportance = ['low', 'medium', 'high', 'urgent'];
    if (!validImportance.includes(importance)) {
      res.status(400).json({ 
        error: `Invalid importance level. Must be one of: ${validImportance.join(', ')}` 
      });
      return;
    }
  }
  
  next();
};

/**
 * Validates team member addition request
 */
export const validateTeamMember = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.body;
  
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }
  
  next();
};

/**
 * Validates participant seed update request
 */
export const validateParticipantSeed = (req: Request, res: Response, next: NextFunction) => {
  const { seed } = req.body;
  
  if (seed === undefined || seed === null) {
    res.status(400).json({ error: 'Seed value is required' });
    return;
  }
  
  const seedNumber = Number(seed);
  if (isNaN(seedNumber) || seedNumber < 1) {
    res.status(400).json({ error: 'Seed must be a positive number' });
    return;
  }
  
  next();
};

/**
 * Validates bracket generation request
 */
export const validateBracketGeneration = (req: Request, res: Response, next: NextFunction) => {
  const { seedMethod } = req.body;
  
  // Optional seedMethod
  if (seedMethod !== undefined) {
    const validMethods = ['random', 'manual', 'ranking'];
    if (!validMethods.includes(seedMethod)) {
      res.status(400).json({ 
        error: `Invalid seed method. Must be one of: ${validMethods.join(', ')}` 
      });
      return;
    }
  }
  
  next();
};

/**
 * Validates match scheduling request
 */
export const validateMatchScheduling = (req: Request, res: Response, next: NextFunction) => {
  const { matchId, scheduledTime, venueId } = req.body;
  
  // Match ID is required
  if (!matchId || typeof matchId !== 'string') {
    res.status(400).json({ error: 'Match ID is required' });
    return;
  }
  
  // Scheduled time is required
  if (!scheduledTime) {
    res.status(400).json({ error: 'Scheduled time is required' });
    return;
  }
  
  const scheduledTimeObj = new Date(scheduledTime);
  if (isNaN(scheduledTimeObj.getTime())) {
    res.status(400).json({ error: 'Invalid scheduled time format' });
    return;
  }
  
  // Optional venue ID
  if (venueId !== undefined && venueId !== null && typeof venueId !== 'string') {
    res.status(400).json({ error: 'Venue ID must be a string' });
    return;
  }
  
  next();
};

/**
 * Validates tournament join code for quick registration
 */
export const validateTournamentJoinCode = (req: Request, res: Response, next: NextFunction) => {
  const { joinCode } = req.body;
  
  if (!joinCode || typeof joinCode !== 'string') {
    res.status(400).json({ error: 'Tournament join code is required' });
    return;
  }
  
  if (joinCode.length < 6 || joinCode.length > 20) {
    res.status(400).json({ error: 'Invalid join code format' });
    return;
  }
  
  next();
};

/**
 * Validates judging assignment for a match
 */
export const validateJudgeAssignment = (req: Request, res: Response, next: NextFunction) => {
  const { judgeId, matchId } = req.body;
  
  // Judge ID is required
  if (!judgeId || typeof judgeId !== 'string') {
    res.status(400).json({ error: 'Judge ID is required' });
    return;
  }
  
  // Match ID is required
  if (!matchId || typeof matchId !== 'string') {
    res.status(400).json({ error: 'Match ID is required' });
    return;
  }
  
  next();
};