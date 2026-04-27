import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBids } from '../api/bids';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bids</h1>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : bids.length === 0 ? (
        <p className="text-gray-500">No bids yet. <Link to="/projects" className="text-indigo-600 hover:underline">Browse projects</Link>.</p>
      ) : (
        <div className="space-y-3">
          {bids.map((b) => (
            <Link key={b.id} to={`/projects/${b.project.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{b.project.title}</h2>
                <div className="flex gap-2">
                  <StatusBadge status={b.status} />
                  <StatusBadge status={b.project.status} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{b.proposal}</p>
              <p className="text-sm text-gray-500 mt-1">Your bid: <strong>${b.amount.toLocaleString()}</strong></p>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
    </Layout>
  );
}
