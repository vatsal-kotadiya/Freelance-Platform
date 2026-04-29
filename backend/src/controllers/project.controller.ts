import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as projectService from '../services/project.service';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  budget: z.coerce.number().positive(),
});

const updateSchema = createSchema.partial();

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const files = (req.files as Express.Multer.File[]) ?? [];
    const sampleImages = files.map((f) => f.filename);
    const project = await projectService.createProject(req.user!.userId, data.title, data.description, data.budget, sampleImages);
    res.status(201).json(project);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = (req.query.search as string) || '';
    const result = await projectService.listOpenProjects(page, limit, search);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    res.json(project);
  } catch (err) { next(err); }
}

export async function suggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || '';
    const result = await projectService.getOpenProjectSuggestions(q);
    res.json(result);
  } catch (err) { next(err); }
}

export async function mineSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || '';
    const suggestions = await projectService.getClientProjectSuggestions(req.user!.userId, q);
    res.json(suggestions);
  } catch (err) { next(err); }
}

export async function getMine(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = (req.query.search as string) || '';
    const result = await projectService.getClientProjects(req.user!.userId, page, limit, search);
    res.json(result);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body);
    const files = (req.files as Express.Multer.File[]) ?? [];
    const newImages = files.map((f) => f.filename);
    const raw = req.body.keepImages;
    const keepImages: string[] = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
    const project = await projectService.updateProject(req.params.id, req.user!.userId, data, keepImages, newImages);
    res.json(project);
  } catch (err) {
    if ((err as Error).message === 'Not authorized') { res.status(403).json({ error: 'Not authorized' }); return; }
    next(err);
  }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.markProjectComplete(req.params.id, req.user!.userId);
    res.json(project);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg.includes('must be in progress')) { res.status(400).json({ error: msg }); return; }
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await projectService.deleteProject(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg.includes('cannot be deleted')) { res.status(400).json({ error: msg }); return; }
    if (msg === 'Project not found') { res.status(404).json({ error: msg }); return; }
    next(err);
  }
}
