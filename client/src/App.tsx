import { useWizardStore } from './stores/wizardStore';
import { AppHeader } from './components/layout/AppHeader';
import { StepIndicator } from './components/layout/StepIndicator';
import { UploadStep } from './components/steps/UploadStep';
import { ValidateStep } from './components/steps/ValidateStep';
import { ConvertStep } from './components/steps/ConvertStep';
import { ResultStep } from './components/steps/ResultStep';

export default function App() {
  const { step } = useWizardStore();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader />
      <StepIndicator current={step} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {step === 1 && <UploadStep />}
          {step === 2 && <ValidateStep />}
          {step === 3 && <ConvertStep />}
          {step === 4 && <ResultStep />}
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100">
        Catalog Processing Tool — SAP Business Network &middot; cXML powered
      </footer>
    </div>
  );
}
