import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { requireIntParam } from '../utils/validation.js';
import * as schemaMappingService from '../services/schemaMappings.service.js';

const router = Router({ mergeParams: true });

const createSchemaMappingSchema = z.object({
  name: z.string().min(1),
  sourceSchema: z.record(z.unknown()),
  targetSchema: z.record(z.unknown()),
  mappings: z.array(
    z.object({
      sourceField: z.string(),
      targetField: z.string(),
      transform: z.string().optional(),
    })
  ),
});

const updateSchemaMappingSchema = z.object({
  name: z.string().min(1).optional(),
  sourceSchema: z.record(z.unknown()).optional(),
  targetSchema: z.record(z.unknown()).optional(),
  mappings: z
    .array(
      z.object({
        sourceField: z.string(),
        targetField: z.string(),
        transform: z.string().optional(),
      })
    )
    .optional(),
});

router.get(
  '/:projectId/schema-mappings',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const schemaMappings = await schemaMappingService.getSchemaMapping(
        projectId,
        req.user!.organizationId
      );
      sendSuccess(res, schemaMappings);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:projectId/schema-mappings',
  requireAuth,
  validateRequest(createSchemaMappingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const schemaMapping = await schemaMappingService.createOrUpdateSchemaMapping(
        projectId,
        req.user!.organizationId,
        req.body
      );
      sendCreated(res, schemaMapping);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:projectId/schema-mappings/:id',
  requireAuth,
  validateRequest(updateSchemaMappingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      const schemaMapping = await schemaMappingService.createOrUpdateSchemaMapping(
        projectId,
        req.user!.organizationId,
        req.body
      );
      sendSuccess(res, schemaMapping);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:projectId/schema-mappings/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = requireIntParam(req.params.projectId, 'projectId');
      const id = requireIntParam(req.params.id, 'id');
      await schemaMappingService.deleteSchemaMapping(id, projectId, req.user!.organizationId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
);

export const schemaMappingRoutes = router;
