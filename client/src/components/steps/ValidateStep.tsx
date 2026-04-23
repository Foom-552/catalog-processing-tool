import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { validateCatalog } from '../../services/api';
import { useWizardStore } from '../../stores/wizardStore';
import { ValidationSummary } from '../validation/ValidationSummary';
import { ValidationTable } from '../validation/ValidationTable';
import { ReportDownloadBar } from '../validation/ReportDownloadBar';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export function ValidateStep() {
  const {
    sessionId,
    validationResult,
    setValidationResult,
    setStep,
  } = useWizardStore();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['validate', sessionId],
    queryFn: () => validateCatalog(sessionId!),
    enabled: !!sessionId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) setValidationResult(data);
  }, [data, setValidationResult]);

  const result = data ?? validationResult;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Validation Results</h2>
        <p className="text-sm text-gray-500 mt-1">
          All catalog rules have been checked. Review any errors or warnings before proceeding.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <Spinner size="lg" label="Validating catalog..." />
        </div>
      )}

      {isError && (
        <Alert variant="error" title="Validation failed">
          {error instanceof Error ? error.message : 'An error occurred during validation.'}
        </Alert>
      )}

      {result && !isLoading && (
        <div className="space-y-5">
          <ValidationSummary result={result} />
          <ValidationTable issues={result.issues} />
          <ReportDownloadBar sessionId={sessionId!} />

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setStep(3)}
            >
              Proceed to Convert
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
