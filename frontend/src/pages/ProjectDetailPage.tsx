import { useEffect, useState, useRef, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { getProject, completeProject } from '../api/projects';
import { getProjectBids, placeBid, acceptBid, getMyBidForProject } from '../api/bids';
import { getMessages } from '../api/messages';
import { getPayment, releasePayment } from '../api/payments';
import { createReview, getMyReviewForProject, getProjectReviews, Review } from '../api/reviews';
import { uploadFile, getProjectFiles, downloadFile, deleteFile, FileAttachment } from '../api/files';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import StarRating from '../components/StarRating';

const BIDS_PAGE_SIZE = 10;

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

  const [projectFiles, setProjectFiles] = useState<FileAttachment[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isClient = user?.role === 'CLIENT';
  const isProjectOwner = isClient && project?.clientId === user?.id;
  const hasChat = project?.status === 'IN_PROGRESS' || project?.status === 'COMPLETED';
  const hasFiles = project?.status === 'IN_PROGRESS' || project?.status === 'COMPLETED';

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
    setLoading(true);
    setProject(null);
    setFetchError('');
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
    if ((project?.status === 'IN_PROGRESS' || project?.status === 'COMPLETED') && id) {
      getProjectFiles(id).then(setProjectFiles).catch(() => {});
    }
  }, [project?.status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to accept bid');
    }
  }

  async function handleComplete() {
    try {
      const updated = await completeProject(id!);
      setProject(updated);
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to complete project');
    }
  }

  async function handleReleasePayment() {
    if (!payment) return;
    try {
      const updated = await releasePayment(payment.id);
      setPayment(updated);
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to release payment');
    }
  }

  function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit('sendMessage', { projectId: id, content: chatInput.trim() });
    setChatInput('');
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setFileError('');
    setFileUploading(true);
    try {
      const attachment = await uploadFile(id, file);
      setProjectFiles((prev) => [attachment, ...prev]);
    } catch (err: any) {
      setFileError(err.response?.data?.error ?? 'Upload failed');
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteFile(fileId: string) {
    try {
      await deleteFile(fileId);
      setProjectFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch { /* ignore */ }
  }

  async function handleDownload(fileId: string, filename: string) {
    try {
      await downloadFile(fileId, filename);
    } catch { /* ignore */ }
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
      <div className="space-y-5">

        {/* Project Header */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{project.title}</h1>
              <p className="text-gray-400 text-sm mt-1">Posted by <span className="text-gray-600 font-medium">{project.client.name}</span></p>
            </div>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-gray-600 mt-4 leading-relaxed text-sm">{project.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-2xl font-extrabold text-gray-900">${project.budget.toLocaleString()}</span>
          </div>
          {isProjectOwner && project.status === 'IN_PROGRESS' && (
            <button
              onClick={handleComplete}
              className="mt-4 bg-emerald-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm"
            >
              Mark as Complete
            </button>
          )}
        </div>

        {/* Payment Status */}
        {payment && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Payment</h2>
                <p className="text-sm text-gray-400 mt-0.5">${payment.amount.toLocaleString()}</p>
              </div>
              <StatusBadge status={payment.status} />
            </div>
            {isProjectOwner && project.status === 'COMPLETED' && payment.status === 'PENDING' && (
              <button
                onClick={handleReleasePayment}
                className="mt-4 bg-purple-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-600 transition-all shadow-sm"
              >
                Release Payment
              </button>
            )}
          </div>
        )}

        {/* Bids Section (Client / Project Owner only) */}
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
                            <button
                              onClick={() => handleAcceptBid(b.id)}
                              className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-orange-600 transition-all"
                            >
                              Accept
                            </button>
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

        {/* Place Bid (Freelancer, open project, no existing bid) */}
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

        {/* My Bid (Freelancer existing bid) */}
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

        {/* Reviews — completed projects only */}
        {project.status === 'COMPLETED' && (() => {
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

        {/* Project Files */}
        {hasFiles && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Project Files</h2>
              <label className={`text-sm px-4 py-2 rounded-full border font-semibold cursor-pointer transition-all ${
                fileUploading
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-orange-500 border-orange-200 hover:bg-orange-50'
              }`}>
                {fileUploading ? 'Uploading…' : '+ Upload'}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  disabled={fileUploading}
                  onChange={handleUpload}
                />
              </label>
            </div>
            {fileError && <p className="text-sm text-red-500 mb-3">{fileError}</p>}
            {projectFiles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No files uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {projectFiles.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3 hover:border-orange-100 transition-all">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">{f.filename}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {(f.size / 1024).toFixed(1)} KB · {f.uploader.name} · {new Date(f.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownload(f.id, f.filename)}
                        className="text-xs text-orange-500 hover:text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-50 font-semibold transition-all"
                      >
                        Download
                      </button>
                      {f.uploader.id === user?.id && (
                        <button
                          onClick={() => handleDeleteFile(f.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 font-semibold transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat */}
        {hasChat && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Project Chat</h2>
            <div
              ref={chatContainerRef}
              className="h-72 overflow-y-auto space-y-3 bg-gray-50 border border-gray-100 rounded-xl p-4 mb-3"
            >
              {hasMoreMessages && (
                <div className="flex justify-center pb-2">
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
                <p className="text-gray-400 text-sm text-center mt-10">No messages yet. Start the conversation!</p>
              ) : messages.map((m) => {
                const isMe = m.sender.id === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-gray-400 mb-1">{m.sender.name}</span>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-orange-500 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
              />
              <button
                type="submit"
                className="bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all shadow-sm"
              >
                Send
              </button>
            </form>
          </div>
        )}

      </div>
    </Layout>
  );
}
