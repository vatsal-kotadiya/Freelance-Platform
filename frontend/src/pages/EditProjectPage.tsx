import { useState, useRef, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject, updateProject } from '../api/projects';
import Layout from '../components/Layout';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png'];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_COUNT = 5;

interface NewImageEntry {
  file: File;
  preview: string;
}

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [keepImages, setKeepImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImageEntry[]>([]);
  const [imageError, setImageError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const serverBase = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

  useEffect(() => {
    getProject(id!)
      .then((project) => {
        setTitle(project.title);
        setDescription(project.description);
        setBudget(String(project.budget));
        setKeepImages(project.sampleImages ?? []);
      })
      .catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalImages = keepImages.length + newImages.length;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError('');
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const remaining = MAX_COUNT - totalImages;
    if (remaining <= 0) {
      setImageError(`Maximum ${MAX_COUNT} images allowed.`);
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    const toAdd: NewImageEntry[] = [];
    for (const file of selected.slice(0, remaining)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
        setImageError('Only JPG and PNG images are allowed.');
        break;
      }
      if (file.size > MAX_SIZE) {
        setImageError(`"${file.name}" exceeds the 5 MB limit.`);
        break;
      }
      toAdd.push({ file, preview: URL.createObjectURL(file) });
    }

    if (toAdd.length) setNewImages((prev) => [...prev, ...toAdd]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function removeExistingImage(filename: string) {
    setKeepImages((prev) => prev.filter((f) => f !== filename));
    setImageError('');
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
    setImageError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (imageError) return;
    setError('');
    setSaving(true);
    try {
      await updateProject(id!, {
        title,
        description,
        budget: Number(budget),
        keepImages,
        newImages: newImages.map((e) => e.file),
      });
      newImages.forEach((e) => URL.revokeObjectURL(e.preview));
      navigate(`/projects/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to update project');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      <div className="max-w-xl">
        <div className="mb-8">
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-1">Client</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Edit Project</h1>
          <p className="text-gray-500 text-sm mt-2">Update your project details.</p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Build a React dashboard"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              placeholder="Describe what you need in detail — requirements, deliverables, timeline…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all resize-none"
            />
          </div>

          {/* Sample Images */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Sample Images
                <span className="ml-1.5 text-xs font-normal text-gray-400">(optional · up to 5)</span>
              </label>
              {totalImages > 0 && (
                <span className="text-xs text-gray-400">{totalImages}/{MAX_COUNT}</span>
              )}
            </div>

            {(keepImages.length > 0 || newImages.length > 0) && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {keepImages.map((filename) => (
                  <div key={filename} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={`${serverBase}/uploads/${filename}`}
                      alt={filename}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(filename)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {newImages.map((entry, i) => (
                  <div key={`new-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border border-orange-200">
                    <img
                      src={entry.preview}
                      alt={`new-${i}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {totalImages < MAX_COUNT && (
              <label className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-orange-200 text-orange-500 font-semibold cursor-pointer hover:bg-orange-50 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Images
                <input
                  ref={imageInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}

            {imageError ? (
              <p className="mt-2 text-xs text-red-500">{imageError}</p>
            ) : (
              <p className="mt-2 text-xs text-gray-400">JPG, PNG · Max 5 MB per image</p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Budget (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
                min="1"
                placeholder="500"
                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-full font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !!imageError}
              className="flex-1 bg-orange-500 text-white py-3 rounded-full font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
