"use strict";
// import { Request, Response, NextFunction } from 'express';
// import prisma from '../lib/db';
// import { TeamRole } from '@prisma/client';
// export const requireTeamPermission = (requiredRole: TeamRole = TeamRole.MEMBER) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { id: teamId } = req.params;
//       const userId = req.user!.id;
//       // Check if user has admin role (admins can do anything)
//       if (req.user!.role === 'ADMIN') {
//         return next();
//       }
//       // Find user's role in the team
//       const membership = await prisma.teamMember.findUnique({
//         where: {
//           teamId_userId: {
//             teamId,
//             userId
//           }
//         }
//       });
//       // If no membership found, user is not on the team
//       if (!membership) {
//         return res.status(403).json({ error: 'You do not have permission to perform this action' });
//       }
//       // Check if user's role is sufficient
//       const roleHierarchy: Record<TeamRole, number> = {
//         [TeamRole.MEMBER]: 1,
//         [TeamRole.CAPTAIN]: 2,
//         [TeamRole.OWNER]: 3
//       };
//       if (roleHierarchy[membership.role] < roleHierarchy[requiredRole]) {
//         return res.status(403).json({ 
//           error: `This action requires ${requiredRole} permissions or higher` 
//         });
//       }
//       // Add team membership to request for use in handlers
//       req.teamRole = membership.role;
//       next();
//     } catch (error) {
//       console.error('Error in requireTeamPermission middleware:', error);
//       res.status(500).json({ error: 'Server error' });
//     }
//   };
