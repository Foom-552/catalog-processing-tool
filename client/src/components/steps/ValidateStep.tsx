import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { validateCatalog, fetchBuyers } from '../../services/api';
import { useWizardStore } from '../../stores/wizardStore';
import { ValidationSummary } from '../validation/ValidationSummary';
import { ValidationTable } from '../validation/ValidationTable';
import { ReportDownloadBar } from '../validation/ReportDownloadBar';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { ArrowRight, ArrowLeft, ChevronDown, ShieldCheck } from 'lucide-react';

export function ValidateStep() {
  const {
    sessionId,
    validationResult,
    validationBuyer,
    setValidationResult,
    setValidationBuyer,
    setStep,
  } = useWizardStore();

  const [buyers, setBuyers] = useState<string[]>([]);
  const [buyerDropdownOpen, setBuyerDropdownOpen] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState('');

  useEffect(() => {
    fetchBuyers().then(setBuyers).catch(() => setBuyers([]));
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['validate', sessionId, validationBuyer ?? ''],
    queryFn: () => validateCatalog(sessionId!, validationBuyer),
    enabled: !!sessionId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) setValidationResult(data);
  }, [data, setValidationResult]);

  const result = data ?? validationResult;

  const filteredBuyers = buyerSearch
    ? buyers.filter(b => b.toLowerCase().includes(buyerSearch.toLowerCase()))
    : buyers;

  const handleBuyerSelect = (buyer: string | null) => {
    setValidationBuyer(buyer);
    setBuyerSearch(buyer ?? '');
    setBuyerDropdownOpen(false);
  };

  const buyerRulesApplied = validationBuyer && result?.rulesSummary.some(
    r => r.ruleCode === 'BUYER_COMMODITY_CODE' || r.ruleCode === 'BUYER_UOM_CODE',
  );

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Validation Results</h2>
            <p className="text-sm text-gray-500 mt-1">
              All catalog rules have been checked. Review any errors or warnings before proceeding.
            </p>
          </div>
          {validationBuyer && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              {validationBuyer} buyer rules active
            </span>
          )}
        </div>

        {/* Buyer selector */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-gray-600 shrink-0">Validate for customer:</span>
          <div className="relative w-64">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
              <input
                type="text"
                value={buyerSearch}
                onChange={e => {
                  setBuyerSearch(e.target.value);
                  setBuyerDropdownOpen(true);
                }}
                onFocus={() => setBuyerDropdownOpen(true)}
                placeholder="None — standard rules only"
                className="flex-1 px-3 py-1.5 text-sm outline-none bg-white"
              />
              <button
                type="button"
                onClick={() => setBuyerDropdownOpen(v => !v)}
                className="px-2 text-gray-400 hover:text-gray-600"
                aria-label="Toggle buyer list"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {buyerDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-52 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleBuyerSelect(null)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 italic ${
                    !validationBuyer ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-400'
                  }`}
                >
                  None — standard rules only
                </button>
                {filteredBuyers.map(buyer => (
                  <button
                    key={buyer}
                    type="button"
                    onClick={() => handleBuyerSelect(buyer)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 ${
                      buyer === validationBuyer ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {buyer}
                  </button>
                ))}
              </div>
            )}
          </div>
          {buyerRulesApplied && (
            <span className="text-xs text-gray-400">
              Buyer-specific commodity &amp; UoM restrictions applied
            </span>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {buyerDropdownOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setBuyerDropdownOpen(false)} />
      )}

      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <Spinner size="lg" label={validationBuyer ? `Validating against ${validationBuyer} rules...` : 'Validating catalog...'} />
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
