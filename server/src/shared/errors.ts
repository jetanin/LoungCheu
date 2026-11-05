import type { ErrorRequestHandler } from 'express';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string,
    public readonly publicMessage: string, public readonly fields: Record<string, string[]> = {}) {
    super(code);
  }
}

export const invalidInput = () => new ApiError(400, 'INVALID_INPUT', 'ข้อมูลคำขอไม่ถูกต้อง');

export const apiErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const failure = error instanceof ApiError ? error
    : error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large'
      ? invalidInput()
      : new ApiError(500, 'INTERNAL_ERROR', 'ระบบขัดข้อง กรุณาลองใหม่');
  res.status(failure.status).json({ error: {
    code: failure.code, message: failure.publicMessage, fields: failure.fields,
  } });
};
