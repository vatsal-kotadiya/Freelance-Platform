import { PaymentStatus } from '@prisma/client';
import prisma from '../lib/prisma';

export async function getPaymentByProject(projectId: string, userId: string) {
  const payment = await prisma.payment.findUnique({ where: { projectId } });
  if (!payment) throw new Error('Payment not found');
  if (payment.clientId !== userId && payment.freelancerId !== userId) throw new Error('Not authorized');
  return payment;
}

export async function releasePayment(paymentId: string, clientId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { project: true },
  });
  if (!payment) throw new Error('Payment not found');
  if (payment.clientId !== clientId) throw new Error('Not authorized');
  if (payment.project.status !== 'COMPLETED') throw new Error('Project must be completed before releasing payment');
  if (payment.status === 'RELEASED') throw new Error('Payment already released');

  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.RELEASED },
  });
}
