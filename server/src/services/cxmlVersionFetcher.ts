import axios from 'axios';

interface CxmlVersionInfo {
  version: string;
  dtdUrl: string;
  source: 'live' | 'fallback';
}

let cachedVersion: CxmlVersionInfo | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const FALLBACK: CxmlVersionInfo = {
  version: '1.2.069',
  dtdUrl: 'http://xml.cxml.org/schemas/cXML/1.2.069/cXML.dtd',
  source: 'fallback',
};

export async function fetchCxmlVersion(): Promise<CxmlVersionInfo> {
  const now = Date.now();
  if (cachedVersion && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedVersion;
  }

  try {
    const timeout = parseInt(process.env.CXML_FETCH_TIMEOUT_MS ?? '5000', 10);
    const response = await axios.get('https://www.cxml.org/index.html', {
      timeout,
      headers: { 'User-Agent': 'CatalogProcessingTool/1.0' },
    });

    const html = response.data as string;

    // Match cXML version strings like "1.2.069" — anchored to start with "1."
    // to avoid matching server IP addresses (e.g. "66.159.210") that appear first
    const versionMatch = html.match(/\b(1\.\d+\.\d{3})\b/);
    if (versionMatch) {
      const version = versionMatch[1];
      const result: CxmlVersionInfo = {
        version,
        dtdUrl: `http://xml.cxml.org/schemas/cXML/${version}/cXML.dtd`,
        source: 'live',
      };
      cachedVersion = result;
      cacheTimestamp = now;
      return result;
    }
  } catch (e) {
    console.warn('Could not fetch cXML version from cxml.org, using fallback:', String(e));
  }

  return FALLBACK;
}
