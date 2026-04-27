import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api/projects';
import Layout from '../components/Layout';

export default function CreateProjectPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const project = await createProject({ title, description, budget: Number(budget) });
      navigate(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-xl">
        <div className="mb-8">
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-1">Client</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Post a Project</h1>
          <p className="text-gray-500 text-sm mt-2">Describe your project and set a budget to attract top freelancers.</p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm space-y-5">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-full font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm hover:shadow-md mt-2"
          >
            {loading ? 'Posting…' : 'Post Project'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
