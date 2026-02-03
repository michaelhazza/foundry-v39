import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { requireIntParam } from '../utils/validation.js';
import * as deidentificationRuleService from '../services/deidentificationRules.service.js';

const router = Router({ mergeParams: true });

const createRuleSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  field: z.string().min(1),
  method: z.string().min(1),
  config: z.record(z.unknown()).optional(),
});

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  field: z.string().min(1).optional(),
  method: z.string().min(1).optional(),
  config: z.record(z.unknown()).optional(),
});

router.get(
  '/:projectId/deidentification-rules',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const data = await deidentificationRuleService.listRules(
        projectId,
        req.user!.organizationId
      );
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:projectId/deidentification-rules',
  requireAuth,
  validateRequest(createRuleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const rule = await deidentificationRuleService.createRule(
        projectId,
        req.user!.organizationId,
        req.body
      );
      sendCreated(res, rule);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:projectId/deidentification-rules/:id',
  requireAuth,
  validateRequest(updateRuleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      const rule = await deidentificationRuleService.updateRule(
        id,
        projectId,
        req.user!.organizationId,
        req.body
      );
      sendSuccess(res, rule);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:projectId/deidentification-rules/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      await deidentificationRuleService.deleteRule(id, projectId, req.user!.organizationId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
);

export const deidentificationRuleRoutes = router;
