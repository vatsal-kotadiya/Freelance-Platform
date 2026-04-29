import { PaymentStatus, ProjectStatus } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { DELIVERY_ALLOWED_MIMES, DELIVERY_ALLOWED_EXTS } from '../lib/multer';

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.includes('xxxx') || key_secret.includes('xxxx')) {
    throw new Error('Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.');
  }
  return new Razorpay({ key_id, key_secret });
}

export async function getPaymentByProject(projectId: string, userId: string) {
  const payment = await prisma.payment.findUnique({ where: { projectId } });
  if (!payment) throw new Error('Payment not found');
  if (payment.clientId !== userId && payment.freelancerId !== userId) throw new Error('Not authorized');
  return payment;
}

export async function submitDelivery(
  paymentId: string,
  clientId: string,
  file: Express.Multer.File,
) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!DELIVERY_ALLOWED_MIMES.has(file.mimetype) && !DELIVERY_ALLOWED_EXTS.has(ext)) {
    fs.unlinkSync(file.path);
    throw new Error('Invalid file type. Allowed: PDF, ZIP, DOC, DOCX, PNG, JPG, TXT');
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    fs.unlinkSync(file.path);
    throw new Error('Payment not found');
  }
  if (payment.clientId !== clientId) {
    fs.unlinkSync(file.path);
    throw new Error('Not authorized');
  }
  if (payment.status === PaymentStatus.RELEASED) {
    fs.unlinkSync(file.path);
    throw new Error('Payment already released, cannot re-upload');
  }
  if (
    payment.status !== PaymentStatus.PENDING &&
    payment.status !== PaymentStatus.WORK_SUBMITTED &&
    payment.status !== PaymentStatus.WORK_REJECTED
  ) {
    fs.unlinkSync(file.path);
    throw new Error('Cannot upload delivery at this stage');
  }

  // Remove old delivery file from disk when re-uploading
  if (payment.deliveryFileUrl) {
    const oldPath = path.join(process.cwd(), 'uploads', payment.deliveryFileUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      deliveryFileUrl: file.filename,
      deliveryFileName: file.originalname,
      status: PaymentStatus.WORK_SUBMITTED,
      submittedAt: new Date(),
      rejectionReason: null,
    },
  });
}

export async function rejectDelivery(
  paymentId: string,
  freelancerId: string,
  reason?: string,
) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error('Payment not found');
  if (payment.freelancerId !== freelancerId) throw new Error('Not authorized');
  if (payment.status !== PaymentStatus.WORK_SUBMITTED) {
    throw new Error('Work is not in submitted state');
  }

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.WORK_REJECTED,
      rejectionReason: reason?.trim() || null,
    },
  });
}

export async function createRazorpayOrder(paymentId: string, freelancerId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error('Payment not found');
  if (payment.freelancerId !== freelancerId) throw new Error('Not authorized');

  if (payment.status === PaymentStatus.PENDING) {
    throw new Error('Client has not uploaded the completed work yet');
  }
  if (payment.status === PaymentStatus.WORK_REJECTED) {
    throw new Error('Work was rejected. Waiting for client to re-upload');
  }
  if (payment.status === PaymentStatus.RELEASED) {
    throw new Error('Payment has already been made for this project');
  }
  if (payment.status !== PaymentStatus.WORK_SUBMITTED) {
    throw new Error('Cannot create payment order at this stage');
  }

  const order = await getRazorpay().orders.create({
    amount: Math.round(payment.amount * 100),
    currency: 'INR',
    receipt: paymentId,
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID!,
  };
}

export async function verifyRazorpayPayment(
  paymentId: string,
  freelancerId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { project: true },
  });
  if (!payment) throw new Error('Payment not found');
  if (payment.freelancerId !== freelancerId) throw new Error('Not authorized');

  // Idempotency: already released
  if (payment.status === PaymentStatus.RELEASED) return payment;

  if (payment.status !== PaymentStatus.WORK_SUBMITTED) {
    throw new Error('Payment cannot be processed at this stage');
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new Error('Payment verification failed: invalid signature');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.RELEASED, paidAt: new Date() },
    });
    await tx.project.update({
      where: { id: payment.projectId },
      data: { status: ProjectStatus.COMPLETED },
    });
    return updated;
  });
}

export async function getDeliveryFile(paymentId: string, userId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error('Payment not found');
  if (payment.clientId !== userId && payment.freelancerId !== userId) {
    throw new Error('Not authorized');
  }
  if (payment.status !== PaymentStatus.RELEASED) {
    throw new Error('Delivery file is only available after payment is released');
  }
  if (!payment.deliveryFileUrl) throw new Error('No delivery file found');

  const filePath = path.join(process.cwd(), 'uploads', payment.deliveryFileUrl);
  if (!fs.existsSync(filePath)) throw new Error('Delivery file not found on disk');

  return { filePath, fileName: payment.deliveryFileName ?? payment.deliveryFileUrl };
}

// Legacy direct-release kept for backward safety; real path is Razorpay verify
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
