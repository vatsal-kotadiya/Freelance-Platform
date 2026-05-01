import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getClientDashboard, getFreelancerDashboard } from '../api/dashboard';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';
import { formatCurrency } from '../utils/currency';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 7)}w ago`;
}

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

const ITEMS_PER_PAGE = 5;

function ClientDashboard({ user, data }: { user: any; data: any }) {
  const { stats, projects } = data;
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');
  const [page, setPage] = useState(1);

  const totalBids = projects.reduce((sum: number, p: any) => sum + (p._count?.bids ?? 0), 0);

  function getSuggestions(q: string): string[] {
    if (!q.trim()) return [];
    return projects
      .filter((p: any) => p.title.toLowerCase().includes(q.toLowerCase()))
      .map((p: any) => p.title)
      .slice(0, 6);
  }

  let filtered = [...projects];
  if (query) {
    filtered = filtered.filter((p: any) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase())
    );
  }
  if (statusFilter !== 'ALL') {
    filtered = filtered.filter((p: any) => p.status === statusFilter);
  }
  if (sortBy === 'LATEST') {
    filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'OLDEST') {
    filtered.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sortBy === 'BUDGET') {
    filtered.sort((a: any, b: any) => b.budget - a.budget);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  function handleSearch(q: string) {
    setQuery(q);
    setPage(1);
  }
  function handleStatus(s: string) {
    setStatusFilter(s);
    setPage(1);
  }
  function handleSort(s: string) {
    setSortBy(s);
    setPage(1);
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening with your projects today.</p>
        </div>
        <Link
          to="/create-project"
          className="bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all shadow-sm hover:shadow-md"
        >
          + Post Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Projects" value={stats.open} accent="orange" />
        <StatCard label="In Progress" value={stats.inProgress} accent="blue" />
        <StatCard label="Completed" value={stats.completed} accent="green" />
        <StatCard label="Total Bids" value={totalBids} accent="purple" />
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm mb-5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px]">
          <SearchBar
            placeholder="Search projects by title or keyword..."
            getSuggestions={getSuggestions}
            onSearch={handleSearch}
            compact
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all hover:border-gray-300"
        >
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all hover:border-gray-300"
        >
          <option value="LATEST">Sort by: Latest</option>
          <option value="OLDEST">Sort by: Oldest</option>
          <option value="BUDGET">Sort by: Budget</option>
        </select>
      </div>

      {/* Project list */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">Your Projects</h2>
        <Link to="/my-projects" className="text-sm text-orange-500 hover:text-orange-600 font-semibold transition-colors">
          View all →
        </Link>
      </div>

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
          <p className="text-gray-500 text-sm">No projects match your filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {paginated.map((p: any) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors truncate text-[15px]">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{p.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                    <span>{timeAgo(p.createdAt)}</span>
                    <span className="text-gray-300">·</span>
                    <span>{p._count?.bids ?? 0} bid{(p._count?.bids ?? 0) !== 1 ? 's' : ''}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-gray-800 text-sm">{formatCurrency(p.budget)}</span>
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-6">
              <button
                onClick={() => setPage((v) => Math.max(1, v - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    n === safePage
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

function FreelancerDashboard({ user, data }: { user: any; data: any }) {
  const { stats, bids } = data;
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');
  const [page, setPage] = useState(1);

  function getSuggestions(q: string): string[] {
    if (!q.trim()) return [];
    return bids
      .filter((b: any) => b.project.title.toLowerCase().includes(q.toLowerCase()))
      .map((b: any) => b.project.title)
      .slice(0, 6);
  }

  let filtered = [...bids];
  if (query) {
    filtered = filtered.filter((b: any) =>
      b.project.title.toLowerCase().includes(query.toLowerCase()) ||
      b.project.client?.name?.toLowerCase().includes(query.toLowerCase())
    );
  }
  if (statusFilter !== 'ALL') {
    filtered = filtered.filter((b: any) => b.status === statusFilter);
  }
  if (sortBy === 'LATEST') {
    filtered.sort((a: any, b: any) => new Date(b.createdAt ?? b.project.createdAt).getTime() - new Date(a.createdAt ?? a.project.createdAt).getTime());
  } else if (sortBy === 'AMOUNT') {
    filtered.sort((a: any, b: any) => b.amount - a.amount);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  function handleSearch(q: string) { setQuery(q); setPage(1); }
  function handleStatus(s: string) { setStatusFilter(s); setPage(1); }
  function handleSort(s: string) { setSortBy(s); setPage(1); }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Hello, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's an overview of your active bids.</p>
        </div>
        <Link
          to="/projects"
          className="bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all shadow-sm hover:shadow-md"
        >
          Browse Projects
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Bids" value={stats.pending} accent="orange" />
        <StatCard label="Accepted" value={stats.accepted} accent="green" />
        <StatCard label="Rejected" value={stats.rejected} accent="red" />
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm mb-5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px]">
          <SearchBar
            placeholder="Search bids by project or client..."
            getSuggestions={getSuggestions}
            onSearch={handleSearch}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all hover:border-gray-300"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all hover:border-gray-300"
        >
          <option value="LATEST">Sort by: Latest</option>
          <option value="AMOUNT">Sort by: Amount</option>
        </select>
      </div>

      {/* Bid list */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">Your Bids</h2>
        <Link to="/my-bids" className="text-sm text-orange-500 hover:text-orange-600 font-semibold transition-colors">
          View all →
        </Link>
      </div>

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
          <p className="text-gray-500 text-sm">No bids match your filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {paginated.map((b: any) => (
              <Link
                key={b.id}
                to={`/projects/${b.project.id}`}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors truncate text-[15px]">
                    {b.project.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">Client: {b.project.client?.name}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Your bid: <span className="font-semibold text-gray-600">{formatCurrency(b.amount)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={b.status} />
                  <StatusBadge status={b.project.status} />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-6">
              <button
                onClick={() => setPage((v) => Math.max(1, v - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    n === safePage
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  const cardStyles: Record<string, string> = {
    orange: 'bg-orange-50 border-orange-100',
    blue:   'bg-blue-50 border-blue-100',
    green:  'bg-emerald-50 border-emerald-100',
    red:    'bg-red-50 border-red-100',
    purple: 'bg-purple-50 border-purple-100',
    gray:   'bg-gray-50 border-gray-100',
  };
  const numStyles: Record<string, string> = {
    orange: 'text-orange-600',
    blue:   'text-blue-600',
    green:  'text-emerald-600',
    red:    'text-red-600',
    purple: 'text-purple-600',
    gray:   'text-gray-600',
  };
  const linkStyles: Record<string, string> = {
    orange: 'text-orange-500 hover:text-orange-600',
    blue:   'text-blue-500 hover:text-blue-600',
    green:  'text-emerald-500 hover:text-emerald-600',
    red:    'text-red-500 hover:text-red-600',
    purple: 'text-purple-500 hover:text-purple-600',
    gray:   'text-gray-500 hover:text-gray-600',
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${cardStyles[accent] ?? cardStyles.gray}`}>
      <p className={`text-3xl font-extrabold leading-none ${numStyles[accent] ?? numStyles.gray}`}>{value}</p>
      <p className="text-sm text-gray-500 font-medium mt-1.5">{label}</p>
      <p className={`text-xs font-semibold mt-3 transition-colors cursor-pointer ${linkStyles[accent] ?? linkStyles.gray}`}>
        View all →
      </p>
    </div>
  );
}
