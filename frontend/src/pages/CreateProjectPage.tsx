import { useState, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api/projects';
import Layout from '../components/Layout';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png'];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_COUNT = 5;

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Graphic Design',
  'Data Science & ML',
  'Writing & Content',
  'Digital Marketing',
  'Video & Animation',
  'DevOps & Cloud',
  'Other',
];

interface ImageEntry {
  file: File;
  preview: string;
}

export default function CreateProjectPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [imageError, setImageError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  function processFiles(files: File[]) {
    setImageError('');
    const remaining = MAX_COUNT - images.length;
    if (remaining <= 0) {
      setImageError(`Maximum ${MAX_COUNT} images allowed.`);
      return;
    }
    const toAdd: ImageEntry[] = [];
    for (const file of files.slice(0, remaining)) {
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
    if (toAdd.length) setImages((prev) => [...prev, ...toAdd]);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    processFiles(selected);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
    setImageError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (imageError) return;
    setError('');
    setLoading(true);
    try {
      const project = await createProject({
        title,
        description,
        budget: Number(budget),
        images: images.map((e) => e.file),
      });
      images.forEach((e) => URL.revokeObjectURL(e.preview));
      navigate(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      {/* Back */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* Heading */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">CLIENT</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Post a Project</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Describe your project clearly and set a budget to attract the right freelancers.
        </p>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT: Form card */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">

            {/* Project Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Project Title <span className="text-orange-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Build a React dashboard"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Category <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all appearance-none text-gray-500"
                >
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="text-gray-900">{cat}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Project Description <span className="text-orange-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                maxLength={2000}
                placeholder="Describe what you need in detail — requirements, deliverables, timeline, preferred skills, and any other important information."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{description.length} / 2000 characters</p>
            </div>

            {/* Sample Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-0.5">
                Sample Images{' '}
                <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-2.5">
                Add up to 5 images to help freelancers understand your project better.
              </p>

              {/* Preview grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {images.map((entry, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                      <img src={entry.preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                        aria-label="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drag-drop zone */}
              {images.length < MAX_COUNT && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => imageInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl py-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dragging
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
                  }`}
                >
                  <svg
                    className="w-8 h-8 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-orange-500">Upload Images</span>
                  <span className="text-xs text-gray-400 mt-0.5">or drag and drop</span>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              )}

              {imageError ? (
                <p className="mt-1.5 text-xs text-red-500">{imageError}</p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-400">
                  JPG, PNG • Max 5 MB per image • Up to 5 images
                </p>
              )}
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Budget (₹) <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
                  ₹
                </span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  min="1"
                  placeholder="Enter your budget"
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!imageError}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            >
              {loading ? 'Posting…' : 'Post Project'}
            </button>
          </form>
        </div>

        {/* RIGHT: Tips card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Tips for a successful project</h3>
            <div className="space-y-0">

              <div className="flex items-start gap-3 pb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Be clear and specific</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Provide as much detail as possible about your project.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="flex items-start gap-3 py-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Define deliverables</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    List the expected results so freelancers know what to deliver.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="flex items-start gap-3 py-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Set a realistic budget</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    A fair budget helps you attract skilled freelancers.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="flex items-start gap-3 pt-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Mention timeline</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Let freelancers know your expected timeline or deadline.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Bottom info box */}
      <div className="mt-5 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">
          Your project will be visible to qualified freelancers after posting.{' '}
          You can edit or close it anytime from your projects.
        </p>
      </div>
    </Layout>
  );
}
