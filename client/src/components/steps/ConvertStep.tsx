import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { convertToCif, convertToCxml, postToAriba } from '../../services/api';
import { useWizardStore } from '../../stores/wizardStore';
import { OutputSelector } from '../convert/OutputSelector';
import { AribaCredentialsForm } from '../convert/AribaCredentialsForm';
import { CxmlVersionBadge } from '../convert/CxmlVersionBadge';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { ArrowLeft, Send, Download } from 'lucide-react';

export function ConvertStep() {
  const { sessionId, selectedOutput, setSelectedOutput, aribaConfig, setConversionResult, setAribaResult, setStep } = useWizardStore();
  const [formError, setFormError] = useState<string | null>(null);

  const needsCredentials = selectedOutput === 'ARIBA_POST' || selectedOutput === 'CXML_FILE';

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (selectedOutput === 'CIF_TEXT') return { type: 'conversion' as const, data: await convertToCif(sessionId!) };
      if (selectedOutput === 'CXML_FILE') {
        if (!aribaConfig.fromANID || !aribaConfig.toANID || !aribaConfig.sharedSecret || !aribaConfig.catalogName) {
          throw new Error('Please fill in all required connection fields to generate the transaction file.');
        }
        return { type: 'conversion' as const, data: await convertToCxml(sessionId!, aribaConfig) };
      }
      if (selectedOutput === 'ARIBA_POST') {
        if (!aribaConfig.fromANID || !aribaConfig.toANID || !aribaConfig.sharedSecret || !aribaConfig.catalogName) {
          throw new Error('Please fill in all required Ariba connection fields.');
        }
        return { type: 'ariba' as const, data: await postToAriba(sessionId!, aribaConfig) };
      }
      throw new Error('Unknown output format');
    },
    onSuccess: (result) => {
      setFormError(null);
      if (result.type === 'conversion') {
        setConversionResult(result.data);
      } else {
        setAribaResult(result.data);
      }
      setStep(4);
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Conversion failed');
    },
  });

  const buttonLabel = selectedOutput === 'ARIBA_POST'
    ? 'Post to Ariba'
    : selectedOutput === 'CXML_FILE'
      ? 'Download Transaction File'
      : 'Generate File';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Convert &amp; Export</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose how to export your validated catalog. CIF and cXML files can be downloaded locally or posted directly to SAP Business Network.
        </p>
      </div>

      <div className="space-y-5">
        <OutputSelector value={selectedOutput} onChange={setSelectedOutput} />

        {needsCredentials && <AribaCredentialsForm />}

        {selectedOutput === 'CXML_FILE' && (
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            The downloaded <strong>.mime</strong> file contains the complete multipart cXML Catalog Upload Transaction.
            POST it to <code className="font-mono text-xs">https://service-2.ariba.com/ANCatalogProcessor.aw/ad/catalog</code> with{' '}
            <code className="font-mono text-xs">Content-Type: multipart/related; boundary=&lt;boundary from first line&gt;</code>.
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <CxmlVersionBadge />
        </div>

        {formError && <Alert variant="error" onClose={() => setFormError(null)}>{formError}</Alert>}

        <div className="flex items-center justify-between">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep(2)}>
            Back
          </Button>
          <Button
            loading={convertMutation.isPending}
            icon={selectedOutput === 'ARIBA_POST'
              ? <Send className="w-4 h-4" />
              : <Download className="w-4 h-4" />
            }
            onClick={() => convertMutation.mutate()}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
