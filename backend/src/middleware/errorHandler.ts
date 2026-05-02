import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten().fieldErrors });
    return;
  }
  if ((err as any)?.name === 'MulterError') {
    const code = (err as any).code as string;
    if (code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large. Max 5 MB per image.' });
      return;
    }
    if (code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ error: 'Too many files. Max 5 images allowed.' });
      return;
    }
    res.status(400).json({ error: (err as any).message });
    return;
  }
  if (err instanceof Error && err.message.includes('Only JPG and PNG')) {
    res.status(400).json({ error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  const stack   = err instanceof Error ? err.stack   : undefined;
  console.error('[error]', message);
  if (stack) console.error(stack);
  res.status(500).json({ error: 'Internal server error', detail: message });
}
