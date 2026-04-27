import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProjects } from '../api/projects';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function BrowseProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounce search: reset to page 1 on new query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPage(1, query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function handlePageChange(p: number) {
    fetchPage(p, query);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Projects</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-500">No open projects found.</p>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">{p.title}</h2>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{p.description}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="font-semibold text-gray-800">${p.budget.toLocaleString()}</span>
                <span>{p._count.bids} bids</span>
                <span>By {p.client.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
    </Layout>
  );
}
