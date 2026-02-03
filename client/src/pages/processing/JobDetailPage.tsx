import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import apiClient from '../../lib/api';
import { ProcessingJob, ApiResponse } from '../../types';

export default function JobDetailPage() {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJob();
  }, [projectId, id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<ApiResponse<ProcessingJob>>(
        `/projects/${projectId}/jobs/${id}`
      );

      setJob(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getJobTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      import: 'Import',
      pii_detection: 'PII Detection',
      transformation: 'Transformation',
      export: 'Export',
    };
    return labels[type] || type;
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

  if (error || !job) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Job</h3>
          <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={fetchJob}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}/jobs`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const totalRecords = job.processedRecords + job.failedRecords;
  const successRate = totalRecords > 0 ? ((job.processedRecords / totalRecords) * 100).toFixed(1) : '0';

  return (
    <Layout>
      <PageHeader
        title={`Job #${job.id}`}
        description={getJobTypeLabel(job.type)}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: `Project ${projectId}`, href: `/projects/${projectId}` },
          { label: 'Jobs', href: `/projects/${projectId}/jobs` },
          { label: `Job #${job.id}` },
        ]}
        actions={
          <button
            onClick={() => navigate(`/projects/${projectId}/jobs`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Jobs
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <StatusBadge status={job.status} className="text-sm" />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Job Type</h3>
          <p className="text-lg font-semibold text-gray-900">{getJobTypeLabel(job.type)}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Success Rate</h3>
          <p className="text-lg font-semibold text-gray-900">{successRate}%</p>
        </div>
      </div>

      {/* Progress Section */}
      <Card title="Record Processing Progress" className="mb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Processed Records</span>
            <span className="font-medium text-green-700">{job.processedRecords.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Failed Records</span>
            <span className={`font-medium ${job.failedRecords > 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {job.failedRecords.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-3">
            <span className="text-gray-600 font-medium">Total Records</span>
            <span className="font-semibold text-gray-900">{totalRecords.toLocaleString()}</span>
          </div>

          {totalRecords > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    job.failedRecords > 0 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${successRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {job.processedRecords.toLocaleString()} of {totalRecords.toLocaleString()} records processed successfully
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Error Message */}
      {job.errorMessage && (
        <Card title="Error Details" className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">Job Failed</h4>
                <p className="text-sm text-red-700 mt-1 font-mono whitespace-pre-wrap">
                  {job.errorMessage}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Configuration */}
      {job.config && Object.keys(job.config).length > 0 && (
        <Card title="Job Configuration" className="mb-6">
          <pre className="bg-gray-50 rounded-md p-4 text-sm text-gray-800 overflow-auto max-h-64 font-mono">
            {JSON.stringify(job.config, null, 2)}
          </pre>
        </Card>
      )}

      {/* Timestamps */}
      <Card title="Timestamps">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="text-sm text-gray-900 mt-1">{formatDate(job.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="text-sm text-gray-900 mt-1">{formatDate(job.updatedAt)}</dd>
          </div>
        </dl>
      </Card>
    </Layout>
  );
}
