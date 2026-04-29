import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyProjects, getMyProjectSuggestions } from '../api/projects';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';

const PAGE_SIZE = 10;

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSearch, setActiveSearch] = useState('');

  function fetchPage(p: number, search: string) {
    setLoading(true);
    getMyProjects(p, PAGE_SIZE, search)
      .then((res) => {
        setProjects(res.data);
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchPage(1, ''); }, []);

  function handleSearch(q: string) {
    setActiveSearch(q);
    fetchPage(1, q);
  }

  function handlePageChange(p: number) {
    fetchPage(p, activeSearch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-1">Client</p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">My Projects</h1>
          <Link
            to="/create-project"
            className="bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all shadow-sm hover:shadow-md"
          >
            + Post Project
          </Link>
        </div>
      </div>

      <SearchBar
        placeholder="Search your projects..."
        getSuggestions={getMyProjectSuggestions}
        onSearch={handleSearch}
      />

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
          {activeSearch ? (
            <>
              <p className="text-gray-500 text-sm mb-3">No projects match "{activeSearch}".</p>
              <button
                onClick={() => handleSearch('')}
                className="text-sm text-orange-500 hover:text-orange-600 font-semibold"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-4">No projects yet.</p>
              <Link
                to="/create-project"
                className="inline-block bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all"
              >
                Post your first project
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-orange-200 hover:shadow-sm transition-all group"
            >
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors truncate">{p.title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">${p.budget.toLocaleString()} · {p._count.bids} bid{p._count.bids !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={p.status} />
                {p.payment && <StatusBadge status={`Payment: ${p.payment.status}`} />}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
    </Layout>
  );
}
