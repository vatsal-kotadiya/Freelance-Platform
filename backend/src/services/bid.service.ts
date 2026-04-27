import { BidStatus, NotificationType, ProjectStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { createNotification } from './notification.service';

export async function placeBid(freelancerId: string, projectId: string, amount: number, proposal: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');
  if (project.status !== 'OPEN') throw new Error('Project is not open for bids');

  const existing = await prisma.bid.findUnique({ where: { freelancerId_projectId: { freelancerId, projectId } } });
  if (existing) throw new Error('You have already placed a bid on this project');

  const bid = await prisma.bid.create({
    data: { amount, proposal, freelancerId, projectId },
    include: { freelancer: { select: { id: true, name: true } } },
  });

  await createNotification(
    project.clientId,
    NotificationType.BID_PLACED,
    `${bid.freelancer.name} placed a bid on your project "${project.title}"`,
    projectId
  );

  return bid;
}

export async function getProjectBids(projectId: string, clientId: string, page = 1, limit = 10) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');
  if (project.clientId !== clientId) throw new Error('Not authorized');

  const where = { projectId };
  const [data, total] = await Promise.all([
    prisma.bid.findMany({
      where,
      include: { freelancer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bid.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function acceptBid(bidId: string, clientId: string) {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { project: true },
  });
  if (!bid) throw new Error('Bid not found');
  if (bid.project.clientId !== clientId) throw new Error('Not authorized');
  if (bid.project.status !== 'OPEN') throw new Error('Project is no longer open');

  const result = await prisma.$transaction(async (tx) => {
    await tx.bid.updateMany({
      where: { projectId: bid.projectId, id: { not: bidId } },
      data: { status: BidStatus.REJECTED },
    });

    const acceptedBid = await tx.bid.update({
      where: { id: bidId },
      data: { status: BidStatus.ACCEPTED },
    });

    await tx.project.update({
      where: { id: bid.projectId },
      data: { status: ProjectStatus.IN_PROGRESS },
    });

    await tx.payment.create({
      data: {
        amount: bid.amount,
        projectId: bid.projectId,
        clientId,
        freelancerId: bid.freelancerId,
      },
    });

    return acceptedBid;
  });

  await createNotification(
    bid.freelancerId,
    NotificationType.BID_ACCEPTED,
    `Your bid on "${bid.project.title}" was accepted! The project is now in progress.`,
    bid.projectId
  );

  return result;
}

export async function getFreelancerBidForProject(projectId: string, freelancerId: string) {
  return prisma.bid.findUnique({
    where: { freelancerId_projectId: { freelancerId, projectId } },
  });
}

export async function getFreelancerBids(freelancerId: string, page = 1, limit = 10) {
  const where = { freelancerId };
  const [data, total] = await Promise.all([
    prisma.bid.findMany({
      where,
      include: {
        project: {
          select: { id: true, title: true, status: true, client: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bid.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}
