import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { requireIntParam, parsePositiveInt } from '../utils/validation.js';
import * as userService from '../services/users.service.js';

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
  name: z.string().min(1).optional(),
});

router.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.getCurrentUser(req.user!.userId);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parsePositiveInt(req.query.page as string, 'page', 1);
      const limit = parsePositiveInt(req.query.limit as string, 'limit', 20);
      const { data, total } = await userService.listUsers(req.user!.organizationId, { page, pageSize: limit });
      sendPaginated(res, data, total, page, limit);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id',
  requireAuth,
  validateRequest(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = requireIntParam(req.params.id, 'id');
      const user = await userService.updateUser(id, req.user!.organizationId, req.body);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = requireIntParam(req.params.id, 'id');
      await userService.deleteUser(id, req.user!.organizationId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/invite',
  requireAuth,
  requireRole('admin'),
  validateRequest(inviteUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.inviteUser(req.user!.organizationId, req.body);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export const userRoutes = router;
