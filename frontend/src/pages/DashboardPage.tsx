import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getClientDashboard, getFreelancerDashboard } from '../api/dashboard';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = user?.role === 'CLIENT' ? getClientDashboard : getFreelancerDashboard;
    fetch().then(setData).catch(() => setError('Failed to load dashboard'));
  }, [user?.role]);

  if (error) return <Layout><p className="text-red-600">{error}</p></Layout>;
  if (!data) return <Layout><p className="text-gray-500">Loading…</p></Layout>;

  if (user?.role === 'CLIENT') {
    const { stats, projects } = data;
    return (
      <Layout>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Client Dashboard</h1>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Open Projects" value={stats.open} color="green" />
          <StatCard label="In Progress" value={stats.inProgress} color="blue" />
          <StatCard label="Completed" value={stats.completed} color="gray" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500">No projects yet. <Link to="/create-project" className="text-indigo-600 hover:underline">Post one</Link>.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((p: any) => (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{p.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{p._count.bids} bids</span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">${p.budget.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  const { stats, bids } = data;
  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Freelancer Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Pending Bids" value={stats.pending} color="yellow" />
        <StatCard label="Accepted" value={stats.accepted} color="green" />
        <StatCard label="Rejected" value={stats.rejected} color="red" />
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Bids</h2>
      {bids.length === 0 ? (
        <p className="text-gray-500">No bids yet. <Link to="/projects" className="text-indigo-600 hover:underline">Browse projects</Link>.</p>
      ) : (
        <div className="space-y-3">
          {bids.map((b: any) => (
            <Link key={b.id} to={`/projects/${b.project.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{b.project.title}</span>
                <div className="flex gap-2">
                  <StatusBadge status={b.status} />
                  <StatusBadge status={b.project.status} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Your bid: ${b.amount.toLocaleString()} · Client: {b.project.client.name}</p>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    gray: 'bg-gray-50 text-gray-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
}
