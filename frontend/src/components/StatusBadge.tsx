const colors: Record<string, string> = {
  OPEN: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border border-blue-200',
  COMPLETED: 'bg-gray-100 text-gray-600 border border-gray-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-red-50 text-red-600 border border-red-200',
  RELEASED: 'bg-purple-50 text-purple-700 border border-purple-200',
  WORK_SUBMITTED: 'bg-blue-50 text-blue-700 border border-blue-200',
  WORK_REJECTED: 'bg-red-50 text-red-600 border border-red-200',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
