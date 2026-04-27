import prisma from '../lib/prisma';

export async function getClientDashboard(clientId: string) {
  const projects = await prisma.project.findMany({
    where: { clientId },
    include: {
      _count: { select: { bids: true } },
      payment: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const open = projects.filter((p) => p.status === 'OPEN').length;
  const inProgress = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const completed = projects.filter((p) => p.status === 'COMPLETED').length;

  return { stats: { open, inProgress, completed }, projects };
}

export async function getFreelancerDashboard(freelancerId: string) {
  const bids = await prisma.bid.findMany({
    where: { freelancerId },
    include: {
      project: {
        select: { id: true, title: true, status: true, budget: true, client: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const pending = bids.filter((b) => b.status === 'PENDING').length;
  const accepted = bids.filter((b) => b.status === 'ACCEPTED').length;
  const rejected = bids.filter((b) => b.status === 'REJECTED').length;

  return { stats: { pending, accepted, rejected }, bids };
}
