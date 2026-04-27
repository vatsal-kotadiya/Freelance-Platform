import api from './axios';

export const getPayment = (projectId: string) =>
  api.get(`/payments/project/${projectId}`).then((r) => r.data);

export const releasePayment = (paymentId: string) =>
  api.patch(`/payments/${paymentId}/release`).then((r) => r.data);
