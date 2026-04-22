import { useState } from 'react';
import { XCircle, AlertTriangle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { ValidationIssue, ValidationSeverity } from '../../types/catalog';

interface Props {
  issues: ValidationIssue[];
}

const PAGE_SIZE = 50;

const SEV_CONFIG: Record<ValidationSeverity, { icon: typeof XCircle; cls: string; label: string }> = {
  ERROR: { icon: XCircle, cls: 'text-red-600 bg-red-50', label: 'Error' },
  WARNING: { icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50', label: 'Warning' },
  INFO: { icon: Info, cls: 'text-blue-600 bg-blue-50', label: 'Info' },
};

export function ValidationTable({ issues }: Props) {
  const [filter, setFilter] = useState<ValidationSeverity | 'ALL'>('ALL');
  const [page, setPage] = useState(0);

  const filtered = filter === 'ALL' ? issues : issues.filter(i => i.severity === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const counts = {
    ERROR: issues.filter(i => i.severity === 'ERROR').length,
    WARNING: issues.filter(i => i.severity === 'WARNING').length,
    INFO: issues.filter(i => i.severity === 'INFO').length,
  };

  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-green-700 font-semibold">No issues found — catalog looks great!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filter bar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50 flex-wrap">
        {(['ALL', 'ERROR', 'WARNING', 'INFO'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(0); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'ALL' ? `All (${issues.length})` : `${f} (${counts[f]})`}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-16">Row</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-24">Severity</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-36">Field</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-32">Value</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Issue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map((issue, i) => {
              const { icon: Icon, cls } = SEV_CONFIG[issue.severity];
              return (
                <tr key={i} className={`${issue.severity === 'ERROR' ? 'bg-red-50/30' : issue.severity === 'WARNING' ? 'bg-amber-50/30' : ''} hover:bg-gray-50/80`}>
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">
                    {issue.rowNumber ?? 'Hdr'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
                      <Icon className="w-3 h-3" />
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-600 max-w-0 truncate">
                    {issue.field}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 max-w-0 truncate font-mono">
                    {issue.originalValue?.slice(0, 30) || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-700">{issue.message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
