import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/db';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ error: 'Insufficient permissions: Admin role required' });
    return;
  }
  next();
};

export const requireOrganizer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ error: 'Insufficient permissions: Admin role required' });
    return;
  }
  next();
};

export const requireJudgeOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Admin can always verify matches
    if (req.user.isAdmin) {
      next();
      return;
    }
    
    const { id: matchId } = req.params;
    
    // Get the match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true
      }
    });
    
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    
    // Check if user is tournament host (organizer)
    if (match.tournament.hostId === req.user.id) {
      next();
      return;
    }
    
    // Check if user is assigned judge for this match
    if (match.judgeId === req.user.id) {
      next();
      return;
    }
    
    res.status(403).json({ 
      error: 'Insufficient permissions: Only admins, tournament hosts, or assigned judges can perform this action' 
    });
  } catch (error) {
    console.error('Error in requireJudgeOrAdmin middleware:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
