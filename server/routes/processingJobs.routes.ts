import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';
import { requireIntParam, parsePositiveInt } from '../utils/validation.js';
import * as processingJobService from '../services/processingJobs.service.js';

const router = Router({ mergeParams: true });

const createJobSchema = z.object({
  type: z.string().min(1),
  config: z.record(z.unknown()).optional(),
  dataSourceIds: z.array(z.number()).optional(),
});

router.get(
  '/:projectId/jobs',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const page = parsePositiveInt(req.query.page as string, 'page', 1);
      const limit = parsePositiveInt(req.query.limit as string, 'limit', 20);
      const { data, total } = await processingJobService.listJobs(
        projectId,
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
  '/:projectId/jobs/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      const job = await processingJobService.getJob(id, req.user!.organizationId);
      sendSuccess(res, job);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:projectId/jobs',
  requireAuth,
  validateRequest(createJobSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const job = await processingJobService.createJob(
        req.user!.organizationId,
        req.body
      );
      sendCreated(res, job);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:projectId/jobs/:id/cancel',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      const job = await processingJobService.cancelJob(id, req.user!.organizationId);
      sendSuccess(res, job);
    } catch (err) {
      next(err);
    }
  }
);

export const processingJobRoutes = router;
