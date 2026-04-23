import { FileText } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
        <div className="bg-blue-600 rounded-lg p-2">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Catalog Processing Portal</h1>
          <p className="text-xs text-gray-500">SAP Business Network — CIF 3.0 &amp; CMS Realms</p>
        </div>
        <div className="ml-auto">
          <a
            href="https://service.ariba.com/Supplier.aw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            SAP Business Network ↗
          </a>
        </div>
      </div>
    </header>
  );
}
