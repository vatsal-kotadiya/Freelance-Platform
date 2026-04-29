import { useEffect, useState, useRef, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { getProject } from '../api/projects';
import { getProjectBids, placeBid, acceptBid, rejectBid, getMyBidForProject } from '../api/bids';
import { getMessages } from '../api/messages';
import {
  getPayment,
  submitDelivery,
  rejectDelivery,
  createRazorpayOrder,
  verifyPayment,
  downloadDelivery,
} from '../api/payments';
import { createReview, getMyReviewForProject, getProjectReviews, Review } from '../api/reviews';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import StarRating from '../components/StarRating';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

const BIDS_PAGE_SIZE = 10;

const DELIVERY_ALLOWED_EXTS = ['.pdf', '.zip', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt'];
const DELIVERY_MAX_SIZE = 200 * 1024 * 1024;

let socket: Socket | null = null;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuthStore();

  const [project, setProject] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [bidsPage, setBidsPage] = useState(1);
  const [bidsTotalPages, setBidsTotalPages] = useState(1);
  const [bidsTotal, setBidsTotal] = useState(0);

  const [messages, setMessages] = useState<any[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);

  const [payment, setPayment] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidProposal, setBidProposal] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [bidError, setBidError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [myBid, setMyBid] = useState<any>(null);

  const [myReview, setMyReview] = useState<Review | null>(null);
  const [projectReviews, setProjectReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Panel toggles
  const [showReviews, setShowReviews] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Delivery state
  const [deliveryUploading, setDeliveryUploading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const deliveryInputRef = useRef<HTMLInputElement>(null);

  // Payment / rejection state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Image lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }
  function closeLightbox() { setLightboxOpen(false); }
  function lightboxPrev() { setLightboxIndex((i) => (i - 1 + (project?.sampleImages?.length ?? 1)) % (project?.sampleImages?.length ?? 1)); }
  function lightboxNext() { setLightboxIndex((i) => (i + 1) % (project?.sampleImages?.length ?? 1)); }

  // Overflow lock — only depends on open/close, never on index
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  // Guarantee overflow is cleared when the page unmounts (e.g. back-navigation while open)
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Keyboard navigation — re-registers when index changes so prev/next are always fresh
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, lightboxIndex]);

  const isClient = user?.role === 'CLIENT';
  const isProjectOwner = isClient && project?.clientId === user?.id;
  const hasChat = project?.status === 'IN_PROGRESS' || project?.status === 'COMPLETED';

  function fetchBids(p: number) {
    if (!id) return;
    getProjectBids(id, p, BIDS_PAGE_SIZE)
      .then((res) => {
        setBids(res.data);
        setBidsPage(res.page);
        setBidsTotalPages(res.totalPages);
        setBidsTotal(res.total);
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (!id) return;

    // Reset all project-specific state so stale data from a previous project never bleeds in
    setProject(null);
    setFetchError('');
    setLoading(true);
    setBids([]);
    setBidsPage(1);
    setBidsTotalPages(1);
    setBidsTotal(0);
    setPayment(null);
    setMyBid(null);
    setMyReview(null);
    setProjectReviews([]);
    setMessages([]);
    setHasMoreMessages(false);
    setShowReviews(false);
    setChatOpen(false);
    setBidError('');
    setDeliveryError('');
    setPaymentError('');
    setShowRejectForm(false);
    setRejectReason('');
    setPaymentLoading(false);
    setDeliveryUploading(false);

    Promise.all([
      getProject(id).then(setProject).catch((err) => {
        const status = err?.response?.status;
        setFetchError(status === 404 ? 'Project not found.' : 'Failed to load project. Please try again.');
      }),
      ...(isClient ? [fetchBids(1)] : []),
      ...(!isClient ? [getMyBidForProject(id).then(setMyBid).catch(() => {})] : []),
      getMessages(id).then((res) => {
        setMessages(res.data);
        setHasMoreMessages(res.hasMore);
      }).catch(() => {}),
      getMyReviewForProject(id).then(setMyReview).catch(() => {}),
    ]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!project || !hasChat || !token) return;
    socket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token } });
    socket.emit('joinRoom', id);
    socket.on('newMessage', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => { socket?.disconnect(); socket = null; };
  }, [project?.status, id, token]);

  useEffect(() => {
    if (hasChat && project) {
      getPayment(id!).then(setPayment).catch(() => {});
    }
    if (project?.status === 'COMPLETED' && id) {
      getProjectReviews(id).then(setProjectReviews).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.status, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [chatOpen]);

  async function handleLoadEarlier() {
    if (!id || messages.length === 0) return;
    setLoadingEarlier(true);
    const cursor = messages[0].id;
    const container = chatContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    try {
      const res = await getMessages(id, cursor);
      setMessages((prev) => [...res.data, ...prev]);
      setHasMoreMessages(res.hasMore);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
      });
    } catch { /* ignore */ } finally {
      setLoadingEarlier(false);
    }
  }

  async function handlePlaceBid(e: FormEvent) {
    e.preventDefault();
    setBidError('');
    try {
      const bid = await placeBid(id!, { amount: Number(bidAmount), proposal: bidProposal });
      setMyBid(bid);
      setBidAmount(''); setBidProposal('');
    } catch (err: any) {
      setBidError(err.response?.data?.error ?? 'Failed to place bid');
    }
  }

  async function handleAcceptBid(bidId: string) {
    try {
      await acceptBid(bidId);
      const updated = await getProject(id!);
      setProject(updated);
      fetchBids(1);
      getPayment(id!).then(setPayment).catch(() => {});
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to accept bid');
    }
  }

  async function handleRejectBid(bidId: string) {
    try {
      const updated = await rejectBid(bidId);
      setBids((prev) => prev.map((b) => (b.id === bidId ? { ...b, status: updated.status } : b)));
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to reject bid');
    }
  }

  function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit('sendMessage', { projectId: id, content: chatInput.trim() });
    setChatInput('');
  }

  async function handleSubmitReview(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setReviewError('');
    setReviewLoading(true);
    try {
      const review = await createReview(id, reviewRating, reviewComment);
      setMyReview(review);
      setProjectReviews((prev) => [...prev, review]);
      setReviewComment('');
    } catch (err: any) {
      setReviewError(err.response?.data?.error ?? 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  }

  // ─── Delivery upload (freelancer) ───────────────────────────────────────────
  async function handleDeliveryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !payment) return;
    setDeliveryError('');

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!DELIVERY_ALLOWED_EXTS.includes(ext)) {
      setDeliveryError(`Invalid file type. Allowed: ${DELIVERY_ALLOWED_EXTS.join(', ')}`);
      if (deliveryInputRef.current) deliveryInputRef.current.value = '';
      return;
    }
    if (file.size > DELIVERY_MAX_SIZE) {
      setDeliveryError('File size exceeds 50 MB limit');
      if (deliveryInputRef.current) deliveryInputRef.current.value = '';
      return;
    }

    setDeliveryUploading(true);
    try {
      const updated = await submitDelivery(payment.id, file);
      setPayment(updated);
    } catch (err: any) {
      setDeliveryError(err.response?.data?.error ?? 'Upload failed. Please try again.');
    } finally {
      setDeliveryUploading(false);
      if (deliveryInputRef.current) deliveryInputRef.current.value = '';
    }
  }

  // ─── Reject delivery (client) ────────────────────────────────────────────────
  async function handleRejectDelivery() {
    if (!payment || rejecting) return;
    setRejecting(true);
    try {
      const updated = await rejectDelivery(payment.id, rejectReason.trim() || undefined);
      setPayment(updated);
      setShowRejectForm(false);
      setRejectReason('');
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to reject delivery');
    } finally {
      setRejecting(false);
    }
  }

  // ─── Razorpay payment (client) ───────────────────────────────────────────────
  async function handleMakePayment() {
    if (!payment || paymentLoading) return;
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const order = await createRazorpayOrder(payment.id);
      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'FreelanceHub',
        description: project?.title ?? 'Project Payment',
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const updated = await verifyPayment(payment.id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setPayment(updated);
            setProject((p: any) => ({ ...p, status: 'COMPLETED' }));
          } catch {
            setPaymentError('Payment verification failed. Please contact support if amount was deducted.');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
        theme: { color: '#f97316' },
      });
      rzp.open();
    } catch (err: any) {
      setPaymentError(err.response?.data?.error ?? 'Failed to initiate payment. Please try again.');
      setPaymentLoading(false);
    }
  }

  async function handleDownloadDelivery() {
    if (!payment) return;
    try {
      await downloadDelivery(payment.id, payment.deliveryFileName ?? 'delivery');
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Download failed');
    }
  }

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (fetchError || !project) return (
    <Layout>
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-gray-600 mb-4">{fetchError || 'Project not found.'}</p>
        <button onClick={() => window.history.back()} className="text-orange-500 hover:text-orange-600 font-semibold text-sm">
          ← Go back
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      <div className="space-y-5">

        {/* Project Header */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{project.title}</h1>
              <p className="text-gray-400 text-sm mt-1">Posted by <span className="text-gray-600 font-medium">{project.client.name}</span></p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={project.status} />
              {isProjectOwner && project.status === 'OPEN' && (
                <Link
                  to={`/projects/${id}/edit`}
                  className="inline-flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 rounded-full px-3 py-1.5 hover:border-orange-300 hover:text-orange-500 transition-all font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                  </svg>
                  Edit
                </Link>
              )}
            </div>
          </div>
          <p className="text-gray-600 mt-4 leading-relaxed text-sm">{project.description}</p>

          {project.sampleImages?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {project.sampleImages.map((filename: string, idx: number) => (
                <button
                  key={filename}
                  type="button"
                  onClick={() => openLightbox(idx)}
                  className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 flex-shrink-0"
                >
                  <img
                    src={`${import.meta.env.VITE_SOCKET_URL}/uploads/${filename}`}
                    alt={`Project image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* ── Lightbox ────────────────────────────────────────────────────────── */}
          {lightboxOpen && project.sampleImages?.length > 0 && (
            <div
              className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm animate-fade-in"
              onClick={closeLightbox}
            >
              {/* Close — fixed to top-right corner of screen */}
              <button
                onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-all hover:scale-110"
                aria-label="Close lightbox"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Left arrow — pinned to left screen edge */}
              {project.sampleImages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                  className="fixed left-0 top-1/2 -translate-y-1/2 z-50 h-24 w-14 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white transition-all rounded-r-xl"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Right arrow — pinned to right screen edge */}
              {project.sampleImages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                  className="fixed right-0 top-1/2 -translate-y-1/2 z-50 h-24 w-14 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white transition-all rounded-l-xl"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Main image — centred, fills remaining height */}
              <div
                className="flex-1 flex items-center justify-center px-16 py-8 min-h-0"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={`${import.meta.env.VITE_SOCKET_URL}/uploads/${project.sampleImages[lightboxIndex]}`}
                  alt={`Project image ${lightboxIndex + 1}`}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                />
              </div>

              {/* Bottom bar — counter + thumbnail strip */}
              <div
                className="flex-shrink-0 flex flex-col items-center gap-2 pb-6"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-white/50 text-xs font-semibold tracking-widest uppercase">
                  {lightboxIndex + 1} / {project.sampleImages.length}
                </p>

                {project.sampleImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto px-4 pb-1 max-w-full">
                    {project.sampleImages.map((filename: string, idx: number) => (
                      <button
                        key={filename}
                        onClick={() => setLightboxIndex(idx)}
                        className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === lightboxIndex
                            ? 'border-orange-400 scale-110 opacity-100'
                            : 'border-transparent opacity-40 hover:opacity-70'
                        }`}
                      >
                        <img
                          src={`${import.meta.env.VITE_SOCKET_URL}/uploads/${filename}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4">
            <span className="text-2xl font-extrabold text-gray-900">${project.budget.toLocaleString()}</span>
          </div>

          {(project.status === 'COMPLETED' || hasChat) && (
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100 flex-wrap">
              {project.status === 'COMPLETED' && (
                <button
                  onClick={() => setShowReviews((v) => !v)}
                  className={`inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full font-semibold border transition-all ${
                    showReviews
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500 bg-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill={showReviews ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Reviews
                </button>
              )}
              {hasChat && (
                <button
                  onClick={() => setChatOpen((v) => !v)}
                  className={`inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full font-semibold border transition-all ${
                    chatOpen
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500 bg-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Project Chat
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Project Delivery (client uploads completed project) ──────────────── */}
        {isProjectOwner && payment && project.status === 'IN_PROGRESS' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Project Delivery</h2>

            {payment.status === 'PENDING' && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-amber-700 text-sm font-medium">Upload the completed project for the freelancer to review</p>
                </div>
                {deliveryError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{deliveryError}</p>
                  </div>
                )}
                <label className={`inline-flex items-center gap-2 text-sm px-5 py-2 rounded-full border font-semibold cursor-pointer transition-all ${
                  deliveryUploading ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-orange-500 border-orange-200 hover:bg-orange-50'
                }`}>
                  {deliveryUploading ? <><span className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />Uploading…</> : '+ Upload Project File'}
                  <input ref={deliveryInputRef} type="file" className="hidden" disabled={deliveryUploading} onChange={handleDeliveryUpload} />
                </label>
                <p className="text-xs text-gray-400">Accepted: PDF, ZIP, DOC, DOCX, PNG, JPG · Max 200 MB</p>
              </div>
            )}

            {payment.status === 'WORK_SUBMITTED' && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-blue-700 text-sm font-medium">File uploaded — waiting for freelancer to review and make payment</p>
                  {payment.deliveryFileName && <p className="text-blue-600 text-xs mt-1">File: {payment.deliveryFileName}</p>}
                </div>
                {deliveryError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{deliveryError}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Need to replace the file?</p>
                  <label className={`inline-flex items-center gap-2 text-xs px-4 py-1.5 rounded-full border font-semibold cursor-pointer transition-all ${
                    deliveryUploading ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>
                    {deliveryUploading ? <><span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />Uploading…</> : 'Re-upload'}
                    <input ref={deliveryInputRef} type="file" className="hidden" disabled={deliveryUploading} onChange={handleDeliveryUpload} />
                  </label>
                </div>
              </div>
            )}

            {payment.status === 'WORK_REJECTED' && (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-700 text-sm font-semibold">Freelancer rejected the submission — please re-upload</p>
                  {payment.rejectionReason && <p className="text-red-600 text-xs mt-1">Reason: {payment.rejectionReason}</p>}
                </div>
                {deliveryError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{deliveryError}</p>
                  </div>
                )}
                <label className={`inline-flex items-center gap-2 text-sm px-5 py-2 rounded-full border font-semibold cursor-pointer transition-all ${
                  deliveryUploading ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-orange-500 border-orange-200 hover:bg-orange-50'
                }`}>
                  {deliveryUploading ? <><span className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />Uploading…</> : '+ Re-upload Project File'}
                  <input ref={deliveryInputRef} type="file" className="hidden" disabled={deliveryUploading} onChange={handleDeliveryUpload} />
                </label>
                <p className="text-xs text-gray-400">Accepted: PDF, ZIP, DOC, DOCX, PNG, JPG · Max 200 MB</p>
              </div>
            )}
          </div>
        )}

        {/* ── Payment Section (payment actions only, no upload) ─────────────────── */}
        {payment && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Payment</h2>
                <p className="text-sm text-gray-400 mt-0.5">₹{payment.amount.toLocaleString()}</p>
              </div>
              <StatusBadge status={payment.status} />
            </div>

            {/* CLIENT — status info only */}
            {isProjectOwner && payment.status === 'RELEASED' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                <p className="text-purple-700 text-sm font-semibold">Payment received successfully</p>
                {payment.paidAt && <p className="text-purple-500 text-xs mt-0.5">{new Date(payment.paidAt).toLocaleDateString()}</p>}
              </div>
            )}

            {/* FREELANCER — payment actions */}
            {!isClient && (() => {
              if (payment.status === 'PENDING') {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-amber-700 text-sm font-medium">Waiting for client to upload completed work</p>
                  </div>
                );
              }

              if (payment.status === 'WORK_SUBMITTED') {
                return (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <p className="text-blue-700 text-sm font-semibold">Project uploaded. Review and proceed to payment.</p>
                      {payment.deliveryFileName && <p className="text-blue-600 text-xs mt-1">File: {payment.deliveryFileName}</p>}
                    </div>
                    {paymentError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <p className="text-red-600 text-sm">{paymentError}</p>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={handleMakePayment}
                        disabled={paymentLoading}
                        className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        {paymentLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {paymentLoading ? 'Processing…' : 'Make Payment'}
                      </button>
                      <button
                        onClick={() => { setShowRejectForm((v) => !v); setRejectReason(''); }}
                        className="bg-white text-red-500 border border-red-200 px-5 py-2 rounded-full text-sm font-semibold hover:bg-red-50 transition-all"
                      >
                        Reject Work
                      </button>
                    </div>
                    {showRejectForm && (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection (optional)"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent bg-white transition-all resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleRejectDelivery}
                            disabled={rejecting}
                            className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-red-600 disabled:opacity-60 transition-all"
                          >
                            {rejecting ? 'Rejecting…' : 'Confirm Reject'}
                          </button>
                          <button
                            onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                            className="bg-white text-gray-500 border border-gray-200 px-4 py-2 rounded-full text-xs font-semibold hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (payment.status === 'WORK_REJECTED') {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-amber-700 text-sm font-semibold">Rejection sent — waiting for client to re-upload</p>
                    {payment.rejectionReason && <p className="text-amber-600 text-xs mt-1">Your reason: {payment.rejectionReason}</p>}
                  </div>
                );
              }

              if (payment.status === 'RELEASED') {
                return (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <p className="text-emerald-700 text-sm font-semibold">Payment made — work accepted</p>
                      {payment.paidAt && <p className="text-emerald-600 text-xs mt-0.5">{new Date(payment.paidAt).toLocaleDateString()}</p>}
                    </div>
                    {payment.deliveryFileName && (
                      <button
                        onClick={handleDownloadDelivery}
                        className="inline-flex items-center gap-2 text-sm px-5 py-2 rounded-full border border-orange-200 text-orange-500 font-semibold hover:bg-orange-50 transition-all"
                      >
                        Download project file
                      </button>
                    )}
                  </div>
                );
              }

              return null;
            })()}
          </div>
        )}

        {/* ── Bids Section (Client / Project Owner only) ───────────────────────── */}
        {isProjectOwner && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">
              Bids
              <span className="ml-2 text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">{bidsTotal}</span>
            </h2>
            {bids.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No bids yet.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {bids.map((b) => (
                    <div key={b.id} className="border border-gray-100 rounded-xl p-4 hover:border-orange-100 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{b.freelancer.name}</p>
                          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{b.proposal}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-bold text-gray-900 text-sm">${b.amount.toLocaleString()}</span>
                          <StatusBadge status={b.status} />
                          {b.status === 'PENDING' && project.status === 'OPEN' && (
                            <>
                              <button
                                onClick={() => handleAcceptBid(b.id)}
                                className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-orange-600 transition-all"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectBid(b.id)}
                                className="bg-white text-red-500 border border-red-200 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-red-50 transition-all"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={bidsPage} totalPages={bidsTotalPages} total={bidsTotal} onPageChange={fetchBids} />
              </>
            )}
          </div>
        )}

        {/* ── Place Bid (Freelancer, open project, no existing bid) ────────────── */}
        {!isClient && project.status === 'OPEN' && !myBid && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Place a Bid</h2>
            {bidError && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{bidError}</p>
              </div>
            )}
            <form onSubmit={handlePlaceBid} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Bid Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                    min="1"
                    placeholder="500"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Proposal</label>
                <textarea
                  value={bidProposal}
                  onChange={(e) => setBidProposal(e.target.value)}
                  required
                  rows={4}
                  placeholder="Explain why you're the best fit for this project…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                className="bg-orange-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all shadow-sm"
              >
                Submit Bid
              </button>
            </form>
          </div>
        )}

        {/* ── My Bid (Freelancer existing bid) ─────────────────────────────────── */}
        {myBid && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Your Bid</h2>
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold text-gray-900">${myBid.amount.toLocaleString()}</span>
              <StatusBadge status={myBid.status} />
            </div>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{myBid.proposal}</p>
          </div>
        )}

        {/* ── Reviews (toggle, completed projects only) ───────────────────────── */}
        {showReviews && project.status === 'COMPLETED' && (() => {
          const theirReview = projectReviews.find((r) => r.reviewee?.id === user?.id) ?? null;
          return (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-5">
              <h2 className="font-bold text-gray-900">Reviews</h2>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Review you received</p>
                {theirReview ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <StarRating value={theirReview.rating} readonly size="sm" />
                      <span className="text-xs text-gray-400">by {theirReview.reviewer.name}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{theirReview.comment}</p>
                    <p className="text-xs text-gray-400">{new Date(theirReview.createdAt).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Not yet submitted.</p>
                )}
              </div>

              <div className="border-t border-gray-100" />

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your review</p>
                {myReview ? (
                  <div className="space-y-1.5">
                    <StarRating value={myReview.rating} readonly size="sm" />
                    <p className="text-sm text-gray-700 leading-relaxed">{myReview.comment}</p>
                    <p className="text-xs text-gray-400">{new Date(myReview.createdAt).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rating</label>
                      <StarRating value={reviewRating} onChange={setReviewRating} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comment</label>
                      <textarea
                        required
                        rows={3}
                        maxLength={1000}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience working on this project…"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all resize-none"
                      />
                    </div>
                    {reviewError && <p className="text-sm text-red-500">{reviewError}</p>}
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="bg-orange-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {reviewLoading ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}

      </div>

      {/* ── Floating Chat Panel ───────────────────────────────────────────────── */}
      {hasChat && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
            chatOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          style={{ maxHeight: '480px' }}
        >
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 bg-orange-500 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 bg-white rounded-full opacity-80 flex-shrink-0" />
              <span className="text-white font-semibold text-sm truncate">Project Chat</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white hover:bg-orange-600 w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-2"
              aria-label="Close chat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ maxHeight: '320px', minHeight: '200px' }}
          >
            {hasMoreMessages && (
              <div className="flex justify-center pb-1">
                <button
                  onClick={handleLoadEarlier}
                  disabled={loadingEarlier}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold disabled:opacity-50"
                >
                  {loadingEarlier ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <svg className="w-8 h-8 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-400 text-sm">No messages yet.</p>
                <p className="text-gray-300 text-xs mt-0.5">Start the conversation!</p>
              </div>
            ) : messages.map((m) => {
              const isMe = m.sender.id === user?.id;
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-400 mb-1">{m.sender.name}</span>
                  <div className={`max-w-[200px] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isMe
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 border border-gray-200 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all shadow-sm flex-shrink-0"
              aria-label="Send"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}
