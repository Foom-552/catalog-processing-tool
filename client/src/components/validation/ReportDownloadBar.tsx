import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { getReportUrl } from '../../services/api';

interface Props {
  sessionId: string;
}

export function ReportDownloadBar({ sessionId }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-gray-600 font-medium">Download report:</span>
      <a
        href={getReportUrl(sessionId, 'excel')}
        download
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <FileSpreadsheet className="w-4 h-4 text-green-600" />
        Excel (.xlsx)
        <Download className="w-3.5 h-3.5 text-gray-400" />
      </a>
      <a
        href={getReportUrl(sessionId, 'pdf')}
        download
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <FileText className="w-4 h-4 text-red-500" />
        PDF
        <Download className="w-3.5 h-3.5 text-gray-400" />
      </a>
    </div>
  );
}
