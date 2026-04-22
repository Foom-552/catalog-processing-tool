import { useWizardStore } from '../../stores/wizardStore';
import { DownloadPanel } from '../result/DownloadPanel';
import { AribaResponsePanel } from '../result/AribaResponsePanel';
import { CopyableCodeBlock } from '../result/CopyableCodeBlock';
import { Button } from '../ui/Button';
import { RotateCcw, ArrowLeft } from 'lucide-react';

export function ResultStep() {
  const {
    sessionId, selectedOutput, conversionResult, aribaResult, reset, setStep,
  } = useWizardStore();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {selectedOutput === 'ARIBA_POST' ? 'SBN Submission Result' : 'File Ready'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {selectedOutput === 'ARIBA_POST'
            ? 'Your catalog has been submitted to SAP Business Network.'
            : 'Your converted catalog file is ready for download.'
          }
        </p>
      </div>

      <div className="space-y-5">
        {selectedOutput !== 'ARIBA_POST' && conversionResult && (
          <DownloadPanel
            sessionId={sessionId!}
            outputFormat={conversionResult.outputFormat}
            fileName={conversionResult.fileName}
            byteSize={conversionResult.byteSize}
          />
        )}

        {selectedOutput === 'ARIBA_POST' && aribaResult && (
          <AribaResponsePanel result={aribaResult} />
        )}

        {/* Preview of generated content */}
        {conversionResult?.cifText && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">CIF Content Preview</p>
            <CopyableCodeBlock content={conversionResult.cifText} language="text" />
          </div>
        )}

        {conversionResult?.cxmlText && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">cXML Content Preview</p>
            <CopyableCodeBlock content={conversionResult.cxmlText} language="xml" />
          </div>
        )}

        {/* Conversion log */}
        {conversionResult?.conversionLog && conversionResult.conversionLog.length > 0 && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">Conversion Notes</p>
            <ul className="space-y-1">
              {conversionResult.conversionLog.map((msg, i) => (
                <li key={i} className="text-xs text-blue-700">{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep(3)}>
            Back
          </Button>
          <Button variant="ghost" icon={<RotateCcw className="w-4 h-4" />} onClick={reset}>
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}
