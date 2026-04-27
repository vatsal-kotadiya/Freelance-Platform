import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { bids: { where: { status: 'ACCEPTED' } } },
  });
  if (!project) throw new Error('Project not found');

  const isClient = project.clientId === userId;
  const isAcceptedFreelancer = project.bids.some((b) => b.freelancerId === userId);
  if (!isClient && !isAcceptedFreelancer) throw new Error('Not authorized');
  if (project.status === 'OPEN') throw new Error('File sharing is only available for active projects');

  return project;
}

export async function uploadFile(
  projectId: string,
  uploaderId: string,
  file: Express.Multer.File
) {
  await assertProjectAccess(projectId, uploaderId);

  return prisma.fileAttachment.create({
    data: {
      filename: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      uploaderId,
      projectId,
    },
    include: {
      uploader: { select: { id: true, name: true } },
    },
  });
}

export async function getProjectFiles(projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId);

  return prisma.fileAttachment.findMany({
    where: { projectId },
    include: { uploader: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFileForDownload(fileId: string, userId: string) {
  const file = await prisma.fileAttachment.findUnique({
    where: { id: fileId },
    include: { project: { include: { bids: { where: { status: 'ACCEPTED' } } } } },
  });
  if (!file) throw new Error('File not found');

  const isClient = file.project.clientId === userId;
  const isAcceptedFreelancer = file.project.bids.some((b) => b.freelancerId === userId);
  if (!isClient && !isAcceptedFreelancer) throw new Error('Not authorized');

  const filePath = path.join(process.cwd(), 'uploads', file.storedName);
  if (!fs.existsSync(filePath)) throw new Error('File not found on disk');

  return { file, filePath };
}

export async function deleteFile(fileId: string, userId: string) {
  const file = await prisma.fileAttachment.findUnique({ where: { id: fileId } });
  if (!file) throw new Error('File not found');
  if (file.uploaderId !== userId) throw new Error('Not authorized');

  const filePath = path.join(process.cwd(), 'uploads', file.storedName);
  await prisma.fileAttachment.delete({ where: { id: fileId } });

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
