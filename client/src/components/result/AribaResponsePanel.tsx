import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { AribaPostResult } from '../../types/catalog';
import { CopyableCodeBlock } from './CopyableCodeBlock';

const ERROR_HINTS: Record<string, string> = {
  '406': 'The cXML document failed DTD validation. Check the raw response for the specific element error.',
  '450': 'Ariba could not route this request. Check that the supplier–buyer relationship is established on SAP Business Network and that the To ANID and Shared Secret are correct.',
  '401': 'Authentication failed. Verify the From ANID and Shared Secret match your SAP Business Network credentials.',
  '403': 'Access denied. Your supplier account may not have permission to upload to this buyer.',
  '461': 'Invalid commodity code. Use a two-digit UNSPSC segment code (e.g. 52).',
  '462': 'No notification method provided. Enter a Notification Email or enable URL post-back notifications in the form.',
  '463': 'The attached zip file is invalid or corrupt. Re-compress the catalog and try again.',
  '464': 'No catalog file was attached, or more than one was attached. Check the MIME envelope.',
  '465': 'A catalog with this name already exists on SAP Business Network. This tool uses operation "update" — ensure the catalog name matches an existing catalog.',
  '466': 'No existing catalog found with this name on SAP Business Network. The catalog must already exist before it can be updated via this tool.',
  '467': 'Auto-publish failed: the previous version of this catalog must be in "Published" state before auto-publishing an update. Disable Auto-publish in the form and publish manually from SAP Business Network.',
  '468': 'Catalog exceeds the 10 MB limit. Compress the file (zip) before uploading.',
  '469': 'Invalid file extension. The catalog file name must end in .cif, .xml, or .zip.',
  '470': 'The catalog was received but contains errors — it cannot be published. Log in to SAP Business Network to view and correct the errors.',
  '499': 'The cXML document is too large. Reduce the number of items or compress the catalog.',
  '561': 'Upload rate limit exceeded. Wait and try again later.',
  '562': 'SAP Business Network catalog publishing is temporarily unavailable due to scheduled maintenance. Try again later.',
  '563': 'A previous version of this catalog is still being validated. Wait for validation to complete before uploading again.',
  '564': 'SAP Business Network catalog uploading is temporarily unavailable due to scheduled maintenance. Try again later.',
};

interface Props {
  result: AribaPostResult;
}

export function AribaResponsePanel({ result }: Props) {
  const [expanded, setExpanded] = useState(false);

  const isSuccess = result.cxmlStatusCode === '200' || result.cxmlStatusCode === '201';
  const isProcessing = result.cxmlStatusCode === '201';
  const hint = !isSuccess ? ERROR_HINTS[result.cxmlStatusCode] : undefined;

  const cardClass = isSuccess
    ? isProcessing
      ? 'border-blue-200 bg-blue-50'
      : 'border-green-200 bg-green-50'
    : 'border-red-200 bg-red-50';

  const titleClass = isSuccess
    ? isProcessing ? 'text-blue-800' : 'text-green-800'
    : 'text-red-800';

  const badgeClass = isSuccess
    ? isProcessing ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
    : 'bg-red-200 text-red-800';

  const title = isProcessing
    ? 'Catalog Accepted — Processing'
    : isSuccess
      ? 'Catalog Submitted Successfully'
      : 'Submission Failed';

  const Icon = isProcessing ? Clock : isSuccess ? CheckCircle2 : XCircle;
  const iconClass = isProcessing ? 'text-blue-600' : isSuccess ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-5 ${cardClass}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-7 h-7 shrink-0 mt-0.5 ${iconClass}`} />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`font-bold text-lg ${titleClass}`}>{title}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                HTTP {result.httpStatusCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                cXML {result.cxmlStatusCode} {result.cxmlStatusText}
              </span>
            </div>

            {result.cxmlStatusDescription && (
              <p className="text-sm text-gray-600 mt-2">{result.cxmlStatusDescription}</p>
            )}

            {isSuccess && (
              <div className="mt-3 flex items-start gap-2 text-sm text-blue-700 bg-blue-100 border border-blue-200 rounded-lg px-3 py-2">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  SAP Business Network is validating your catalog. Final status (Validated / HasErrors / Published) will be sent via email or URLPost —{' '}
                  <strong>it will not appear in your SAP Business Network Inbox.</strong>{' '}
                  Log in to SAP Business Network to review validation errors or publish manually.
                </span>
              </div>
            )}

            {hint && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                {hint}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Payload ID: <span className="font-mono">{result.payloadId}</span>
            </p>
          </div>
        </div>
      </div>

      {result.rawResponseBody && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Hide' : 'Show'} raw Ariba response
          </button>
          {expanded && (
            <div className="mt-2">
              <CopyableCodeBlock content={result.rawResponseBody} language="xml" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
