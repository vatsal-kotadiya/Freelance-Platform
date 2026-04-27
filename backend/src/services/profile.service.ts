import prisma from '../lib/prisma';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      bio: true,
      skills: true,
      avatarUrl: true,
      location: true,
      hourlyRate: true,
      createdAt: true,
      portfolioItems: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!user) throw new Error('User not found');
  return user;
}

export async function updateProfile(
  userId: string,
  data: {
    bio?: string;
    skills?: string[];
    avatarUrl?: string;
    location?: string;
    hourlyRate?: number | null;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      role: true,
      bio: true,
      skills: true,
      avatarUrl: true,
      location: true,
      hourlyRate: true,
      createdAt: true,
      portfolioItems: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function addPortfolioItem(
  userId: string,
  title: string,
  description: string,
  url?: string
) {
  return prisma.portfolioItem.create({
    data: { userId, title, description, url: url || null },
  });
}

export async function updatePortfolioItem(
  itemId: string,
  userId: string,
  data: { title: string; description: string; url?: string }
) {
  const item = await prisma.portfolioItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Portfolio item not found');
  if (item.userId !== userId) throw new Error('Not authorized');
  return prisma.portfolioItem.update({
    where: { id: itemId },
    data: { title: data.title, description: data.description, url: data.url || null },
  });
}

export async function deletePortfolioItem(itemId: string, userId: string) {
  const item = await prisma.portfolioItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Portfolio item not found');
  if (item.userId !== userId) throw new Error('Not authorized');
  await prisma.portfolioItem.delete({ where: { id: itemId } });
}
