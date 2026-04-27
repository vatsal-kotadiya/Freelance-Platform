import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getClientDashboard, getFreelancerDashboard } from '../api/dashboard';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = user?.role === 'CLIENT' ? getClientDashboard : getFreelancerDashboard;
    fetch().then(setData).catch(() => setError('Failed to load dashboard'));
  }, [user?.role]);

  if (error) return <Layout><p className="text-red-500 text-sm">{error}</p></Layout>;
  if (!data) return (
    <Layout>
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (user?.role === 'CLIENT') {
    return <ClientDashboard user={user} data={data} />;
  }

  return <FreelancerDashboard user={user} data={data} />;
}

function ClientDashboard({ user, data }: { user: any; data: any }) {
  const { stats, projects } = data;
  const [query, setQuery] = useState('');

  const filtered = query
    ? projects.filter((p: any) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      )
    : projects;

  function getSuggestions(q: string): string[] {
    if (!q.trim()) return [];
    return projects
      .filter((p: any) => p.title.toLowerCase().includes(q.toLowerCase()))
      .map((p: any) => p.title)
      .slice(0, 6);
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
        </div>
        <Link
          to="/create-project"
          className="bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all shadow-sm hover:shadow-md"
        >
          + Post Project
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Open Projects" value={stats.open} accent="orange" />
        <StatCard label="In Progress" value={stats.inProgress} accent="blue" />
        <StatCard label="Completed" value={stats.completed} accent="green" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Your Projects</h2>
        <Link to="/my-projects" className="text-sm text-orange-500 hover:text-orange-600 font-semibold">
          View all →
        </Link>
      </div>

      <SearchBar
        placeholder="Search your projects..."
        getSuggestions={getSuggestions}
        onSearch={setQuery}
      />

      {projects.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-gray-500 text-sm mb-4">No projects yet.</p>
          <Link
            to="/create-project"
            className="inline-block bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all"
          >
            Post your first project
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-gray-500 text-sm">No projects match "{query}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p: any) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-orange-200 hover:shadow-sm transition-all group"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors truncate">{p.title}</h3>
                <p className="text-sm text-gray-400 mt-0.5">${p.budget.toLocaleString()} · {p._count.bids} bid{p._count.bids !== 1 ? 's' : ''}</p>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}

function FreelancerDashboard({ user, data }: { user: any; data: any }) {
  const { stats, bids } = data;
  const [query, setQuery] = useState('');

  const filtered = query
    ? bids.filter((b: any) =>
        b.project.title.toLowerCase().includes(query.toLowerCase()) ||
        b.project.client?.name?.toLowerCase().includes(query.toLowerCase())
      )
    : bids;

  function getSuggestions(q: string): string[] {
    if (!q.trim()) return [];
    return bids
      .filter((b: any) => b.project.title.toLowerCase().includes(q.toLowerCase()))
      .map((b: any) => b.project.title)
      .slice(0, 6);
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Hello, {user?.name.split(' ')[0]} 👋
          </h1>
        </div>
        <Link
          to="/projects"
          className="bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all shadow-sm hover:shadow-md"
        >
          Browse Projects
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Pending Bids" value={stats.pending} accent="orange" />
        <StatCard label="Accepted" value={stats.accepted} accent="green" />
        <StatCard label="Rejected" value={stats.rejected} accent="red" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Your Bids</h2>
        <Link to="/my-bids" className="text-sm text-orange-500 hover:text-orange-600 font-semibold">
          View all →
        </Link>
      </div>

      <SearchBar
        placeholder="Search your bids..."
        getSuggestions={getSuggestions}
        onSearch={setQuery}
      />

      {bids.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-gray-500 text-sm mb-4">No bids yet.</p>
          <Link
            to="/projects"
            className="inline-block bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all"
          >
            Browse open projects
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-gray-500 text-sm">No bids match "{query}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b: any) => (
            <Link
              key={b.id}
              to={`/projects/${b.project.id}`}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-orange-200 hover:shadow-sm transition-all group"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors truncate">{b.project.title}</h3>
                <p className="text-sm text-gray-400 mt-0.5">Your bid: ${b.amount.toLocaleString()} · {b.project.client.name}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <StatusBadge status={b.status} />
                <StatusBadge status={b.project.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  const styles: Record<string, string> = {
    orange: 'bg-orange-50 border-orange-100',
    blue:   'bg-blue-50 border-blue-100',
    green:  'bg-emerald-50 border-emerald-100',
    red:    'bg-red-50 border-red-100',
    gray:   'bg-gray-50 border-gray-100',
  };
  const numStyles: Record<string, string> = {
    orange: 'text-orange-600',
    blue:   'text-blue-600',
    green:  'text-emerald-600',
    red:    'text-red-600',
    gray:   'text-gray-600',
  };
  return (
    <div className={`rounded-2xl border p-5 ${styles[accent] ?? styles.gray}`}>
      <p className={`text-3xl font-extrabold ${numStyles[accent] ?? numStyles.gray}`}>{value}</p>
      <p className="text-sm text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}
