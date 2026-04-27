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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a Project</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} required min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Posting…' : 'Post Project'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
