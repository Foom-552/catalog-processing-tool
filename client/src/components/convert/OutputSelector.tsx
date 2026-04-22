import { FileText, Code, Cloud } from 'lucide-react';
import { OutputFormat } from '../../types/catalog';

interface Props {
  value: OutputFormat;
  onChange: (v: OutputFormat) => void;
}

const OPTIONS: { value: OutputFormat; label: string; sublabel: string; icon: typeof FileText }[] = [
  { value: 'CIF_TEXT', label: 'CIF 3.0 Text File', sublabel: 'Download a .cif file for manual upload or archiving', icon: FileText },
  { value: 'CXML_FILE', label: 'cXML Transaction File', sublabel: 'Download the complete multipart MIME upload transaction (.mime) — POST it yourself via curl or Postman', icon: Code },
  { value: 'ARIBA_POST', label: 'Post to SAP Business Network', sublabel: 'Generate cXML and post directly to Ariba', icon: Cloud },
];

export function OutputSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700 mb-3">Select output format:</p>
      {OPTIONS.map(opt => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="output-format"
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="mt-0.5 accent-blue-600"
            />
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Icon className={`w-5 h-5 ${selected ? 'text-blue-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className={`font-semibold text-sm ${selected ? 'text-blue-700' : 'text-gray-700'}`}>{opt.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{opt.sublabel}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
