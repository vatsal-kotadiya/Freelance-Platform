import { Request, Response, NextFunction } from 'express';
import * as fileService from '../services/file.service';

export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }
    const file = await fileService.uploadFile(req.params.projectId, req.user!.userId, req.file);
    res.status(201).json(file);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg === 'Project not found') { res.status(404).json({ error: msg }); return; }
    if (msg.includes('only available')) { res.status(400).json({ error: msg }); return; }
    next(err);
  }
}

export async function getProjectFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const files = await fileService.getProjectFiles(req.params.projectId, req.user!.userId);
    res.json(files);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg === 'Project not found') { res.status(404).json({ error: msg }); return; }
    next(err);
  }
}

export async function downloadFile(req: Request, res: Response, next: NextFunction) {
  try {
    const { file, filePath } = await fileService.getFileForDownload(req.params.fileId, req.user!.userId);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.sendFile(filePath);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg === 'File not found' || msg === 'File not found on disk') {
      res.status(404).json({ error: 'File not found' }); return;
    }
    next(err);
  }
}

export async function deleteFile(req: Request, res: Response, next: NextFunction) {
  try {
    await fileService.deleteFile(req.params.fileId, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg === 'File not found') { res.status(404).json({ error: msg }); return; }
    next(err);
  }
}
