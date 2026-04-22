import { Upload, ShieldCheck, FileDown, Send, ArrowRight } from 'lucide-react';
import { useWizardStore } from '../../stores/wizardStore';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload',
    description: 'Drop in your CIF 3.0 text file or Excel template (CIF 3.0 or CMS Realms). The portal auto-detects the format.',
    formats: ['.cif', '.xls', '.xlsx'],
  },
  {
    icon: ShieldCheck,
    title: 'Validate',
    description: 'Every item is checked against SAP Business Network compliance rules — required fields, UNSPSC codes, ISO currency, UoM codes and more.',
    formats: [],
  },
  {
    icon: FileDown,
    title: 'Convert',
    description: 'Export a clean CIF 3.0 text file, download the full cXML Catalog Upload Transaction (.mime), or post directly to SBN.',
    formats: [],
  },
  {
    icon: Send,
    title: 'Submit',
    description: 'Download your converted file for manual submission, or let the portal post the cXML transaction directly to your buyer on SAP Business Network.',
    formats: [],
  },
];

export function LandingStep() {
  const { setStep } = useWizardStore();

  return (
    <div className="py-4">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
          <FileDown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          SAP Business Network<br className="sm:hidden" /> Catalog Processing Portal
        </h2>
        <p className="text-gray-500 text-base max-w-lg mx-auto">
          Upload, validate, and submit your SBN catalog in minutes — no account or software required.
        </p>
      </div>

      {/* 4-step workflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="flex gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-600 mb-0.5">Step {idx + 1}</p>
                <p className="font-semibold text-sm text-gray-800 mb-1">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                {s.formats.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {s.formats.map(f => (
                      <span key={f} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono text-gray-600">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature callouts */}
      <div className="flex flex-wrap gap-3 justify-center mb-8 text-xs text-gray-500">
        <span className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> SBN compliance validation
        </span>
        <span className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5">
          <FileDown className="w-3.5 h-3.5 text-blue-500" /> CIF 3.0 &amp; cXML export
        </span>
        <span className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5">
          <Send className="w-3.5 h-3.5 text-purple-500" /> Direct SBN POST
        </span>
        <span className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5">
          <Upload className="w-3.5 h-3.5 text-orange-500" /> .cif · .xls · .xlsx
        </span>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md shadow-blue-200 transition-colors text-sm"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-gray-400 mt-3">No account required &middot; Files processed in-browser session only</p>
      </div>
    </div>
  );
}
