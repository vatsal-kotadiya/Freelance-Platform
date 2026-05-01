import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/Layout';
import { formatCurrency } from '../utils/currency';
import {
  getProfile,
  updateProfile,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  UserProfile,
  UpdateProfilePayload,
} from '../api/profile';
import { getReviewsForUser, UserReviewsResult } from '../api/reviews';
import { getClientDashboard, getFreelancerDashboard } from '../api/dashboard';
import StarRating from '../components/StarRating';
import SkillSelector from '../components/SkillSelector';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviewsData, setReviewsData] = useState<UserReviewsResult | null>(null);
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  const isOwner = user?.id === userId;

  const [editForm, setEditForm] = useState<UpdateProfilePayload>({});
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', url: '' });
  const [portfolioError, setPortfolioError] = useState('');
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemEditForm, setItemEditForm] = useState({ title: '', description: '', url: '' });
  const [itemEditError, setItemEditError] = useState('');
  const [itemEditLoading, setItemEditLoading] = useState(false);

  useEffect(() => {
    if (!userId) { navigate('/dashboard'); return; }
    getProfile(userId).then((p) => {
      setProfile(p);
      if (isOwner) {
        if (p.role === 'CLIENT') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getClientDashboard().then((d: any) => {
            setProjectsCount(d?.totalProjects ?? d?.projectsCount ?? d?.projects?.length ?? 0);
            setCompletedCount(d?.stats?.completed ?? 0);
          }).catch(() => {});
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getFreelancerDashboard().then((d: any) => {
            setProjectsCount(d?.totalBids ?? d?.bidsCount ?? d?.bids?.length ?? 0);
            setCompletedCount(d?.stats?.accepted ?? 0);
          }).catch(() => {});
        }
      }
    }).catch(() => setError('Profile not found'));
    getReviewsForUser(userId).then(setReviewsData).catch(() => {});
  }, [userId]);

  function openEdit() {
    if (!profile) return;
    setEditForm({
      bio: profile.bio ?? '',
      skills: [...profile.skills],
      avatarUrl: profile.avatarUrl ?? '',
      location: profile.location ?? '',
      hourlyRate: profile.hourlyRate ?? null,
    });
    setEditError('');
    setEditing(true);
  }

  async function handleSaveProfile() {
    setEditError('');
    setEditLoading(true);
    try {
      const payload: UpdateProfilePayload = {};
      if (editForm.bio !== undefined) payload.bio = editForm.bio;
      if (editForm.skills !== undefined) payload.skills = editForm.skills;
      if (editForm.avatarUrl !== undefined) payload.avatarUrl = editForm.avatarUrl;
      if (editForm.location !== undefined) payload.location = editForm.location;
      payload.hourlyRate = editForm.hourlyRate ?? null;
      const updated = await updateProfile(payload);
      setProfile(updated);
      setEditing(false);
    } catch {
      setEditError('Failed to save profile. Check your inputs.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleAddPortfolio() {
    setPortfolioError('');
    if (!portfolioForm.title.trim() || !portfolioForm.description.trim()) {
      setPortfolioError('Title and description are required.');
      return;
    }
    setPortfolioLoading(true);
    try {
      const item = await addPortfolioItem(
        portfolioForm.title.trim(),
        portfolioForm.description.trim(),
        portfolioForm.url.trim() || undefined
      );
      setProfile((p) => p ? { ...p, portfolioItems: [item, ...p.portfolioItems] } : p);
      setPortfolioForm({ title: '', description: '', url: '' });
      setShowPortfolioForm(false);
    } catch {
      setPortfolioError('Failed to add portfolio item.');
    } finally {
      setPortfolioLoading(false);
    }
  }

  async function handleDeletePortfolio(id: string) {
    try {
      await deletePortfolioItem(id);
      setProfile((p) => p ? { ...p, portfolioItems: p.portfolioItems.filter((i) => i.id !== id) } : p);
    } catch { /* ignore */ }
  }

  function openItemEdit(item: { id: string; title: string; description: string; url?: string | null }) {
    setEditingItemId(item.id);
    setItemEditForm({ title: item.title, description: item.description, url: item.url ?? '' });
    setItemEditError('');
  }

  function cancelItemEdit() {
    setEditingItemId(null);
    setItemEditError('');
  }

  async function handleSaveItem(id: string) {
    setItemEditError('');
    if (!itemEditForm.title.trim() || !itemEditForm.description.trim()) {
      setItemEditError('Title and description are required.');
      return;
    }
    setItemEditLoading(true);
    try {
      const updated = await updatePortfolioItem(id, {
        title: itemEditForm.title.trim(),
        description: itemEditForm.description.trim(),
        url: itemEditForm.url.trim() || undefined,
      });
      setProfile((p) =>
        p ? { ...p, portfolioItems: p.portfolioItems.map((i) => (i.id === id ? updated : i)) } : p
      );
      setEditingItemId(null);
    } catch {
      setItemEditError('Failed to save changes.');
    } finally {
      setItemEditLoading(false);
    }
  }

  if (error) return <Layout wide><p className="text-red-500 text-sm p-6">{error}</p></Layout>;

  if (!profile) return (
    <Layout wide>
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const initials = profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const totalReviews = reviewsData?.totalReviews ?? 0;
  const avgRating = reviewsData?.averageRating ?? null;
  const roleLabel = profile.role === 'CLIENT' ? 'CLIENT' : 'FREELANCER';
  const profileDescription = profile.role === 'CLIENT'
    ? 'Manage your account details and how clients see your profile.'
    : 'Manage your account details and how freelancers see your profile.';

  return (
    <Layout wide>
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your information, portfolio and reviews.</p>
      </div>

      {/* 2-column grid: left ~70%, right ~30% */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Profile Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-2xl font-extrabold text-orange-500">{initials}</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-extrabold text-gray-900">{profile.name}</h2>
                  <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-0.5 rounded-full font-semibold tracking-wide">
                    {roleLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Member since {memberSince}
                </div>
                <p className="text-sm text-gray-500 mt-1">{profile.bio || profileDescription}</p>

                {profile.location && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profile.location}
                  </p>
                )}

                {profile.role === 'FREELANCER' && profile.hourlyRate != null && (
                  <p className="text-sm text-gray-500 mt-1">{formatCurrency(profile.hourlyRate)}/hr</p>
                )}

                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit Profile button */}
              {isOwner && !editing && (
                <button
                  onClick={openEdit}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm text-orange-500 border border-orange-300 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-0 mt-5 border border-gray-100 rounded-xl overflow-hidden">
              {/* Projects Posted */}
              <div className="flex items-center gap-3 px-5 py-4 border-r border-gray-100">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4.5 h-4.5 text-orange-500" style={{ width: '1.125rem', height: '1.125rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900 leading-tight">{projectsCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {profile.role === 'CLIENT' ? 'Projects Posted' : 'Bids Placed'}
                  </p>
                </div>
              </div>

              {/* Reviews Received */}
              <div className="flex items-center gap-3 px-5 py-4 border-r border-gray-100">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg style={{ width: '1.125rem', height: '1.125rem' }} className="text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900 leading-tight">{totalReviews}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Reviews Received</p>
                </div>
              </div>

              {/* Completed Work */}
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <svg style={{ width: '1.125rem', height: '1.125rem' }} className="text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900 leading-tight">{completedCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Completed Work</p>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            {editing && isOwner && (
              <div className="mt-6 border-t border-gray-100 pt-5 space-y-4">
                <h3 className="font-bold text-gray-900">Edit Profile</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Avatar URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={editForm.avatarUrl ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Tell others about yourself..."
                    value={editForm.bio ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. New York, USA"
                    value={editForm.location ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                  />
                </div>

                {profile.role === 'FREELANCER' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hourly Rate (₹)</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 50"
                      value={editForm.hourlyRate ?? ''}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          hourlyRate: e.target.value ? parseFloat(e.target.value) : null,
                        }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Skills</label>
                  <SkillSelector
                    selected={editForm.skills ?? []}
                    onChange={(skills) => setEditForm((f) => ({ ...f, skills }))}
                    max={20}
                    placeholder="Search or add skills..."
                  />
                </div>

                {editError && <p className="text-sm text-red-500">{editError}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={editLoading}
                    className="bg-orange-500 text-white text-sm px-5 py-2.5 rounded-full font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-sm text-gray-600 px-5 py-2.5 rounded-full border border-gray-200 font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Section */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Portfolio</h2>
                  <p className="text-xs text-gray-500">Showcase your work to attract top freelancers.</p>
                </div>
              </div>
              {isOwner && !showPortfolioForm && (
                <button
                  onClick={() => setShowPortfolioForm(true)}
                  className="text-sm text-orange-500 border border-orange-300 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-all"
                >
                  + Add Item
                </button>
              )}
            </div>

            <div className="mt-4">
              {/* Add portfolio form */}
              {showPortfolioForm && isOwner && (
                <div className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                    <input
                      type="text"
                      placeholder="Project name"
                      maxLength={100}
                      value={portfolioForm.title}
                      onChange={(e) => setPortfolioForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
                    <textarea
                      rows={2}
                      maxLength={500}
                      placeholder="What did you build?"
                      value={portfolioForm.description}
                      onChange={(e) => setPortfolioForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL (optional)</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={portfolioForm.url}
                      onChange={(e) => setPortfolioForm((f) => ({ ...f, url: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                    />
                  </div>
                  {portfolioError && <p className="text-sm text-red-500">{portfolioError}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddPortfolio}
                      disabled={portfolioLoading}
                      className="bg-orange-500 text-white text-sm px-5 py-2 rounded-full font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all"
                    >
                      {portfolioLoading ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => { setShowPortfolioForm(false); setPortfolioError(''); }}
                      className="text-sm text-gray-600 px-5 py-2 rounded-full border border-gray-200 font-semibold hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Portfolio items list */}
              {profile.portfolioItems.length > 0 && (
                <div className="space-y-3">
                  {profile.portfolioItems.map((item) =>
                    editingItemId === item.id ? (
                      <div key={item.id} className="border border-orange-200 rounded-xl p-4 bg-orange-50/30 space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                          <input
                            type="text"
                            maxLength={100}
                            value={itemEditForm.title}
                            onChange={(e) => setItemEditForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
                          <textarea
                            rows={2}
                            maxLength={500}
                            value={itemEditForm.description}
                            onChange={(e) => setItemEditForm((f) => ({ ...f, description: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL (optional)</label>
                          <input
                            type="url"
                            placeholder="https://github.com/..."
                            value={itemEditForm.url}
                            onChange={(e) => setItemEditForm((f) => ({ ...f, url: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                          />
                        </div>
                        {itemEditError && <p className="text-sm text-red-500">{itemEditError}</p>}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSaveItem(item.id)}
                            disabled={itemEditLoading}
                            className="bg-orange-500 text-white text-sm px-5 py-2 rounded-full font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all"
                          >
                            {itemEditLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelItemEdit}
                            className="text-sm text-gray-600 px-5 py-2 rounded-full border border-gray-200 font-semibold hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={item.id} className="border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-3 hover:border-orange-100 transition-all">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-orange-500 hover:underline truncate max-w-xs"
                              >
                                {item.url}
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                        </div>
                        {isOwner && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => openItemEdit(item)}
                              className="text-xs text-orange-500 hover:text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-50 font-semibold transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePortfolio(item.id)}
                              className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 font-semibold transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Empty state */}
              {profile.portfolioItems.length === 0 && !showPortfolioForm && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 px-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {isOwner ? "You haven't added any portfolio items yet." : 'No portfolio items yet.'}
                  </p>
                  {isOwner && (
                    <>
                      <p className="text-xs text-gray-400 mt-1">Add your work samples to build trust and get better proposals.</p>
                      <button
                        onClick={() => setShowPortfolioForm(true)}
                        className="mt-4 bg-orange-500 text-white text-sm px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-all"
                      >
                        + Add Your First Portfolio Item
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Your profile is visible to freelancers.</p>
              <p className="text-xs text-gray-500 mt-0.5">Keep your information updated to get better proposals and build trust.</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Reviews ── */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            {/* Reviews header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Reviews</h2>
              {totalReviews > 0 && avgRating !== null && (
                <span className="text-xs text-gray-500 font-medium">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
              )}
            </div>

            {totalReviews > 0 && avgRating !== null && (
              <div className="flex items-center gap-2 mb-5">
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                <span className="text-base font-extrabold text-gray-900">{avgRating.toFixed(1)}</span>
              </div>
            )}

            {/* Review list */}
            {totalReviews === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviewsData!.reviews.map((r) => {
                  const reviewerInitials = r.reviewer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  const reviewDate = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const reviewerRoleLabel = r.reviewer.role === 'CLIENT' ? 'CLIENT' : 'FREELANCER';
                  return (
                    <div key={r.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2.5">
                        {/* Reviewer avatar */}
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-600">{reviewerInitials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">{r.reviewer.name}</span>
                                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">{reviewerRoleLabel}</span>
                              </div>
                              {r.project && (
                                <p className="text-xs text-gray-400 mt-0.5">on "{r.project.title}"</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{reviewDate}</span>
                          </div>
                          <div className="mt-1.5">
                            <StarRating value={r.rating} readonly size="sm" />
                          </div>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View All Reviews button */}
            {totalReviews > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <button className="w-full text-sm text-orange-500 border border-orange-300 py-2.5 rounded-lg font-semibold hover:bg-orange-50 transition-all">
                  View All Reviews
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
