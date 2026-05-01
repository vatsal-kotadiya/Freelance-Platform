const styles: Record<string, string> = {
  OPEN:           'bg-emerald-50 text-emerald-700 border border-emerald-200',
  IN_PROGRESS:    'bg-blue-50 text-blue-700 border border-blue-200',
  COMPLETED:      'bg-gray-100 text-gray-600 border border-gray-200',
  PENDING:        'bg-amber-50 text-amber-700 border border-amber-200',
  ACCEPTED:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED:       'bg-red-50 text-red-600 border border-red-200',
  RELEASED:       'bg-purple-50 text-purple-700 border border-purple-200',
  WORK_SUBMITTED: 'bg-blue-50 text-blue-700 border border-blue-200',
  WORK_REJECTED:  'bg-red-50 text-red-600 border border-red-200',
};

const labels: Record<string, string> = {
  OPEN:           'Open',
  IN_PROGRESS:    'In Progress',
  COMPLETED:      'Completed',
  PENDING:        'Pending',
  ACCEPTED:       'Accepted',
  REJECTED:       'Rejected',
  RELEASED:       'Released',
  WORK_SUBMITTED: 'Work Submitted',
  WORK_REJECTED:  'Work Rejected',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
        styles[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'
      }`}
    >
      {labels[status] ?? status.replace(/_/g, ' ')}
    </span>
  );
}
