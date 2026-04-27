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
      // Restore scroll position so the user sees where they were
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
      // ignore
    } finally {
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
    } catch {
      // ignore
    }
  }

  async function handleDownload(fileId: string, filename: string) {
    try {
      await downloadFile(fileId, filename);
    } catch {
      // ignore
    }
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

  if (loading) return <Layout><p className="text-gray-500">Loading…</p></Layout>;
  if (fetchError || !project) return (
    <Layout>
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{fetchError || 'Project not found.'}</p>
        <button onClick={() => window.history.back()} className="text-indigo-600 hover:underline text-sm">
          ← Go back
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-500 text-sm mt-1">Posted by {project.client.name}</p>
            </div>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-gray-700 mt-4">{project.description}</p>
          <p className="text-lg font-semibold text-gray-800 mt-3">${project.budget.toLocaleString()}</p>

          {isProjectOwner && project.status === 'IN_PROGRESS' && (
            <button onClick={handleComplete}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              Mark as Complete
            </button>
          )}
        </div>

        {/* Payment Status */}
        {payment && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">Payment</h2>
                <p className="text-sm text-gray-500 mt-0.5">${payment.amount.toLocaleString()}</p>
              </div>
              <StatusBadge status={payment.status} />
            </div>
            {isProjectOwner && project.status === 'COMPLETED' && payment.status === 'PENDING' && (
              <button onClick={handleReleasePayment}
                className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                Release Payment
              </button>
            )}
          </div>
        )}

        {/* Bids Section (Client only) */}
        {isProjectOwner && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Bids ({bidsTotal})</h2>
            {bids.length === 0 ? <p className="text-gray-500 text-sm">No bids yet.</p> : (
              <>
                <div className="space-y-3">
                  {bids.map((b) => (
                    <div key={b.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{b.freelancer.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{b.proposal}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-800">${b.amount.toLocaleString()}</span>
                          <StatusBadge status={b.status} />
                          {b.status === 'PENDING' && project.status === 'OPEN' && (
                            <button onClick={() => handleAcceptBid(b.id)}
                              className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-indigo-700">
                              Accept
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={bidsPage}
                  totalPages={bidsTotalPages}
                  total={bidsTotal}
                  onPageChange={fetchBids}
                />
              </>
            )}
          </div>
        )}

        {/* Place Bid (Freelancer only, project open, no existing bid) */}
        {!isClient && project.status === 'OPEN' && !myBid && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Place a Bid</h2>
            {bidError && <p className="text-red-600 text-sm mb-3">{bidError}</p>}
            <form onSubmit={handlePlaceBid} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Bid Amount ($)</label>
                <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} required min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal</label>
                <textarea value={bidProposal} onChange={(e) => setBidProposal(e.target.value)} required rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Submit Bid
              </button>
            </form>
          </div>
        )}

        {myBid && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-2">Your Bid</h2>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-800">${myBid.amount.toLocaleString()}</span>
              <StatusBadge status={myBid.status} />
            </div>
            <p className="text-sm text-gray-600 mt-2">{myBid.proposal}</p>
          </div>
        )}

        {/* Review Section — only on completed projects */}
        {project.status === 'COMPLETED' && (() => {
          const theirReview = projectReviews.find((r) => r.reviewee?.id === user?.id) ?? null;
          return (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
              <h2 className="font-semibold text-gray-800">Reviews</h2>

              {/* Review received from the other party */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Review you received</p>
                {theirReview ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StarRating value={theirReview.rating} readonly size="sm" />
                      <span className="text-xs text-gray-500">by {theirReview.reviewer.name}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{theirReview.comment}</p>
                    <p className="text-xs text-gray-400">{new Date(theirReview.createdAt).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Not yet submitted.</p>
                )}
              </div>

              <div className="border-t border-gray-100" />

              {/* Review the current user wrote */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Your review</p>
                {myReview ? (
                  <div className="space-y-1">
                    <StarRating value={myReview.rating} readonly size="sm" />
                    <p className="text-sm text-gray-700 leading-relaxed">{myReview.comment}</p>
                    <p className="text-xs text-gray-400">{new Date(myReview.createdAt).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <StarRating value={reviewRating} onChange={setReviewRating} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                      <textarea
                        required
                        rows={3}
                        maxLength={1000}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience working on this project…"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                    {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
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
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Project Files</h2>
              <label className={`text-sm px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                fileUploading
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
              }`}>
                {fileUploading ? 'Uploading…' : '+ Upload File'}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  disabled={fileUploading}
                  onChange={handleUpload}
                />
              </label>
            </div>
            {fileError && <p className="text-sm text-red-600 mb-3">{fileError}</p>}
            {projectFiles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No files uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {projectFiles.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(f.size / 1024).toFixed(1)} KB · {f.uploader.name} · {new Date(f.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownload(f.id, f.filename)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      >
                        Download
                      </button>
                      {f.uploader.id === user?.id && (
                        <button
                          onClick={() => handleDeleteFile(f.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
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
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Project Chat</h2>
            <div ref={chatContainerRef} className="h-72 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-3 mb-3 bg-gray-50">
              {/* Load Earlier */}
              {hasMoreMessages && (
                <div className="flex justify-center pb-2">
                  <button
                    onClick={handleLoadEarlier}
                    disabled={loadingEarlier}
                    className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                  >
                    {loadingEarlier ? 'Loading…' : 'Load earlier messages'}
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-8">No messages yet. Start the conversation!</p>
              ) : messages.map((m) => {
                const isMe = m.sender.id === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-gray-400 mb-0.5">{m.sender.name}</span>
                    <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message…"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
