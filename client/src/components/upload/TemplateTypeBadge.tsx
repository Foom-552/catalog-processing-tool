import { CheckCircle2, AlertCircle, FileText, HelpCircle } from 'lucide-react';
import { DetectionResult, TemplateType } from '../../types/catalog';

const LABELS: Record<TemplateType, string> = {
  CIF30_EXCEL: 'CIF 3.0 Excel Template',
  CMS_REALMS: 'CMS Realms Template',
  CIF_TEXT: 'CIF 3.0 Text File',
  UNKNOWN: 'Unknown File Type',
};

const DESCRIPTIONS: Partial<Record<TemplateType, string>> = {
  CIF30_EXCEL: 'Standard CIF 3.0 format with 15 core fields',
  CMS_REALMS: 'CMS Realms format with extended fields (1200+ columns)',
  CIF_TEXT: 'Raw CIF 3.0 text file (tab-delimited)',
};

interface Props {
  detection: DetectionResult;
}

export function TemplateTypeBadge({ detection }: Props) {
  const { templateType, confidence } = detection;
  const isKnown = templateType !== 'UNKNOWN';

  const icon = isKnown ? (
    confidence === 'HIGH' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
    <AlertCircle className="w-4 h-4 text-amber-500" />
  ) : <HelpCircle className="w-4 h-4 text-gray-400" />;

  const bgColor = !isKnown ? 'bg-gray-50 border-gray-200' :
    confidence === 'HIGH' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200';

  return (
    <div className={`inline-flex items-start gap-2 rounded-lg border px-3 py-2 ${bgColor}`}>
      <span className="mt-0.5">{icon}</span>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{LABELS[templateType]}</span>
          {isKnown && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              confidence === 'HIGH' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>{confidence} confidence</span>
          )}
        </div>
        {DESCRIPTIONS[templateType] && (
          <p className="text-xs text-gray-500 mt-0.5">{DESCRIPTIONS[templateType]}</p>
        )}
      </div>
    </div>
  );
}
