import api from './axios';

export const getPayment = (projectId: string) =>
  api.get(`/payments/project/${projectId}`).then((r) => r.data);

export const releasePayment = (paymentId: string) =>
  api.patch(`/payments/${paymentId}/release`).then((r) => r.data);

export const submitDelivery = (paymentId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post(`/payments/${paymentId}/submit-delivery`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const rejectDelivery = (paymentId: string, reason?: string) =>
  api.post(`/payments/${paymentId}/reject-delivery`, { reason }).then((r) => r.data);

export const createRazorpayOrder = (paymentId: string) =>
  api.post(`/payments/${paymentId}/create-order`).then((r) => r.data);

export const verifyPayment = (
  paymentId: string,
  data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
) => api.post(`/payments/${paymentId}/verify`, data).then((r) => r.data);

export const downloadDelivery = async (paymentId: string, fileName: string) => {
  const res = await api.get(`/payments/${paymentId}/download-delivery`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
