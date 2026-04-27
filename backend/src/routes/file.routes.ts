import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../lib/multer';
import { uploadFile, getProjectFiles, downloadFile, deleteFile } from '../controllers/file.controller';

const router = Router();

router.use(authMiddleware);

function handleMulterError(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 10 MB.' : err.message;
    res.status(400).json({ error: msg });
    return;
  }
  next(err);
}

router.post('/projects/:projectId/files', upload.single('file'), uploadFile, handleMulterError);
router.get('/projects/:projectId/files', getProjectFiles);
router.get('/files/:fileId/download', downloadFile);
router.delete('/files/:fileId', deleteFile);

export default router;
