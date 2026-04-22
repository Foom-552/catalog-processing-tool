import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { TemplateTypeBadge } from './TemplateTypeBadge';
import { uploadFile } from '../../services/api';
import { useWizardStore } from '../../stores/wizardStore';

export function DropZone() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { uploadResponse, setUploadResponse, setSessionId, setStep } = useWizardStore();

  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await uploadFile(accepted[0]);
      setSessionId(result.sessionId);
      setUploadResponse(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [setUploadResponse, setSessionId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.cif', '.txt'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: loading,
  });

  const clearFile = () => {
    setUploadResponse(null as never);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {!uploadResponse ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-gray-50'
          } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-gray-500 text-sm">Processing file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                <Upload className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">
                  {isDragActive ? 'Drop your catalog file here' : 'Drag & drop your catalog file'}
                </p>
                <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {['.xls', '.xlsx', '.cif', '.csv'].map(ext => (
                  <span key={ext} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">{ext}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400">Max 50 MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{uploadResponse.fileName}</p>
              <p className="text-xs text-gray-400">{(uploadResponse.fileSize / 1024).toFixed(1)} KB</p>
              <div className="mt-2">
                <TemplateTypeBadge detection={uploadResponse.detection} />
              </div>
            </div>
            <button onClick={clearFile} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

      {uploadResponse && uploadResponse.detection.templateType !== 'UNKNOWN' && (
        <div className="flex justify-end">
          <button
            onClick={() => setStep(2)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Proceed to Validate →
          </button>
        </div>
      )}

      {uploadResponse && uploadResponse.detection.templateType === 'UNKNOWN' && (
        <Alert variant="warning" title="Template not recognised">
          The file could not be identified as a CIF 3.0 Excel or CMS Realms template. Please upload a valid catalog file.
        </Alert>
      )}
    </div>
  );
}
