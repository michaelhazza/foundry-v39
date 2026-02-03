import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import apiClient from '../../lib/api';
import { Project, DataSource, ProcessingJob, Dataset, ApiResponse, PaginatedResponse } from '../../types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectRes, dsRes, jobsRes, datasetsRes] = await Promise.all([
          apiClient.get<ApiResponse<Project>>(`/projects/${id}`),
          apiClient.get<PaginatedResponse<DataSource>>(`/projects/${id}/data-sources`, { params: { limit: 50 } }),
          apiClient.get<PaginatedResponse<ProcessingJob>>(`/projects/${id}/jobs`, { params: { limit: 5 } }),
          apiClient.get<PaginatedResponse<Dataset>>(`/projects/${id}/datasets`, { params: { limit: 5 } }),
        ]);
        setProject(projectRes.data.data);
        setDataSources(dsRes.data.data);
        setJobs(jobsRes.data.data);
        setDatasets(datasetsRes.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load project.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (error || !project) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Project not found.'}
          </div>
          <Link to="/projects" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700">
            &larr; Back to Projects
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700">
            &larr; Back to Projects
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-gray-500">{project.description}</p>
            )}
            <p className="mt-2 text-xs text-gray-400">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to={`/projects/${id}/edit`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Edit
            </Link>
            <Link
              to={`/projects/${id}/settings`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            to={`/projects/${id}/upload`}
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-sm font-medium text-gray-700"
          >
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Data
          </Link>
          <Link
            to={`/projects/${id}/connect-api`}
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-sm font-medium text-gray-700"
          >
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect API
          </Link>
          <Link
            to={`/projects/${id}/configure`}
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-sm font-medium text-gray-700"
          >
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configure Processing
          </Link>
        </div>

        {/* Data Sources Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Data Sources</h2>
            <span className="text-sm text-gray-500">{dataSources.length} source{dataSources.length !== 1 ? 's' : ''}</span>
          </div>
          {dataSources.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
              No data sources yet. Upload a file or connect an API to get started.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {dataSources.map((ds) => (
                <Link
                  key={ds.id}
                  to={`/projects/${id}/data-sources/${ds.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ds.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {ds.type === 'file_upload' ? 'File Upload' : 'API Connection'}
                        {ds.recordCount !== null && ` \u00b7 ${ds.recordCount.toLocaleString()} records`}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(ds.status)}`}>
                      {ds.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
            <Link to={`/projects/${id}/jobs`} className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
              No processing jobs yet.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/projects/${id}/jobs/${job.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{job.type} Job</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {job.processedRecords} processed, {job.failedRecords} failed
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Datasets Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Datasets</h2>
            <Link to={`/projects/${id}/datasets`} className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {datasets.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
              No datasets yet. Process your data to generate datasets.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {datasets.map((ds) => (
                <div key={ds.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ds.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ds.format.toUpperCase()} &middot; {ds.recordCount.toLocaleString()} records
                    </p>
                  </div>
                  <Link
                    to={`/projects/${id}/datasets/${ds.id}/export`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Export
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
