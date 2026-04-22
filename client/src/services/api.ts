import axios from 'axios';
import {
  AribaPostConfig, AribaPostResult, ConversionResult,
  CxmlVersionInfo, DocFile, UploadResponse, ValidationResult,
} from '../types/catalog';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<UploadResponse>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function validateCatalog(sessionId: string, buyer?: string | null): Promise<ValidationResult> {
  const { data } = await api.post<{ sessionId: string; validation: ValidationResult }>('/validate', {
    sessionId,
    ...(buyer ? { buyer } : {}),
  });
  return data.validation;
}

export async function convertToCif(sessionId: string): Promise<ConversionResult> {
  const { data } = await api.post<{ sessionId: string; result: ConversionResult }>('/convert', {
    sessionId,
    outputFormat: 'CIF_TEXT',
  });
  return data.result;
}

export async function convertToCxml(sessionId: string, aribaConfig: AribaPostConfig): Promise<ConversionResult> {
  const { data } = await api.post<{ sessionId: string; result: ConversionResult }>('/convert', {
    sessionId,
    outputFormat: 'CXML_FILE',
    aribaConfig,
  });
  return data.result;
}

export async function postToAriba(sessionId: string, aribaConfig: AribaPostConfig): Promise<AribaPostResult> {
  const { data } = await api.post<{ sessionId: string; result: AribaPostResult }>('/convert', {
    sessionId,
    outputFormat: 'ARIBA_POST',
    aribaConfig,
  });
  return data.result;
}

export async function fetchCxmlVersion(): Promise<CxmlVersionInfo> {
  const { data } = await api.get<CxmlVersionInfo>('/convert/version');
  return data;
}

export function getDownloadUrl(sessionId: string, format: 'cif' | 'cxml'): string {
  return `/api/download/${sessionId}/${format}`;
}

export function getReportUrl(sessionId: string, format: 'excel' | 'pdf'): string {
  return `/api/report/${sessionId}/${format}`;
}

export async function fetchBuyers(): Promise<string[]> {
  const { data } = await api.get<string[]>('/docs/buyers');
  return data;
}

export async function fetchBuyerFiles(buyer: string): Promise<DocFile[]> {
  const { data } = await api.get<DocFile[]>(`/docs/buyers/${encodeURIComponent(buyer)}/files`);
  return data;
}

export function getDocFileUrl(buyer: string, fileId: string): string {
  return `/api/docs/buyers/${encodeURIComponent(buyer)}/files/${encodeURIComponent(fileId)}`;
}
