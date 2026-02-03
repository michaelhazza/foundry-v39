import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import apiClient from '../../lib/api';

interface FieldMapping {
  sourceField: string;
  targetField: string;
}

interface DeidentificationRuleForm {
  ruleName: string;
  piiType: string;
  detectionMethod: string;
  maskingStrategy: string;
}

const PII_TYPES = [
  'email',
  'phone_number',
  'name',
  'address',
  'ssn',
  'credit_card',
  'date_of_birth',
  'ip_address',
  'custom',
];

const DETECTION_METHODS = [
  'regex',
  'ner',
  'dictionary',
  'heuristic',
];

const MASKING_STRATEGIES = [
  'redact',
  'hash',
  'mask',
  'pseudonymize',
  'generalize',
  'encrypt',
];

export default function ConfigureProcessingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Schema Mapping state
  const [sourceSchema, setSourceSchema] = useState('');
  const [targetSchema, setTargetSchema] = useState('');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    { sourceField: '', targetField: '' },
  ]);

  // De-identification rules state
  const [rules, setRules] = useState<DeidentificationRuleForm[]>([
    { ruleName: '', piiType: 'email', detectionMethod: 'regex', maskingStrategy: 'redact' },
  ]);

  // Job config
  const [jobType, setJobType] = useState<'import' | 'pii_detection' | 'transformation' | 'export'>('transformation');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'schema' | 'rules' | 'review'>('schema');

  // Field mapping handlers
  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, { sourceField: '', targetField: '' }]);
  };

  const removeFieldMapping = (index: number) => {
    if (fieldMappings.length > 1) {
      setFieldMappings(fieldMappings.filter((_, i) => i !== index));
    }
  };

  const updateFieldMapping = (index: number, field: keyof FieldMapping, value: string) => {
    const updated = [...fieldMappings];
    updated[index] = { ...updated[index], [field]: value };
    setFieldMappings(updated);
  };

  // De-identification rule handlers
  const addRule = () => {
    setRules([...rules, { ruleName: '', piiType: 'email', detectionMethod: 'regex', maskingStrategy: 'redact' }]);
  };

  const removeRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const updateRule = (index: number, field: keyof DeidentificationRuleForm, value: string) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // 1. Create schema mapping
      const validMappings = fieldMappings.filter(
        (m) => m.sourceField.trim() && m.targetField.trim()
      );

      if (validMappings.length > 0) {
        const fieldMappingsObj: Record<string, string> = {};
        validMappings.forEach((m) => {
          fieldMappingsObj[m.sourceField.trim()] = m.targetField.trim();
        });

        await apiClient.post(`/projects/${projectId}/schema-mappings`, {
          sourceSchema: sourceSchema.trim() || 'auto',
          targetSchema: targetSchema.trim() || 'default',
          fieldMappings: fieldMappingsObj,
        });
      }

      // 2. Create de-identification rules
      const validRules = rules.filter((r) => r.ruleName.trim());

      for (const rule of validRules) {
        await apiClient.post(`/projects/${projectId}/deidentification-rules`, {
          ruleName: rule.ruleName.trim(),
          piiType: rule.piiType,
          detectionMethod: rule.detectionMethod,
          maskingStrategy: rule.maskingStrategy,
        });
      }

      // 3. Start the processing job
      await apiClient.post(`/projects/${projectId}/jobs`, {
        type: jobType,
        config: {
          schemaMappingCount: validMappings.length,
          deidentificationRuleCount: validRules.length,
        },
      });

      navigate(`/projects/${projectId}/jobs`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to configure processing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Configure Processing"
        description="Set up schema mappings and de-identification rules, then start a processing job."
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: `Project ${projectId}`, href: `/projects/${projectId}` },
          { label: 'Configure Processing' },
        ]}
      />

      {/* Step Indicator */}
      <div className="mb-8">
        <nav className="flex items-center justify-center" aria-label="Progress">
          <ol className="flex items-center space-x-5">
            {[
              { key: 'schema', label: 'Schema Mapping' },
              { key: 'rules', label: 'De-identification Rules' },
              { key: 'review', label: 'Review & Start' },
            ].map((s, idx) => (
              <li key={s.key} className="flex items-center">
                {idx > 0 && (
                  <svg className="h-5 w-5 text-gray-300 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <button
                  onClick={() => setStep(s.key as typeof step)}
                  className={`flex items-center text-sm font-medium ${
                    step === s.key
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 text-xs font-bold ${
                      step === s.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Schema Mapping */}
      {step === 'schema' && (
        <Card title="Schema Mapping" description="Map source fields to target fields for data transformation.">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sourceSchema" className="block text-sm font-medium text-gray-700 mb-1">
                  Source Schema Name
                </label>
                <input
                  id="sourceSchema"
                  type="text"
                  value={sourceSchema}
                  onChange={(e) => setSourceSchema(e.target.value)}
                  placeholder="e.g., raw_data"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="targetSchema" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Schema Name
                </label>
                <input
                  id="targetSchema"
                  type="text"
                  value={targetSchema}
                  onChange={(e) => setTargetSchema(e.target.value)}
                  placeholder="e.g., processed_data"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Field Mappings</h4>
                <button
                  type="button"
                  onClick={addFieldMapping}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Mapping
                </button>
              </div>

              <div className="space-y-3">
                {fieldMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={mapping.sourceField}
                      onChange={(e) => updateFieldMapping(index, 'sourceField', e.target.value)}
                      placeholder="Source field"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <input
                      type="text"
                      value={mapping.targetField}
                      onChange={(e) => updateFieldMapping(index, 'targetField', e.target.value)}
                      placeholder="Target field"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeFieldMapping(index)}
                      disabled={fieldMappings.length <= 1}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove mapping"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setStep('rules')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Next: De-identification Rules
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: De-identification Rules */}
      {step === 'rules' && (
        <Card title="De-identification Rules" description="Configure rules for detecting and masking PII in your data.">
          <div className="space-y-6">
            {rules.map((rule, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Rule {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    disabled={rules.length <= 1}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      value={rule.ruleName}
                      onChange={(e) => updateRule(index, 'ruleName', e.target.value)}
                      placeholder="e.g., Mask Email Addresses"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PII Type
                    </label>
                    <select
                      value={rule.piiType}
                      onChange={(e) => updateRule(index, 'piiType', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PII_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detection Method
                    </label>
                    <select
                      value={rule.detectionMethod}
                      onChange={(e) => updateRule(index, 'detectionMethod', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {DETECTION_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Masking Strategy
                    </label>
                    <select
                      value={rule.maskingStrategy}
                      onChange={(e) => updateRule(index, 'maskingStrategy', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {MASKING_STRATEGIES.map((strategy) => (
                        <option key={strategy} value={strategy}>
                          {strategy.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addRule}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add Another Rule
            </button>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => setStep('schema')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back: Schema Mapping
              </button>
              <button
                onClick={() => setStep('review')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Next: Review
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Review & Start */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* Job Type Selection */}
          <Card title="Job Type">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Processing Job Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as typeof jobType)}
                className="w-full sm:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="import">Import</option>
                <option value="pii_detection">PII Detection</option>
                <option value="transformation">Transformation</option>
                <option value="export">Export</option>
              </select>
            </div>
          </Card>

          {/* Schema Mapping Review */}
          <Card title="Schema Mapping Summary">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Source Schema:</span>{' '}
                  <span className="text-gray-900">{sourceSchema || 'auto'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Target Schema:</span>{' '}
                  <span className="text-gray-900">{targetSchema || 'default'}</span>
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Field Mappings</h4>
                {fieldMappings.filter((m) => m.sourceField.trim() && m.targetField.trim()).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No field mappings configured</p>
                ) : (
                  <div className="bg-gray-50 rounded-md p-3 space-y-2">
                    {fieldMappings
                      .filter((m) => m.sourceField.trim() && m.targetField.trim())
                      .map((m, i) => (
                        <div key={i} className="flex items-center text-sm">
                          <code className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-800">
                            {m.sourceField}
                          </code>
                          <svg className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <code className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-800">
                            {m.targetField}
                          </code>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* De-identification Rules Review */}
          <Card title="De-identification Rules Summary">
            {rules.filter((r) => r.ruleName.trim()).length === 0 ? (
              <p className="text-sm text-gray-500 italic">No de-identification rules configured</p>
            ) : (
              <div className="space-y-3">
                {rules
                  .filter((r) => r.ruleName.trim())
                  .map((r, i) => (
                    <div key={i} className="bg-gray-50 rounded-md p-3">
                      <p className="text-sm font-medium text-gray-900">{r.ruleName}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {r.piiType.replace(/_/g, ' ')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {r.detectionMethod}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          {r.maskingStrategy}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep('rules')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back: Rules
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Starting Job...
                </>
              ) : (
                <>
                  Start Processing Job
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
