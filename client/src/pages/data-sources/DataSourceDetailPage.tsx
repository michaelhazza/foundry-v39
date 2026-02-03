import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import apiClient from '../../lib/api';
import { DataSource, ApiResponse } from '../../types';

export default function DataSourceDetailPage() {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringProcess, setTriggeringProcess] = useState(false);

  const fetchDataSource = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ApiResponse<DataSource>>(
        `/projects/${projectId}/data-sources/${id}`
      );
      setDataSource(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load data source.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && id) fetchDataSource();
  }, [projectId, id]);

  const handleTriggerProcessing = async () => {
    setTriggeringProcess(true);
    try {
      await apiClient.post(`/projects/${projectId}/data-sources/${id}/process`);
      await fetchDataSource();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to trigger processing.');
    } finally {
      setTriggeringProcess(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (error && !dataSource) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
          <Link to={`/projects/${projectId}`} className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700">
            &larr; Back to Project
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link to={`/projects/${projectId}`} className="text-sm text-blue-600 hover:text-blue-700">
            &larr; Back to Project
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {dataSource && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">{dataSource.name}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(dataSource.status)}`}>
                    {dataSource.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {dataSource.type === 'file_upload' ? 'File Upload' : 'API Connection'}
                </p>
              </div>
              {(dataSource.status === 'pending' || dataSource.status === 'failed') && (
                <button
                  onClick={handleTriggerProcessing}
                  disabled={triggeringProcess}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {triggeringProcess ? 'Starting...' : 'Start Processing'}
                </button>
              )}
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Details</h2>
              </div>
              <dl className="divide-y divide-gray-200">
                <div className="px-6 py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{dataSource.name}</dd>
                </div>
                <div className="px-6 py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {dataSource.type === 'file_upload' ? 'File Upload' : 'Teamwork Desk API'}
                  </dd>
                </div>
                <div className="px-6 py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(dataSource.status)}`}>
                      {dataSource.status}
                    </span>
                  </dd>
                </div>
                <div className="px-6 py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Record Count</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {dataSource.recordCount !== null ? dataSource.recordCount.toLocaleString() : 'N/A'}
                  </dd>
                </div>
                {dataSource.filePath && (
                  <div className="px-6 py-4 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">File</dt>
                    <dd className="text-sm text-gray-900 col-span-2 font-mono text-xs">
                      {dataSource.filePath}
                    </dd>
                  </div>
                )}
                {dataSource.connectionConfig && (
                  <div className="px-6 py-4 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Connection</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {dataSource.connectionConfig.subdomain && (
                        <span className="font-mono text-xs">{dataSource.connectionConfig.subdomain}.teamwork.com</span>
                      )}
                    </dd>
                  </div>
                )}
                <div className="px-6 py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {new Date(dataSource.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div className="px-6 py-4 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {new Date(dataSource.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
