import { create } from 'xmlbuilder2';
import { CxmlConfig } from '../types/catalog';

export interface CxmlBuildResult {
  envelopeXml: string;
  multipartBody: Buffer;
  boundary: string;
  payloadId: string;
}

function buildTimestamp(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hh = pad(Math.floor(absOffset / 60));
  const mm = pad(absOffset % 60);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}${sign}${hh}:${mm}`;
}

export function buildCxml(cifText: string, config: CxmlConfig): CxmlBuildResult {
  const timestamp = buildTimestamp();
  const payloadId = `${Date.now()}.${Math.floor(Math.random() * 999999)}@catalog-tool`;

  // Simple alphanumeric boundary matching the example format
  const partSessionId = `${Date.now()}${Math.floor(Math.random() * 999999)}`;
  const boundary = `AribaCatalogBoundary${partSessionId}`;
  const xmlPartId = `part1.${partSessionId}@catalog-tool`;
  const cifPartId = `part2.${partSessionId}@catalog-tool`;

  // Build cXML document
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .dtd({ name: 'cXML', sysID: config.dtdUrl })
    .ele('cXML', {
      timestamp,
      payloadID: payloadId,
    });

  const header = doc.ele('Header');

  header.ele('From')
    .ele('Credential', { domain: 'NetworkID' })
    .ele('Identity').txt(config.fromANID);

  header.ele('To')
    .ele('Credential', { domain: 'NetworkID' })
    .ele('Identity').txt(config.toANID);

  const sender = header.ele('Sender');
  const senderCred = sender.ele('Credential', { domain: 'NetworkID' });
  senderCred.ele('Identity').txt(config.senderANID);
  senderCred.ele('SharedSecret').txt(config.sharedSecret);
  sender.ele('UserAgent').txt('Catalog Processing Tool 1.0');

  // No deploymentMode attribute on Request — matches the example
  const request = doc.ele('Request');
  const catalogUpload = request.ele('CatalogUploadRequest', { operation: 'update' });

  // xml:lang="en" as per the example
  catalogUpload.ele('CatalogName', { 'xml:lang': 'en' }).txt(config.catalogName);
  catalogUpload.ele('Description', { 'xml:lang': 'en' }).txt(config.description || config.catalogName);

  // Attachment URL references the CIF part Content-ID
  catalogUpload.ele('Attachment').ele('URL').txt(`cid:${cifPartId}`);

  // Optional Commodities
  if (config.commodityCode) {
    catalogUpload.ele('Commodities').ele('CommodityCode').txt(config.commodityCode);
  }

  // AutoPublish (default true)
  catalogUpload.ele('AutoPublish', { enabled: config.autoPublish !== false ? 'true' : 'false' });

  // Notification with optional Email and URLPost
  const notification = catalogUpload.ele('Notification');
  if (config.notificationEmail) {
    notification.ele('Email').txt(config.notificationEmail);
  }
  if (config.urlPost) {
    notification.ele('URLPost', { enabled: 'true' });
  }

  const envelopeXml = doc.end({ prettyPrint: true });

  // Build multipart/related body — no preamble, matching example format exactly
  const CRLF = '\r\n';
  const parts: string[] = [];

  parts.push(`--${boundary}${CRLF}`);
  parts.push(`Content-Type: text/xml; charset=UTF-8${CRLF}`);
  parts.push(`Content-ID: <${xmlPartId}>${CRLF}`);
  parts.push(`${CRLF}`);
  parts.push(`${envelopeXml}${CRLF}`);

  parts.push(`--${boundary}${CRLF}`);
  parts.push(`Content-Type: text/plain; charset=UTF-8${CRLF}`);
  parts.push(`Content-Disposition: attachment; filename=catalog.cif${CRLF}`);
  parts.push(`Content-ID: <${cifPartId}>${CRLF}`);
  parts.push(`${CRLF}`);
  parts.push(`${cifText}${CRLF}`);
  parts.push(`--${boundary}--${CRLF}`);

  const multipartBody = Buffer.from(parts.join(''), 'utf-8');

  return { envelopeXml, multipartBody, boundary, payloadId };
}
