import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { ValidationResult } from '../../types/catalog';

interface Props {
  result: ValidationResult;
}

export function ValidationSummary({ result }: Props) {
  const { passed, errorCount, warningCount, itemCount, validItemCount } = result;

  return (
    <div className={`rounded-xl border p-4 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center gap-3 mb-3">
        {passed
          ? <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          : <XCircle className="w-6 h-6 text-red-600 shrink-0" />
        }
        <span className={`font-bold text-lg ${passed ? 'text-green-800' : 'text-red-800'}`}>
          {passed ? 'Validation Passed' : 'Validation Failed'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Items" value={itemCount} color="blue" />
        <Stat label="Valid Items" value={validItemCount} color="green" />
        <Stat label="Errors" value={errorCount} color={errorCount > 0 ? 'red' : 'green'} />
        <Stat label="Warnings" value={warningCount} color={warningCount > 0 ? 'amber' : 'green'} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const textColor = color === 'red' ? 'text-red-700' : color === 'amber' ? 'text-amber-700' : color === 'green' ? 'text-green-700' : 'text-blue-700';
  return (
    <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
