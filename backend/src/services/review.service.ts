import prisma from '../lib/prisma';

async function assertReviewAccess(projectId: string, reviewerId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { bids: { where: { status: 'ACCEPTED' } } },
  });
  if (!project) throw new Error('Project not found');
  if (project.status !== 'COMPLETED') throw new Error('Project must be completed to leave a review');

  const isClient = project.clientId === reviewerId;
  const isAcceptedFreelancer = project.bids.some((b) => b.freelancerId === reviewerId);
  if (!isClient && !isAcceptedFreelancer) throw new Error('Not authorized');

  // Return the reviewee: client reviews the accepted freelancer, freelancer reviews the client
  const revieweeId = isClient ? project.bids[0]?.freelancerId : project.clientId;
  if (!revieweeId) throw new Error('No eligible reviewee found');

  return { revieweeId };
}

export async function createReview(
  reviewerId: string,
  projectId: string,
  rating: number,
  comment: string
) {
  const { revieweeId } = await assertReviewAccess(projectId, reviewerId);

  const existing = await prisma.review.findUnique({
    where: { reviewerId_projectId: { reviewerId, projectId } },
  });
  if (existing) throw new Error('You have already reviewed this project');

  return prisma.review.create({
    data: { reviewerId, revieweeId, projectId, rating, comment },
    include: {
      reviewer: { select: { id: true, name: true, role: true } },
      reviewee: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, title: true } },
    },
  });
}

export async function getReviewsForUser(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: userId },
    include: {
      reviewer: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return { reviews, averageRating: avg, totalReviews: reviews.length };
}

export async function getMyReviewForProject(projectId: string, reviewerId: string) {
  return prisma.review.findUnique({
    where: { reviewerId_projectId: { reviewerId, projectId } },
  });
}

export async function getProjectReviews(projectId: string) {
  return prisma.review.findMany({
    where: { projectId },
    include: {
      reviewer: { select: { id: true, name: true, role: true } },
      reviewee: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}
