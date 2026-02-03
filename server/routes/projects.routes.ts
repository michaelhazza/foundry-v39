import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { requireIntParam, parsePositiveInt } from '../utils/validation.js';
import { projectsService } from '../services/projects.service.js';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parsePositiveInt(req.query.page as string, 'page', 1);
      const limit = parsePositiveInt(req.query.limit as string, 'limit', 20);
      const { data, total } = await projectsService.listProjects(
        req.user!.organizationId,
        { page, pageSize: limit }
      );
      sendPaginated(res, data, total, page, limit);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = requireIntParam(req.params.id, 'id');
      const project = await projectsService.getProject(id, req.user!.organizationId);
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  requireAuth,
  validateRequest(createProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectsService.createProject(
        req.user!.organizationId,
        req.user!.userId,
        req.body
      );
      sendCreated(res, project);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id',
  requireAuth,
  validateRequest(updateProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = requireIntParam(req.params.id, 'id');
      const project = await projectsService.updateProject(id, req.user!.organizationId, req.body);
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = requireIntParam(req.params.id, 'id');
      await projectsService.deleteProject(id, req.user!.organizationId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
);

export const projectRoutes = router;
