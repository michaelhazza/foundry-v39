import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, statusCode: number = 200) => {
  res.status(statusCode).json({
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
};

export const sendCreated = (res: Response, data: any) => {
  sendSuccess(res, data, 201);
};

export const sendNoContent = (res: Response) => {
  res.status(204).send();
};

export const sendPaginated = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  pageSize: number
) => {
  res.json({
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      timestamp: new Date().toISOString()
    }
  });
};
