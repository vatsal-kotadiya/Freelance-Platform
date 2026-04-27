import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyProjects } from '../api/projects';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  function fetchPage(p: number) {
    setLoading(true);
    getMyProjects(p, PAGE_SIZE)
      .then((res) => {
        setProjects(res.data);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
        <Link to="/create-project"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Post Project
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-500">No projects yet.</p>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{p.title}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{p._count.bids} bids</span>
                  <StatusBadge status={p.status} />
                  {p.payment && <StatusBadge status={`Payment: ${p.payment.status}`} />}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">${p.budget.toLocaleString()}</p>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
    </Layout>
  );
}
