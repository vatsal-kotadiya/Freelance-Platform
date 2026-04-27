import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProjects, getProjectSuggestions } from '../api/projects';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';

const PAGE_SIZE = 10;

export default function BrowseProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  function fetchPage(p: number, search: string) {
    setLoading(true);
    listProjects(p, PAGE_SIZE, search)
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
    setAppliedQuery(q);
    fetchPage(1, q);
  }

  function handlePageChange(p: number) {
    fetchPage(p, appliedQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-1">Discover</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Browse Projects</h1>
      </div>

      <SearchBar
        placeholder="Search projects..."
        getSuggestions={getProjectSuggestions}
        onSearch={handleSearch}
      />

      {appliedQuery && (
        <p className="text-sm text-gray-500 -mt-3 mb-5">
          Results for <span className="font-medium text-gray-700">"{appliedQuery}"</span>
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-500 text-sm">No open projects found{appliedQuery ? ` for "${appliedQuery}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="block bg-white border border-gray-100 rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-gray-900 text-base group-hover:text-orange-500 transition-colors">{p.title}</h2>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-5 mt-4 text-sm">
                <span className="font-bold text-gray-900 text-base">${p.budget.toLocaleString()}</span>
                <span className="text-gray-400">{p._count.bids} bid{p._count.bids !== 1 ? 's' : ''}</span>
                <span className="text-gray-400">By <span className="text-gray-600 font-medium">{p.client.name}</span></span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
    </Layout>
  );
}
