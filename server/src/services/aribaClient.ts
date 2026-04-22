import axios from 'axios';
import { AribaPostResult } from '../types/catalog';

const ARIBA_ENDPOINT = 'https://service-2.ariba.com/ANCatalogProcessor.aw/ad/catalog';

export async function postToAriba(
  multipartBody: Buffer,
  boundary: string,
  payloadId: string,
): Promise<AribaPostResult> {
  const timestamp = new Date().toISOString();
  let httpStatusCode = 0;
  let rawResponseBody = '';

  try {
    const response = await axios.post(ARIBA_ENDPOINT, multipartBody, {
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
      // Return raw response even on HTTP errors
      validateStatus: () => true,
    });

    httpStatusCode = response.status;
    rawResponseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  } catch (err) {
    httpStatusCode = 0;
    rawResponseBody = String(err);
    return {
      httpStatusCode: 0,
      cxmlStatusCode: '500',
      cxmlStatusText: 'Connection Error',
      cxmlStatusDescription: String(err),
      rawResponseBody,
      payloadId,
      timestamp,
    };
  }

  // Parse cXML Status from response
  const statusCodeMatch = rawResponseBody.match(/code="(\d+)"/);
  const statusTextMatch = rawResponseBody.match(/text="([^"]+)"/);
  const statusDescMatch = rawResponseBody.match(/<Status[^>]*>([^<]*)<\/Status>/);

  return {
    httpStatusCode,
    cxmlStatusCode: statusCodeMatch?.[1] ?? String(httpStatusCode),
    cxmlStatusText: statusTextMatch?.[1] ?? (httpStatusCode === 200 ? 'OK' : 'Error'),
    cxmlStatusDescription: statusDescMatch?.[1]?.trim() ?? rawResponseBody.slice(0, 500),
    rawResponseBody,
    payloadId,
    timestamp,
  };
}
