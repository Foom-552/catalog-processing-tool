import { useEffect, useState } from 'react';
import { BookOpen, X, FileText, FileSpreadsheet, ChevronDown, Download, ExternalLink } from 'lucide-react';
import { DocFile } from '../../types/catalog';
import { fetchBuyers, fetchBuyerFiles, getDocFileUrl } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'guide' | 'template' | 'commodity' | 'uom' | 'other';

const TAB_LABELS: Record<TabKey, string> = {
  guide: 'Guides',
  template: 'Templates',
  commodity: 'Commodity Codes',
  uom: 'Unit of Measure',
  other: 'Other',
};

const TAB_ORDER: TabKey[] = ['guide', 'template', 'commodity', 'uom', 'other'];

function formatSize(bytes: number): string {
  if (bytes === 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocsPanel({ isOpen, onClose }: Props) {
  const [buyers, setBuyers] = useState<string[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<string>('');
  const [files, setFiles] = useState<DocFile[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('guide');
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || buyers.length > 0) return;
    setLoadingBuyers(true);
    fetchBuyers()
      .then(setBuyers)
      .catch(() => setBuyers([]))
      .finally(() => setLoadingBuyers(false));
  }, [isOpen]);

  useEffect(() => {
    if (!selectedBuyer) {
      setFiles([]);
      return;
    }
    setLoadingFiles(true);
    fetchBuyerFiles(selectedBuyer)
      .then(data => {
        setFiles(data);
        // Default to first tab that has files
        const firstTab = TAB_ORDER.find(t => data.some(f => f.category === t));
        if (firstTab) setActiveTab(firstTab);
      })
      .catch(() => setFiles([]))
      .finally(() => setLoadingFiles(false));
  }, [selectedBuyer]);

  const filteredBuyers = buyerSearch
    ? buyers.filter(b => b.toLowerCase().includes(buyerSearch.toLowerCase()))
    : buyers;

  const tabsWithFiles = TAB_ORDER.filter(t => files.some(f => f.category === t));
  const visibleFiles = files.filter(f => f.category === activeTab);

  const handleBuyerSelect = (buyer: string) => {
    setSelectedBuyer(buyer);
    setBuyerSearch(buyer);
    setDropdownOpen(false);
  };

  const handleFileOpen = (buyer: string, file: DocFile) => {
    const url = getDocFileUrl(buyer, file.id);
    if (file.extension === 'pdf') {
      window.open(url, '_blank', 'noopener');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Buyer Resources</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buyer selector */}
        <div className="px-5 py-4 border-b border-gray-200 shrink-0">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Customer</label>
          <div className="relative">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <input
                type="text"
                value={buyerSearch}
                onChange={e => {
                  setBuyerSearch(e.target.value);
                  setDropdownOpen(true);
                  if (!e.target.value) setSelectedBuyer('');
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder={loadingBuyers ? 'Loading buyers...' : 'Search buyers...'}
                className="flex-1 px-3 py-2 text-sm outline-none bg-white"
              />
              <button
                type="button"
                onClick={() => setDropdownOpen(v => !v)}
                className="px-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {dropdownOpen && filteredBuyers.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-52 overflow-y-auto">
                {filteredBuyers.map(buyer => (
                  <button
                    key={buyer}
                    type="button"
                    onClick={() => handleBuyerSelect(buyer)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 ${
                      buyer === selectedBuyer ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {buyer}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!selectedBuyer ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Select a customer to view resources
            </div>
          ) : loadingFiles ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="space-y-2 w-full px-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ) : tabsWithFiles.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              No files found for {selectedBuyer}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-0 border-b border-gray-200 px-5 overflow-x-auto shrink-0">
                {tabsWithFiles.map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`py-2.5 px-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              {/* File list */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                {visibleFiles.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    No files found for this category
                  </p>
                ) : (
                  visibleFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 group"
                    >
                      {file.extension === 'pdf' ? (
                        <FileText className="w-8 h-8 shrink-0 text-red-400" />
                      ) : (
                        <FileSpreadsheet className="w-8 h-8 shrink-0 text-green-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {file.folder && <span className="mr-1">{file.folder} •</span>}
                          {formatSize(file.size)}
                          <span className="ml-1 uppercase">.{file.extension}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileOpen(selectedBuyer, file)}
                        className="shrink-0 p-1.5 text-gray-400 hover:text-blue-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title={file.extension === 'pdf' ? 'Open in browser' : 'Download'}
                        aria-label={file.extension === 'pdf' ? 'Open in browser' : 'Download'}
                      >
                        {file.extension === 'pdf' ? (
                          <ExternalLink className="w-4 h-4" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 shrink-0">
          Files served from OneDrive — local sync required
        </div>
      </div>
    </>
  );
}
