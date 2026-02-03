import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendSuccess, sendNoContent, sendPaginated } from '../utils/response.js';
import { requireIntParam, parsePositiveInt } from '../utils/validation.js';
import * as datasetService from '../services/datasets.service.js';

const router = Router({ mergeParams: true });

router.get(
  '/:projectId/datasets',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const page = parsePositiveInt(req.query.page as string, 'page', 1);
      const limit = parsePositiveInt(req.query.limit as string, 'limit', 20);
      const { data, total } = await datasetService.listDatasets(
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
  '/:projectId/datasets/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      const dataset = await datasetService.getDataset(id, projectId, req.user!.organizationId);
      sendSuccess(res, dataset);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:projectId/datasets/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      await datasetService.deleteDataset(id, projectId, req.user!.organizationId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:projectId/datasets/:id/download',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      const filePath = await datasetService.getDownloadPath(
        id,
        projectId,
        req.user!.organizationId
      );
      res.download(filePath);
    } catch (err) {
      next(err);
    }
  }
);

export const datasetRoutes = router;
