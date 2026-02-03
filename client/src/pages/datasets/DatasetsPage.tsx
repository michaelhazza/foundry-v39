import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import apiClient from '../../lib/api';
import { Dataset, PaginatedResponse } from '../../types';

const FORMAT_STYLES: Record<string, string> = {
  jsonl: 'bg-blue-100 text-blue-800',
  json: 'bg-indigo-100 text-indigo-800',
  csv: 'bg-green-100 text-green-800',
  qa_pairs: 'bg-purple-100 text-purple-800',
};

export default function DatasetsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDatasets();
  }, [projectId, page]);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<PaginatedResponse<Dataset>>(
        `/projects/${projectId}/datasets`,
        { params: { page, limit: 10 } }
      );

      setDatasets(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotal(response.data.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Datasets</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDatasets}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Datasets"
        description={`${total} dataset${total !== 1 ? 's' : ''} in this project`}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: `Project ${projectId}`, href: `/projects/${projectId}` },
          { label: 'Datasets' },
        ]}
      />

      {datasets.length === 0 ? (
        <EmptyState
          title="No datasets yet"
          description="Datasets are created when processing jobs complete. Start by configuring and running a processing job."
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          }
          action={
            <button
              onClick={() => navigate(`/projects/${projectId}/configure`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Configure Processing
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                onClick={() => navigate(`/projects/${projectId}/datasets/${dataset.id}/export`)}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 truncate flex-1 mr-2">
                    {dataset.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                      FORMAT_STYLES[dataset.format] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {formatFormatLabel(dataset.format)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {dataset.recordCount.toLocaleString()} records
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Created {formatDate(dataset.createdAt)}
                  </div>

                  {dataset.updatedAt !== dataset.createdAt && (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Updated {formatDate(dataset.updatedAt)}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="text-sm text-blue-600 font-medium">
                    View &amp; Export
                    <svg className="inline-block ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </Layout>
  );
}
