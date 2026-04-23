import { create } from 'zustand';
import {
  AribaPostConfig, AribaPostResult, ConversionResult,
  OutputFormat, UploadResponse, ValidationResult,
} from '../types/catalog';

interface WizardState {
  step: 0 | 1 | 2 | 3 | 4;
  sessionId: string | null;
  uploadResponse: UploadResponse | null;
  validationResult: ValidationResult | null;
  conversionResult: ConversionResult | null;
  aribaResult: AribaPostResult | null;
  selectedOutput: OutputFormat;
  aribaConfig: AribaPostConfig;

  setStep: (step: 0 | 1 | 2 | 3 | 4) => void;
  setSessionId: (id: string) => void;
  setUploadResponse: (r: UploadResponse) => void;
  setValidationResult: (r: ValidationResult | null) => void;
  setConversionResult: (r: ConversionResult) => void;
  setAribaResult: (r: AribaPostResult) => void;
  setSelectedOutput: (o: OutputFormat) => void;
  setAribaConfig: (c: Partial<AribaPostConfig>) => void;
  reset: () => void;
}

const defaultAribaConfig: AribaPostConfig = {
  fromANID: '',
  toANID: '',
  senderANID: '',
  sharedSecret: '',
  catalogName: '',
  description: '',
  deploymentMode: 'production',
  autoPublish: true,
  urlPost: false,
};

export const useWizardStore = create<WizardState>((set) => ({
  step: 0,
  sessionId: null,
  uploadResponse: null,
  validationResult: null,
  conversionResult: null,
  aribaResult: null,
  selectedOutput: 'CIF_TEXT',
  aribaConfig: { ...defaultAribaConfig },

  setStep: (step) => set({ step }),
  setSessionId: (sessionId) => set({ sessionId }),
  setUploadResponse: (uploadResponse) => set({ uploadResponse }),
  setValidationResult: (validationResult) => set({ validationResult }),
  setConversionResult: (conversionResult) => set({ conversionResult }),
  setAribaResult: (aribaResult) => set({ aribaResult }),
  setSelectedOutput: (selectedOutput) => set({ selectedOutput }),
  setAribaConfig: (c) => set((s) => ({ aribaConfig: { ...s.aribaConfig, ...c } })),
  reset: () => set({
    step: 1,
    sessionId: null,
    uploadResponse: null,
    validationResult: null,
    conversionResult: null,
    aribaResult: null,
    selectedOutput: 'CIF_TEXT',
    aribaConfig: { ...defaultAribaConfig },
  }),
}));
