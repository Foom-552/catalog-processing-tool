import { Download, FileText, Code } from 'lucide-react';
import { getDownloadUrl } from '../../services/api';
import { OutputFormat } from '../../types/catalog';

interface Props {
  sessionId: string;
  outputFormat: OutputFormat;
  fileName: string;
  byteSize: number;
}

export function DownloadPanel({ sessionId, outputFormat, fileName, byteSize }: Props) {
  const format = outputFormat === 'CIF_TEXT' ? 'cif' : 'cxml';
  const url = getDownloadUrl(sessionId, format);
  const Icon = outputFormat === 'CIF_TEXT' ? FileText : Code;
  const kb = (byteSize / 1024).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
        <Icon className="w-8 h-8 text-green-600" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-800">{fileName}</p>
        <p className="text-sm text-gray-400 mt-0.5">{kb} KB</p>
      </div>
      <a
        href={url}
        download={fileName}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
      >
        <Download className="w-5 h-5" />
        Download File
      </a>
    </div>
  );
}
