import { Router, Request, Response } from 'express';
import { getSession, updateSession } from '../utils/sessionStore';
import { generateCifText } from '../services/cifGenerator';
import { buildCxml } from '../services/cxmlGenerator';
import { fetchCxmlVersion } from '../services/cxmlVersionFetcher';
import { postToAriba } from '../services/aribaClient';
import { ConversionRequest, CxmlConfig } from '../types/catalog';

const router = Router();

// GET /api/cxml/version
router.get('/version', async (_req: Request, res: Response) => {
  const version = await fetchCxmlVersion();
  res.json(version);
});

// POST /api/convert
router.post('/', async (req: Request, res: Response) => {
  const body = req.body as ConversionRequest;
  const { sessionId, outputFormat, aribaConfig } = body;

  if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return; }

  const session = getSession(sessionId);
  if (!session) { res.status(404).json({ error: 'Session not found or expired' }); return; }

  const { cifText, log } = generateCifText(session.catalog);
  updateSession(sessionId, { generatedCif: cifText });

  if (outputFormat === 'CIF_TEXT') {
    const buf = Buffer.from(cifText, 'utf-8');
    res.json({
      sessionId,
      result: {
        sessionId,
        outputFormat,
        cifText,
        fileName: 'catalog.cif',
        mimeType: 'text/plain',
        byteSize: buf.length,
        conversionLog: log,
      },
    });
    return;
  }

  // Generate cXML for both CXML_FILE and ARIBA_POST
  const versionInfo = await fetchCxmlVersion();
  if (!aribaConfig && outputFormat === 'ARIBA_POST') {
    res.status(400).json({ error: 'aribaConfig is required for ARIBA_POST' });
    return;
  }

  const config: CxmlConfig = {
    version: versionInfo.version,
    dtdUrl: versionInfo.dtdUrl,
    timestamp: new Date().toISOString(),
    payloadId: '',
    fromANID: aribaConfig?.fromANID ?? 'AN0100000001',
    toANID: aribaConfig?.toANID ?? 'AN0200000001',
    senderANID: aribaConfig?.senderANID ?? aribaConfig?.fromANID ?? 'AN0100000001',
    sharedSecret: aribaConfig?.sharedSecret ?? '',
    catalogName: aribaConfig?.catalogName ?? 'Catalog',
    description: aribaConfig?.description || undefined,
    cifContentId: 'catalog.cif',
    notificationEmail: aribaConfig?.notificationEmail || undefined,
    commodityCode: aribaConfig?.commodityCode || undefined,
    autoPublish: aribaConfig?.autoPublish ?? true,
    urlPost: aribaConfig?.urlPost ?? false,
  };

  const { envelopeXml, multipartBody, boundary, payloadId } = buildCxml(cifText, config);
  updateSession(sessionId, { generatedCxml: envelopeXml });

  if (outputFormat === 'CXML_FILE') {
    updateSession(sessionId, {
      generatedCxmlMultipart: multipartBody,
      generatedCxmlBoundary: boundary,
    });
    res.json({
      sessionId,
      result: {
        sessionId,
        outputFormat,
        cxmlText: envelopeXml,
        fileName: 'catalog-upload.mime',
        mimeType: 'application/octet-stream',
        byteSize: multipartBody.length,
        conversionLog: log,
      },
    });
    return;
  }

  // ARIBA_POST
  const aribaResult = await postToAriba(multipartBody, boundary, payloadId);
  res.json({ sessionId, result: aribaResult });
});

export default router;
