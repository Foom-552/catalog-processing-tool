import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  content: string;
  language?: 'xml' | 'text';
  maxHeight?: string;
}

export function CopyableCodeBlock({ content, maxHeight = '320px' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative rounded-xl border border-gray-200 bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">Preview</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <pre
        className="p-4 text-xs text-gray-200 font-mono leading-relaxed overflow-auto"
        style={{ maxHeight }}
      >
        {content}
      </pre>
    </div>
  );
}
