export type TemplateType = 'CIF30_EXCEL' | 'CMS_REALMS' | 'CIF_TEXT' | 'UNKNOWN';

export interface DetectionResult {
  templateType: TemplateType;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  detectedFeatures: string[];
  warnings: string[];
}

export interface UploadResponse {
  sessionId: string;
  fileName: string;
  fileSize: number;
  detection: DetectionResult;
}

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssue {
  rowIndex: number | null;
  rowNumber?: number;
  field: string;
  originalValue: string;
  message: string;
  severity: ValidationSeverity;
  ruleCode: string;
}

export interface RuleSummary {
  ruleCode: string;
  ruleName: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  affectedRows: number;
}

export interface ValidationResult {
  sessionId: string;
  passed: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: ValidationIssue[];
  rulesSummary: RuleSummary[];
  itemCount: number;
  validItemCount: number;
}

export type OutputFormat = 'CIF_TEXT' | 'CXML_FILE' | 'ARIBA_POST';

export interface AribaPostConfig {
  fromANID: string;
  toANID: string;
  senderANID: string;
  sharedSecret: string;
  catalogName: string;
  description?: string;
  deploymentMode: 'production' | 'test';
  notificationEmail?: string;
  commodityCode?: string;
  autoPublish?: boolean;
  urlPost?: boolean;
}

export interface ConversionResult {
  sessionId: string;
  outputFormat: OutputFormat;
  cifText?: string;
  cxmlText?: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  conversionLog?: string[];
}

export interface AribaPostResult {
  httpStatusCode: number;
  cxmlStatusCode: string;
  cxmlStatusText: string;
  cxmlStatusDescription: string;
  rawResponseBody: string;
  payloadId: string;
  timestamp: string;
}

export interface CxmlVersionInfo {
  version: string;
  dtdUrl: string;
  source: 'live' | 'fallback';
}

