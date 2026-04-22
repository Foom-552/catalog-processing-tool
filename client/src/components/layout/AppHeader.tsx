import { useState } from 'react';
import { FileText, BookOpen } from 'lucide-react';
import { DocsPanel } from '../docs/DocsPanel';

export function AppHeader() {
  const [docsOpen, setDocsOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Catalog Processing Portal</h1>
            <p className="text-xs text-gray-500">SAP Business Network — CIF 3.0 &amp; CMS Realms</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <a
              href="https://service.ariba.com/Supplier.aw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
            >
              SAP Business Network ↗
            </a>
            <button
              type="button"
              onClick={() => setDocsOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Resources
            </button>
          </div>
        </div>
      </header>

      <DocsPanel isOpen={docsOpen} onClose={() => setDocsOpen(false)} />
    </>
  );
}
