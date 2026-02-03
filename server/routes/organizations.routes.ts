import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendSuccess, sendNoContent } from '../utils/response.js';
import { requireIntParam } from '../utils/validation.js';
import * as organizationService from '../services/organizations.service.js';

const router = Router();

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  settings: z.record(z.unknown()).optional(),
});

router.get(
  '/current',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.organizationId;
      const organization = await organizationService.getCurrentOrganization(orgId);
      sendSuccess(res, organization);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/current',
  requireAuth,
  requireRole('admin'),
  validateRequest(updateOrgSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.organizationId;
      const organization = await organizationService.updateOrganization(orgId, req.body);
      sendSuccess(res, organization);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/current',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.organizationId;
      await organizationService.deleteOrganization(orgId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/current/stats',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.organizationId;
      const stats = await organizationService.getOrganizationStats(orgId);
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }
);

export const organizationRoutes = router;
