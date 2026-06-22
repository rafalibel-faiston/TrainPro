import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

// Valida req.body com um schema do Zod e devolve 422 com os erros formatados.
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        error: 'Dados inválidos.',
        issues: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}
