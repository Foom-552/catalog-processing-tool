export type TemplateType = 'CIF30_EXCEL' | 'CMS_REALMS' | 'CIF_TEXT' | 'UNKNOWN';

export interface DetectionResult {
  templateType: TemplateType;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  detectedFeatures: string[];
  warnings: string[];
}

export interface CifHeaderConfig {
  charset: string;
  codeFormat: string;
  loadMode: 'F' | 'I';
  supplierIdDomain: string;
  itemCount: number;
  unuom: boolean;
  currency: string;
  comments?: string;
}

export type RelatedItemType = 'accessories' | 'mandatory' | 'followup' | 'sparepart' | 'similar';

export interface ClassificationCode {
  domain: string;
  value: string;
}

export interface CatalogImage {
  setIndex?: number;
  thumbnail?: string;
  normal?: string;
  detailed?: string;
}

export interface CatalogAttachment {
  setIndex?: number;
  source: string;
  description?: string;
}

export interface PriceConfiguration {
  setIndex: number;
  startDate?: string;
  endDate?: string;
  priceKey?: string;
  amount?: number;
  priceCurrency?: string;
  priceFactor?: number;
  lowerBound?: number;
}

export interface RelatedItem {
  setIndex: number;
  type: RelatedItemType;
  supplierPartId: string;
}

export interface CatalogItem {
  supplierId: string;
  supplierPartId: string;
  itemDescription: string;
  unspscCode: string;
  unitPrice: number;
  unitOfMeasure: string;
  currency: string;

  manufacturerPartId?: string;
  manufacturerName?: string;
  supplierUrl?: string;
  manufacturerUrl?: string;
  marketPrice?: number;
  supplierPartAuxiliaryId?: string;
  language?: string;
  leadTime?: number;
  shortName?: string;

  keywords?: string;
  itemSpec?: string;
  punchOutEnabled?: boolean;
  punchOutLevel?: string;
  territoryAvailable?: string;
  startDate?: string;
  endDate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  isPreferredItem?: boolean;
  promotionRank?: number;
  hazardousMaterials?: string;
  green?: string;
  isPartial?: boolean;
  delete?: boolean;
  inKitOnly?: boolean;
  isInternalPartId?: boolean;
  defaultRelevance?: string;
  contentUnit?: string;
  packingQuantity?: number;
  minimumQuantity?: number;
  quantityInterval?: number;
  priceUnitQuantity?: number;
  priceUnit?: string;
  unitConversion?: number;
  pricingDescription?: string;

  imageUrl?: string;
  thumbnailUrl?: string;

  classificationCodes?: ClassificationCode[];
  images?: CatalogImage[];
  attachments?: CatalogAttachment[];
  priceConfigurations?: PriceConfiguration[];
  relatedItems?: RelatedItem[];
  parametricName?: string;
  parametricData?: string;
}

export interface ParsedCatalog {
  sessionId: string;
  templateType: TemplateType;
  header: CifHeaderConfig;
  items: CatalogItem[];
  parseWarnings: string[];
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

export interface ConversionRequest {
  sessionId: string;
  outputFormat: OutputFormat;
  aribaConfig?: AribaPostConfig;
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

export interface CxmlConfig {
  version: string;
  dtdUrl: string;
  timestamp: string;
  payloadId: string;
  fromANID: string;
  toANID: string;
  senderANID: string;
  sharedSecret: string;
  catalogName: string;
  description?: string;
  cifContentId: string;
  notificationEmail?: string;
  commodityCode?: string;
  autoPublish?: boolean;
  urlPost?: boolean;
}

export interface UploadResponse {
  sessionId: string;
  fileName: string;
  fileSize: number;
  detection: DetectionResult;
}

export interface ValidateResponse {
  sessionId: string;
  validation: ValidationResult;
}

export interface ConvertResponse {
  sessionId: string;
  result: ConversionResult;
}

export interface AribaPostResponse {
  sessionId: string;
  result: AribaPostResult;
}

export interface SessionData {
  catalog: ParsedCatalog;
  validation?: ValidationResult;
  generatedCif?: string;
  generatedCxml?: string;
  generatedCxmlMultipart?: Buffer;
  generatedCxmlBoundary?: string;
  filePath: string;
  createdAt: number;
}

export interface CxmlVersionInfo {
  version: string;
  dtdUrl: string;
  source: 'live' | 'fallback';
}

export interface BuyerValidationRules {
  buyer: string;
  commodityCodes: Set<string>;
  uomCodes: Set<string>;
  hasCommodityFile: boolean;
  hasUomFile: boolean;
}
