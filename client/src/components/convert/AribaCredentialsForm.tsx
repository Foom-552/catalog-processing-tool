import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { AribaPostConfig } from '../../types/catalog';
import { useWizardStore } from '../../stores/wizardStore';

const schema = z.object({
  fromANID: z.string().min(1, 'From ANID is required'),
  toANID: z.string().min(1, 'Buyer ANID is required'),
  senderANID: z.string().min(1, 'Sender ANID is required'),
  sharedSecret: z.string().min(1, 'Shared Secret is required'),
  catalogName: z.string().min(1, 'Catalog Name is required').max(100, 'Max 100 characters'),
  description: z.string().max(500, 'Max 500 characters').optional().or(z.literal('')),
  deploymentMode: z.enum(['production', 'test']),
  notificationEmail: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  commodityCode: z.string().optional().or(z.literal('')),
  autoPublish: z.boolean().optional(),
  urlPost: z.boolean().optional(),
});

export function AribaCredentialsForm() {
  const [showSecret, setShowSecret] = useState(false);
  const { aribaConfig, setAribaConfig } = useWizardStore();

  const { register, watch, setValue, formState: { errors } } = useForm<AribaPostConfig>({
    resolver: zodResolver(schema),
    defaultValues: aribaConfig,
  });

  // Auto-populate senderANID from fromANID
  const fromANID = watch('fromANID');

  const onBlurFrom = () => {
    if (fromANID && !aribaConfig.senderANID) {
      setValue('senderANID', fromANID);
      setAribaConfig({ senderANID: fromANID });
    }
  };

  const handleChange = (field: keyof AribaPostConfig, value: string | boolean) => {
    setAribaConfig({ [field]: value });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">SBN Connection Details</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="From ANID (Supplier)" error={errors.fromANID?.message}>
          <input
            {...register('fromANID', { onChange: e => handleChange('fromANID', e.target.value) })}
            onBlur={onBlurFrom}
            placeholder="AN0100000001"
            className="input-field"
          />
        </Field>

        <Field label="To ANID (Buyer)" error={errors.toANID?.message}>
          <input
            {...register('toANID', { onChange: e => handleChange('toANID', e.target.value) })}
            placeholder="AN0200000001"
            className="input-field"
          />
        </Field>

        <Field label="Sender ANID" error={errors.senderANID?.message}>
          <input
            {...register('senderANID', { onChange: e => handleChange('senderANID', e.target.value) })}
            placeholder="Same as From ANID"
            className="input-field"
          />
        </Field>

        <Field label="Shared Secret" error={errors.sharedSecret?.message}>
          <div className="relative">
            <input
              {...register('sharedSecret', { onChange: e => handleChange('sharedSecret', e.target.value) })}
              type={showSecret ? 'text' : 'password'}
              placeholder="••••••••"
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShowSecret(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Catalog Name" error={errors.catalogName?.message} className="sm:col-span-2">
          <input
            {...register('catalogName', { onChange: e => handleChange('catalogName', e.target.value) })}
            placeholder="My Product Catalog Q2 2026"
            className="input-field"
          />
        </Field>

        <Field label="Description (optional)" error={errors.description?.message} className="sm:col-span-2">
          <input
            {...register('description', { onChange: e => handleChange('description', e.target.value) })}
            placeholder="Brief description of this catalog"
            className="input-field"
          />
        </Field>

        <Field label="Commodity Code (optional)" error={errors.commodityCode?.message}>
          <input
            {...register('commodityCode', { onChange: e => handleChange('commodityCode', e.target.value) })}
            placeholder="e.g. 52"
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">UN/SPSC top-level commodity code for this catalog.</p>
        </Field>

        <Field
          label="Notification Email (optional)"
          error={errors.notificationEmail?.message}
        >
          <input
            {...register('notificationEmail', { onChange: e => handleChange('notificationEmail', e.target.value) })}
            type="email"
            placeholder="notify@yourcompany.com"
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">
            Status updates are sent via email only — they will <strong>not</strong> appear in your SAP Business Network Inbox.
          </p>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <Field label="Deployment Mode">
          <div className="flex gap-3">
            {(['production', 'test'] as const).map(mode => (
              <label key={mode} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  value={mode}
                  {...register('deploymentMode', { onChange: e => handleChange('deploymentMode', e.target.value) })}
                  className="accent-blue-600"
                />
                <span className="text-sm capitalize text-gray-700">{mode}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Options">
          <div className="space-y-2">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoPublish', { onChange: e => handleChange('autoPublish', e.target.checked) })}
                  defaultChecked={aribaConfig.autoPublish !== false}
                  className="accent-blue-600 w-4 h-4"
                />
                <span className="text-sm text-gray-700">Auto-publish on acceptance</span>
              </label>
              <p className="text-xs text-gray-400 mt-1 ml-6">
                Requires: a previous published version exists, the To ANID is your customer's ANID (not SAP Business Network), and operation is "update".
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('urlPost', { onChange: e => handleChange('urlPost', e.target.checked) })}
                className="accent-blue-600 w-4 h-4"
              />
              <span className="text-sm text-gray-700">Enable URL post-back notifications</span>
            </label>
          </div>
        </Field>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
        <span className="px-2 py-0.5 bg-gray-100 rounded font-mono text-gray-500">operation: update</span>
        <span>Catalog upload always uses update mode on the SAP Business Network.</span>
      </div>

      <p className="text-xs text-gray-400">
        Credentials are used only for this session and are never stored or logged.
      </p>
    </div>
  );
}

function Field({ label, error, children, className = '' }: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
