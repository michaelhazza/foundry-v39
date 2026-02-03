import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import apiClient from '../../lib/api';
import { Dataset, ApiResponse } from '../../types';

type ExportFormat = 'jsonl' | 'json' | 'csv';

const EXPORT_FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'jsonl', label: 'JSONL', description: 'JSON Lines format - one JSON object per line. Best for streaming and large datasets.' },
  { value: 'json', label: 'JSON', description: 'Standard JSON array format. Best for smaller datasets and APIs.' },
  { value: 'csv', label: 'CSV', description: 'Comma-separated values. Best for spreadsheets and tabular data.' },
];

export default function ExportDatasetPage() {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('jsonl');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    fetchDataset();
  }, [projectId, id]);

  const fetchDataset = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<ApiResponse<Dataset>>(
        `/projects/${projectId}/datasets/${id}`
      );

      setDataset(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportError(null);

      const response = await apiClient.get(
        `/projects/${projectId}/datasets/${id}/export`,
        {
          params: { format: exportFormat },
          responseType: 'blob',
        }
      );

      // Create a download link from the response blob
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Determine filename from Content-Disposition header or fallback
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${dataset?.name || 'dataset'}.${exportFormat}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.response?.data?.message || 'Failed to export dataset. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFormatLabel = (format: string): string => {
    const labels: Record<string, string> = {
      jsonl: 'JSONL',
      json: 'JSON',
      csv: 'CSV',
      qa_pairs: 'QA Pairs',
    };
    return labels[format] || format.toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !dataset) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dataset</h3>
          <p className="text-red-600 mb-4">{error || 'Dataset not found'}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={fetchDataset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}/datasets`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Datasets
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={`Export: ${dataset.name}`}
        description="Download this dataset in your preferred format."
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: `Project ${projectId}`, href: `/projects/${projectId}` },
          { label: 'Datasets', href: `/projects/${projectId}/datasets` },
          { label: dataset.name },
        ]}
        actions={
          <button
            onClick={() => navigate(`/projects/${projectId}/datasets`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Datasets
          </button>
        }
      />

      {/* Dataset Info */}
      <Card title="Dataset Details" className="mb-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{dataset.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Format</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {formatFormatLabel(dataset.format)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Record Count</dt>
            <dd className="mt-1 text-sm text-gray-900">{dataset.recordCount.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Processing Job</dt>
            <dd className="mt-1 text-sm text-blue-600">
              <button
                onClick={() => navigate(`/projects/${projectId}/jobs/${dataset.processingJobId}`)}
                className="hover:text-blue-800 hover:underline"
              >
                Job #{dataset.processingJobId}
              </button>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(dataset.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(dataset.updatedAt)}</dd>
          </div>
        </dl>

        {dataset.metadata && Object.keys(dataset.metadata).length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Metadata</h4>
            <pre className="bg-gray-50 rounded-md p-3 text-xs text-gray-800 overflow-auto max-h-40 font-mono">
              {JSON.stringify(dataset.metadata, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* Export Section */}
      <Card title="Export Dataset" description="Choose an export format and download the dataset.">
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setExportFormat(format.value)}
                  className={`relative rounded-lg border p-4 text-left transition-colors ${
                    exportFormat === format.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{format.label}</span>
                    {exportFormat === format.value && (
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{format.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export Error */}
          {exportError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="ml-3 text-sm text-red-700">{exportError}</p>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {dataset.recordCount.toLocaleString()} records will be exported as {exportFormat.toUpperCase()}
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download {exportFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </Layout>
  );
}
