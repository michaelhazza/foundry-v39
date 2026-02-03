import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { requireIntParam, parsePositiveInt } from '../utils/validation.js';
import * as dataSourceService from '../services/dataSources.service.js';

const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const createApiSourceSchema = z.object({
  name: z.string().min(1),
  type: z.literal('api'),
  config: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST']).optional(),
    headers: z.record(z.string()).optional(),
    body: z.unknown().optional(),
  }),
});

const updateDataSourceSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.record(z.unknown()).optional(),
});

router.get(
  '/:projectId/data-sources',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const page = parsePositiveInt(req.query.page as string, 'page', 1);
      const limit = parsePositiveInt(req.query.limit as string, 'limit', 20);
      const { data, total } = await dataSourceService.listDataSources(
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
  '/:projectId/data-sources/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      const dataSource = await dataSourceService.getDataSource(
        id,
        projectId,
        req.user!.organizationId
      );
      sendSuccess(res, dataSource);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:projectId/data-sources/upload',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const dataSource = await dataSourceService.uploadFile(
        projectId,
        req.user!.organizationId,
        req.body
      );
      sendCreated(res, dataSource);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:projectId/data-sources/api',
  requireAuth,
  validateRequest(createApiSourceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const dataSource = await dataSourceService.createApiSource(
        projectId,
        req.user!.organizationId,
        req.body
      );
      sendCreated(res, dataSource);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:projectId/data-sources/:id',
  requireAuth,
  validateRequest(updateDataSourceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      const dataSource = await dataSourceService.updateDataSource(
        id,
        projectId,
        req.user!.organizationId,
        req.body
      );
      sendSuccess(res, dataSource);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:projectId/data-sources/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      await dataSourceService.deleteDataSource(id, projectId, req.user!.organizationId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
);

export const dataSourceRoutes = router;
