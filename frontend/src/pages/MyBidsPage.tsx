import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBids } from '../api/bids';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { formatCurrency } from '../utils/currency';

const PAGE_SIZE = 10;

export default function MyBidsPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  function fetchPage(p: number) {
    setLoading(true);
    getMyBids(p, PAGE_SIZE)
      .then((res) => {
        setBids(res.data);
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchPage(1); }, []);

  function handlePageChange(p: number) {
    fetchPage(p);
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
        <h1 className="text-3xl font-extrabold text-gray-900">My Bids</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">💼</p>
          <p className="text-gray-500 text-sm mb-4">No bids yet.</p>
          <Link
            to="/projects"
            className="inline-block bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all"
          >
            Browse open projects
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((b) => (
            <Link
              key={b.id}
              to={`/projects/${b.project.id}`}
              className="block bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-orange-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors truncate">{b.project.title}</h2>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{b.proposal}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Your bid: <span className="font-bold text-gray-700">{formatCurrency(b.amount)}</span>
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  <StatusBadge status={b.status} />
                  <StatusBadge status={b.project.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
    </Layout>
  );
}
