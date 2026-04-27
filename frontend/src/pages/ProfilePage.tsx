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

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateProfilePayload>({});
  const [skillInput, setSkillInput] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Portfolio add form state
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', url: '' });
  const [portfolioError, setPortfolioError] = useState('');
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  // Portfolio inline edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemEditForm, setItemEditForm] = useState({ title: '', description: '', url: '' });
  const [itemEditError, setItemEditError] = useState('');
  const [itemEditLoading, setItemEditLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate('/dashboard');
      return;
    }
    getProfile(userId)
      .then(setProfile)
      .catch(() => setError('Profile not found'));
    getReviewsForUser(userId)
      .then(setReviewsData)
      .catch(() => {});
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
    } catch {
      // silently ignore
    }
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

  if (error) {
    return (
      <Layout>
        <p className="text-red-600">{error}</p>
      </Layout>
    );
  }

  if (!profile) {
    return <Layout><p className="text-gray-500">Loading…</p></Layout>;
  }

  const initials = profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Profile Header Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-indigo-600">{initials}</span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                  {profile.role}
                </span>
              </div>

              {profile.location && (
                <p className="text-sm text-gray-500 mt-1">📍 {profile.location}</p>
              )}
              {profile.role === 'FREELANCER' && profile.hourlyRate != null && (
                <p className="text-sm text-gray-500 mt-1">💰 ${profile.hourlyRate}/hr</p>
              )}
              {profile.bio && (
                <p className="text-gray-700 mt-3 text-sm leading-relaxed">{profile.bio}</p>
              )}

              {/* Skills */}
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isOwner && !editing && (
              <button
                onClick={openEdit}
                className="flex-shrink-0 text-sm text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Inline Edit Form */}
          {editing && isOwner && (
            <div className="mt-6 border-t border-gray-100 pt-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Edit Profile</h2>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Avatar URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={editForm.avatarUrl ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Bio</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Tell others about yourself…"
                  value={editForm.bio ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. New York, USA"
                  value={editForm.location ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {profile.role === 'FREELANCER' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hourly Rate (USD)</label>
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">Skills</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a skill"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editForm.skills ?? []).map((skill) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="text-gray-400 hover:text-red-500 ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {editError && <p className="text-sm text-red-600">{editError}</p>}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={editLoading}
                  className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Portfolio</h2>
            {isOwner && !showPortfolioForm && (
              <button
                onClick={() => setShowPortfolioForm(true)}
                className="text-sm text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                + Add Item
              </button>
            )}
          </div>

          {/* Add Portfolio Form */}
          {showPortfolioForm && isOwner && (
            <div className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50 space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="Project name"
                  maxLength={100}
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description *</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="What did you build?"
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none bg-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/…"
                  value={portfolioForm.url}
                  onChange={(e) => setPortfolioForm((f) => ({ ...f, url: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>
              {portfolioError && <p className="text-sm text-red-600">{portfolioError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleAddPortfolio}
                  disabled={portfolioLoading}
                  className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {portfolioLoading ? 'Adding…' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowPortfolioForm(false); setPortfolioError(''); }}
                  className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {profile.portfolioItems.length === 0 && !showPortfolioForm && (
            <p className="text-sm text-gray-400 text-center py-4">
              {isOwner ? 'Add your first portfolio item.' : 'No portfolio items yet.'}
            </p>
          )}

          <div className="space-y-3">
            {profile.portfolioItems.map((item) =>
              editingItemId === item.id ? (
                <div key={item.id} className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/30 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Title *</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={itemEditForm.title}
                      onChange={(e) => setItemEditForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Description *</label>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={itemEditForm.description}
                      onChange={(e) => setItemEditForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">URL (optional)</label>
                    <input
                      type="url"
                      placeholder="https://github.com/…"
                      value={itemEditForm.url}
                      onChange={(e) => setItemEditForm((f) => ({ ...f, url: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    />
                  </div>
                  {itemEditError && <p className="text-sm text-red-600">{itemEditError}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSaveItem(item.id)}
                      disabled={itemEditLoading}
                      className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {itemEditLoading ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={cancelItemEdit}
                      className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div key={item.id} className="border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline truncate max-w-xs"
                        >
                          {item.url}
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                  {isOwner && (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => openItemEdit(item)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePortfolio(item.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
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

        {/* Reviews Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Reviews</h2>
            {reviewsData && reviewsData.totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(reviewsData.averageRating ?? 0)} readonly size="sm" />
                <span className="text-sm text-gray-600">
                  {reviewsData.averageRating?.toFixed(1)} · {reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {!reviewsData || reviewsData.totalReviews === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviewsData.reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{r.reviewer.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.reviewer.role}</span>
                        {r.project && (
                          <span className="text-xs text-gray-400 truncate max-w-xs">on "{r.project.title}"</span>
                        )}
                      </div>
                      <StarRating value={r.rating} readonly size="sm" />
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{r.comment}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
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
