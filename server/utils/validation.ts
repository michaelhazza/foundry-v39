import { BadRequestError } from '../errors/index.js';

export function requireIntParam(value: string | undefined, paramName: string): number {
  if (!value) throw new BadRequestError(`${paramName} is required`);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) throw new BadRequestError(`${paramName} must be a valid integer`);
  return parsed;
}

export function parseQueryInt(value: string | undefined, paramName: string): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) throw new BadRequestError(`${paramName} must be a valid integer`);
  return parsed;
}

export function parsePositiveInt(
  value: string | undefined,
  paramName: string,
  defaultValue: number
): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) {
    throw new BadRequestError(`${paramName} must be a positive integer`);
  }
  return parsed;
}
