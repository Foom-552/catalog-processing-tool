import {
  BuyerValidationRules, CatalogItem, CifHeaderConfig, RuleSummary,
  ValidationIssue, ValidationResult, ValidationSeverity,
} from '../types/catalog';
import { ISO4217_CODES } from '../utils/iso4217';
import { UNUOM_CODES, ANSI_UOM_CODES } from '../utils/uomCodes';

const VALID_RELATED_TYPES = new Set(['accessories', 'mandatory', 'followup', 'sparepart', 'similar']);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type RuleResult = { issues: ValidationIssue[]; summary: RuleSummary };

function rule(
  code: string,
  name: string,
  issues: ValidationIssue[],
): RuleSummary {
  const errors = issues.filter(i => i.severity === 'ERROR').length;
  const warns = issues.filter(i => i.severity === 'WARNING').length;
  return {
    ruleCode: code,
    ruleName: name,
    status: errors > 0 ? 'FAIL' : warns > 0 ? 'WARN' : 'PASS',
    affectedRows: issues.length,
  };
}

function issue(
  ruleCode: string,
  field: string,
  message: string,
  severity: ValidationSeverity,
  originalValue: string,
  rowIndex: number | null,
): ValidationIssue {
  return { ruleCode, field, message, severity, originalValue, rowIndex, rowNumber: rowIndex !== null ? rowIndex + 1 : undefined };
}

// ─── Header Rules ─────────────────────────────────────────────────────────────

function checkLoadMode(header: CifHeaderConfig): RuleResult {
  const issues: ValidationIssue[] = [];
  if (header.loadMode !== 'F' && header.loadMode !== 'I') {
    issues.push(issue('LOADMODE_VALID', 'loadMode', `LOADMODE must be 'F' (Full) or 'I' (Incremental), got '${header.loadMode}'`, 'ERROR', String(header.loadMode), null));
  }
  return { issues, summary: rule('LOADMODE_VALID', 'Load Mode Valid', issues) };
}

function checkUnuom(header: CifHeaderConfig): RuleResult {
  const issues: ValidationIssue[] = [];
  if (typeof header.unuom !== 'boolean') {
    issues.push(issue('UNUOM_VALID', 'unuom', "UNUOM must be 'TRUE' or 'FALSE'", 'ERROR', String(header.unuom), null));
  }
  return { issues, summary: rule('UNUOM_VALID', 'UNUOM Valid', issues) };
}

function checkHeaderCurrency(header: CifHeaderConfig): RuleResult {
  const issues: ValidationIssue[] = [];
  if (header.currency && !ISO4217_CODES.has(header.currency.toUpperCase())) {
    issues.push(issue('CURRENCY_VALID', 'currency', `Header currency '${header.currency}' is not a valid ISO 4217 code`, 'ERROR', header.currency, null));
  }
  return { issues, summary: rule('CURRENCY_VALID', 'Header Currency Valid', issues) };
}

function checkItemCountMatch(header: CifHeaderConfig, items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  if (header.itemCount > 0 && header.itemCount !== items.length) {
    issues.push(issue('ITEMCOUNT_MATCH', 'itemCount', `ITEMCOUNT header says ${header.itemCount} but found ${items.length} data rows`, 'WARNING', String(header.itemCount), null));
  }
  return { issues, summary: rule('ITEMCOUNT_MATCH', 'Item Count Matches Header', issues) };
}

// ─── Per-Item Required Fields ─────────────────────────────────────────────────

function checkRequiredFields(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    if (!item.supplierId?.trim()) issues.push(issue('SUPPLIER_ID_REQUIRED', 'supplierId', 'Supplier ID is required', 'ERROR', '', i));
    if (!item.supplierPartId?.trim()) issues.push(issue('PART_ID_REQUIRED', 'supplierPartId', 'Supplier Part ID is required', 'ERROR', '', i));
    if (!item.itemDescription?.trim()) issues.push(issue('DESCRIPTION_REQUIRED', 'itemDescription', 'Item Description is required', 'ERROR', '', i));
    if (!item.unspscCode?.trim()) issues.push(issue('UNSPSC_REQUIRED', 'unspscCode', 'UNSPSC Code is required', 'ERROR', '', i));
    if (item.unitPrice === undefined || item.unitPrice === null) issues.push(issue('PRICE_REQUIRED', 'unitPrice', 'Unit Price is required', 'ERROR', '', i));
    if (!item.unitOfMeasure?.trim()) issues.push(issue('UOM_REQUIRED', 'unitOfMeasure', 'Unit of Measure is required', 'ERROR', '', i));
  });
  return { issues, summary: rule('REQUIRED_FIELDS', 'Required Fields Present', issues) };
}

// ─── Format Rules ─────────────────────────────────────────────────────────────

function checkUnspscFormat(items: CatalogItem[], codeFormat: string): RuleResult {
  const issues: ValidationIssue[] = [];
  const isUnspsc = codeFormat.toUpperCase().includes('UNSPSC');
  items.forEach((item, i) => {
    if (item.unspscCode && !/^\d{8}$/.test(item.unspscCode)) {
      issues.push(issue(
        'UNSPSC_FORMAT',
        'unspscCode',
        isUnspsc
          ? `UNSPSC Code must be exactly 8 digits, got '${item.unspscCode}'`
          : `Classification code '${item.unspscCode}' is not in standard 8-digit UNSPSC format`,
        isUnspsc ? 'ERROR' : 'WARNING',
        item.unspscCode,
        i,
      ));
    }
  });
  return { issues, summary: rule('UNSPSC_FORMAT', 'UNSPSC Code Format', issues) };
}

function checkPricePositive(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    if (item.unitPrice !== undefined && item.unitPrice < 0) {
      issues.push(issue('PRICE_POSITIVE', 'unitPrice', `Unit Price must be >= 0, got ${item.unitPrice}`, 'ERROR', String(item.unitPrice), i));
    }
  });
  return { issues, summary: rule('PRICE_POSITIVE', 'Unit Price Non-Negative', issues) };
}

function checkMarketPrice(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    if (item.marketPrice !== undefined) {
      if (item.marketPrice < 0) {
        issues.push(issue('MARKET_PRICE_VALID', 'marketPrice', `Market Price must be >= 0, got ${item.marketPrice}`, 'ERROR', String(item.marketPrice), i));
      } else if (item.unitPrice !== undefined && item.marketPrice < item.unitPrice) {
        issues.push(issue('MARKET_PRICE_VALID', 'marketPrice', `Market Price (${item.marketPrice}) is less than Unit Price (${item.unitPrice})`, 'WARNING', String(item.marketPrice), i));
      }
    }
  });
  return { issues, summary: rule('MARKET_PRICE_VALID', 'Market Price Valid', issues) };
}

function checkPriceUnitFields(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    if (item.priceUnitQuantity !== undefined && item.priceUnitQuantity <= 0) {
      issues.push(issue('PRICE_UNIT_QUANTITY_VALID', 'priceUnitQuantity', `Price Unit Quantity must be > 0, got ${item.priceUnitQuantity}`, 'ERROR', String(item.priceUnitQuantity), i));
    }
    if (item.unitConversion !== undefined && item.unitConversion <= 0) {
      issues.push(issue('UNIT_CONVERSION_VALID', 'unitConversion', `Unit Conversion must be > 0, got ${item.unitConversion}`, 'ERROR', String(item.unitConversion), i));
    }
  });
  return { issues, summary: rule('PRICE_UNIT_FIELDS', 'Price Unit Fields Valid', issues) };
}

function checkLeadTime(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    if (item.leadTime !== undefined && (!Number.isInteger(item.leadTime) || item.leadTime < 0)) {
      issues.push(issue('LEAD_TIME_POSINT', 'leadTime', `Lead Time must be a non-negative integer, got '${item.leadTime}'`, 'ERROR', String(item.leadTime), i));
    }
  });
  return { issues, summary: rule('LEAD_TIME_POSINT', 'Lead Time Non-Negative Integer', issues) };
}

function checkDateFormats(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  const dateFields: (keyof CatalogItem)[] = ['startDate', 'endDate', 'effectiveDate', 'expirationDate'];
  items.forEach((item, i) => {
    for (const field of dateFields) {
      const val = item[field] as string | undefined;
      if (val && !DATE_REGEX.test(val)) {
        issues.push(issue('DATE_FORMAT', field, `${field} must be YYYY-MM-DD format, got '${val}'`, 'ERROR', val, i));
      }
    }
  });
  return { issues, summary: rule('DATE_FORMAT', 'Date Fields YYYY-MM-DD', issues) };
}

function checkDateRanges(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    if (item.startDate && item.endDate && item.startDate > item.endDate) {
      issues.push(issue('DATE_RANGE', 'startDate/endDate', `Start date ${item.startDate} is after end date ${item.endDate}`, 'WARNING', `${item.startDate} > ${item.endDate}`, i));
    }
    if (item.effectiveDate && item.expirationDate && item.effectiveDate > item.expirationDate) {
      issues.push(issue('DATE_RANGE', 'effectiveDate/expirationDate', `Effective date ${item.effectiveDate} is after expiration date ${item.expirationDate}`, 'WARNING', `${item.effectiveDate} > ${item.expirationDate}`, i));
    }
  });
  return { issues, summary: rule('DATE_RANGE', 'Date Ranges Valid', issues) };
}

function checkItemCurrencies(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    if (item.currency && !ISO4217_CODES.has(item.currency.toUpperCase())) {
      issues.push(issue('CURRENCY_PER_ITEM', 'currency', `Currency '${item.currency}' is not a valid ISO 4217 code`, 'ERROR', item.currency, i));
    }
  });
  return { issues, summary: rule('CURRENCY_PER_ITEM', 'Item Currency Valid', issues) };
}

function checkUomCodes(items: CatalogItem[], useUnuom: boolean): RuleResult {
  const issues: ValidationIssue[] = [];
  const validCodes = useUnuom ? UNUOM_CODES : ANSI_UOM_CODES;
  items.forEach((item, i) => {
    if (item.unitOfMeasure && !validCodes.has(item.unitOfMeasure.toUpperCase())) {
      issues.push(issue('UOM_CODE', 'unitOfMeasure', `Unit of Measure '${item.unitOfMeasure}' not found in ${useUnuom ? 'UN/CEFACT' : 'ANSI'} code list`, 'WARNING', item.unitOfMeasure, i));
    }
  });
  return { issues, summary: rule('UOM_CODE', 'UOM Code Valid', issues) };
}

// ─── Length Rules ─────────────────────────────────────────────────────────────

function checkLengths(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    if (item.supplierId?.length > 255) issues.push(issue('SUPPLIER_ID_LENGTH', 'supplierId', `Supplier ID exceeds 255 chars (${item.supplierId.length})`, 'ERROR', item.supplierId.slice(0, 50) + '...', i));
    if (item.supplierPartId?.length > 255) issues.push(issue('PART_ID_LENGTH', 'supplierPartId', `Supplier Part ID exceeds 255 chars (${item.supplierPartId.length})`, 'ERROR', item.supplierPartId.slice(0, 50) + '...', i));
    if (item.itemDescription?.length > 2000) issues.push(issue('DESCRIPTION_LENGTH', 'itemDescription', `Item Description exceeds 2000 chars (${item.itemDescription.length})`, 'ERROR', item.itemDescription.slice(0, 50) + '...', i));
    if (item.shortName && item.shortName.length > 50) issues.push(issue('SHORT_NAME_LENGTH', 'shortName', `Short Name exceeds 50 chars (${item.shortName.length})`, 'ERROR', item.shortName, i));
  });
  return { issues, summary: rule('FIELD_LENGTHS', 'Field Length Limits', issues) };
}

// ─── Business Rules ───────────────────────────────────────────────────────────

function checkDuplicatePartIds(items: CatalogItem[]): RuleResult {
  const seen = new Map<string, number[]>();
  items.forEach((item, i) => {
    if (!item.supplierPartId) return;
    const key = item.supplierPartId.toLowerCase();
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(i);
  });

  const issues: ValidationIssue[] = [];
  for (const [partId, rows] of seen.entries()) {
    if (rows.length > 1) {
      rows.forEach(i => {
        issues.push(issue('DUPLICATE_PART_ID', 'supplierPartId', `Duplicate Supplier Part ID '${partId}' found in ${rows.length} rows`, 'WARNING', partId, i));
      });
    }
  }
  return { issues, summary: rule('DUPLICATE_PART_ID', 'No Duplicate Part IDs', issues) };
}

function checkRelatedItemTypes(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    item.relatedItems?.forEach(rel => {
      if (!VALID_RELATED_TYPES.has(rel.type)) {
        issues.push(issue('RELATED_ITEM_TYPE', 'relatedItems.type', `Invalid related item type '${rel.type}'. Must be: accessories, mandatory, followup, sparepart, similar`, 'ERROR', rel.type, i));
      }
    });
  });
  return { issues, summary: rule('RELATED_ITEM_TYPE', 'Related Item Types Valid', issues) };
}

function checkPunchOutLevel(items: CatalogItem[]): RuleResult {
  const issues: ValidationIssue[] = [];
  items.forEach((item, i) => {
    if (item.punchOutEnabled === true && !item.punchOutLevel) {
      issues.push(issue('PUNCHOUT_LEVEL', 'punchOutLevel', 'PunchOut Enabled is true but PunchOut Level is not specified', 'WARNING', 'true', i));
    }
  });
  return { issues, summary: rule('PUNCHOUT_LEVEL', 'PunchOut Level Specified', issues) };
}

// ─── Buyer-Specific Rules ─────────────────────────────────────────────────────

function checkBuyerCommodityCodes(items: CatalogItem[], rules: BuyerValidationRules): RuleResult {
  const issues: ValidationIssue[] = [];
  if (!rules.hasCommodityFile) {
    return { issues, summary: rule('BUYER_COMMODITY_CODE', `${rules.buyer} Commodity Codes`, issues) };
  }
  items.forEach((item, i) => {
    if (item.unspscCode && !rules.commodityCodes.has(item.unspscCode.toUpperCase())) {
      issues.push(issue(
        'BUYER_COMMODITY_CODE',
        'unspscCode',
        `UNSPSC code '${item.unspscCode}' is not in ${rules.buyer}'s approved commodity list`,
        'WARNING',
        item.unspscCode,
        i,
      ));
    }
  });
  return { issues, summary: rule('BUYER_COMMODITY_CODE', `${rules.buyer} Commodity Codes`, issues) };
}

function checkBuyerUomCodes(items: CatalogItem[], rules: BuyerValidationRules): RuleResult {
  const issues: ValidationIssue[] = [];
  if (!rules.hasUomFile) {
    return { issues, summary: rule('BUYER_UOM_CODE', `${rules.buyer} UoM Codes`, issues) };
  }
  items.forEach((item, i) => {
    if (item.unitOfMeasure && !rules.uomCodes.has(item.unitOfMeasure.toUpperCase())) {
      issues.push(issue(
        'BUYER_UOM_CODE',
        'unitOfMeasure',
        `Unit of Measure '${item.unitOfMeasure}' is not in ${rules.buyer}'s approved UoM list`,
        'WARNING',
        item.unitOfMeasure,
        i,
      ));
    }
  });
  return { issues, summary: rule('BUYER_UOM_CODE', `${rules.buyer} UoM Codes`, issues) };
}

// ─── Main Validate Function ───────────────────────────────────────────────────

export function validateCatalog(sessionId: string, header: CifHeaderConfig, items: CatalogItem[], buyerRules?: BuyerValidationRules): ValidationResult {
  const allResults: RuleResult[] = [
    checkLoadMode(header),
    checkUnuom(header),
    checkHeaderCurrency(header),
    checkItemCountMatch(header, items),
    checkRequiredFields(items),
    checkUnspscFormat(items, header.codeFormat),
    checkPricePositive(items),
    checkMarketPrice(items),
    checkPriceUnitFields(items),
    checkLeadTime(items),
    checkDateFormats(items),
    checkDateRanges(items),
    checkItemCurrencies(items),
    checkUomCodes(items, header.unuom),
    checkLengths(items),
    checkDuplicatePartIds(items),
    checkRelatedItemTypes(items),
    checkPunchOutLevel(items),
  ];

  if (buyerRules) {
    allResults.push(checkBuyerCommodityCodes(items, buyerRules));
    allResults.push(checkBuyerUomCodes(items, buyerRules));
  }

  const allIssues = allResults.flatMap(r => r.issues);
  const errorCount = allIssues.filter(i => i.severity === 'ERROR').length;
  const warningCount = allIssues.filter(i => i.severity === 'WARNING').length;
  const infoCount = allIssues.filter(i => i.severity === 'INFO').length;

  const itemsWithErrors = new Set(allIssues.filter(i => i.severity === 'ERROR' && i.rowIndex !== null).map(i => i.rowIndex));

  return {
    sessionId,
    passed: errorCount === 0,
    errorCount,
    warningCount,
    infoCount,
    issues: allIssues,
    rulesSummary: allResults.map(r => r.summary),
    itemCount: items.length,
    validItemCount: items.length - itemsWithErrors.size,
  };
}
