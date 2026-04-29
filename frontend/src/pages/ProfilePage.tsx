import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/Layout';
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
import StarRating from '../components/StarRating';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviewsData, setReviewsData] = useState<UserReviewsResult | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  const isOwner = user?.id === userId;

  const [editForm, setEditForm] = useState<UpdateProfilePayload>({});
  const [skillInput, setSkillInput] = useState('');
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
    getProfile(userId).then(setProfile).catch(() => setError('Profile not found'));
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
    setSkillInput('');
    setEditError('');
    setEditing(true);
  }

  function addSkill() {
    const skill = skillInput.trim();
    if (!skill) return;
    const current = editForm.skills ?? [];
    if (current.includes(skill) || current.length >= 20) return;
    setEditForm((f) => ({ ...f, skills: [...current, skill] }));
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setEditForm((f) => ({ ...f, skills: (f.skills ?? []).filter((s) => s !== skill) }));
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

  if (error) return <Layout><p className="text-red-500 text-sm">{error}</p></Layout>;

  if (!profile) return (
    <Layout>
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const initials = profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

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

      <div className="max-w-3xl mx-auto space-y-5">

        {/* Profile Header */}
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
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900">{profile.name}</h1>
                <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full font-semibold">
                  {profile.role}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {profile.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <span>📍</span>{profile.location}
                  </p>
                )}
                {profile.role === 'FREELANCER' && profile.hourlyRate != null && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <span>💰</span>${profile.hourlyRate}/hr
                  </p>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-600 mt-3 text-sm leading-relaxed">{profile.bio}</p>
              )}

              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isOwner && !editing && (
              <button
                onClick={openEdit}
                className="flex-shrink-0 text-sm text-orange-500 border border-orange-200 px-4 py-2 rounded-full font-semibold hover:bg-orange-50 transition-all"
              >
                Edit
              </button>
            )}
          </div>

          {/* Edit Form */}
          {editing && isOwner && (
            <div className="mt-6 border-t border-gray-100 pt-5 space-y-4">
              <h2 className="font-bold text-gray-900">Edit Profile</h2>

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
                  placeholder="Tell others about yourself…"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hourly Rate (USD)</label>
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
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a skill and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="text-sm bg-orange-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editForm.skills ?? []).map((skill) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="text-gray-400 hover:text-red-500 ml-0.5 leading-none">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {editError && <p className="text-sm text-red-500">{editError}</p>}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={editLoading}
                  className="bg-orange-500 text-white text-sm px-5 py-2.5 rounded-full font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all"
                >
                  {editLoading ? 'Saving…' : 'Save Changes'}
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

        {/* Portfolio */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Portfolio</h2>
            {isOwner && !showPortfolioForm && (
              <button
                onClick={() => setShowPortfolioForm(true)}
                className="text-sm text-orange-500 border border-orange-200 px-4 py-2 rounded-full font-semibold hover:bg-orange-50 transition-all"
              >
                + Add Item
              </button>
            )}
          </div>

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
                  placeholder="https://github.com/…"
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
                  {portfolioLoading ? 'Adding…' : 'Add'}
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

          {profile.portfolioItems.length === 0 && !showPortfolioForm && (
            <p className="text-sm text-gray-400 text-center py-6">
              {isOwner ? 'Add your first portfolio item.' : 'No portfolio items yet.'}
            </p>
          )}

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
                      placeholder="https://github.com/…"
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
                      {itemEditLoading ? 'Saving…' : 'Save'}
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
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.description}</p>
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
        </div>

        {/* Reviews */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
            {reviewsData && reviewsData.totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(reviewsData.averageRating ?? 0)} readonly size="sm" />
                <span className="text-sm text-gray-500 font-medium">
                  {reviewsData.averageRating?.toFixed(1)} · {reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {!reviewsData || reviewsData.totalReviews === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviewsData.reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{r.reviewer.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full font-medium">{r.reviewer.role}</span>
                        {r.project && (
                          <span className="text-xs text-gray-400 truncate max-w-xs">on "{r.project.title}"</span>
                        )}
                      </div>
                      <StarRating value={r.rating} readonly size="sm" />
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
