import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import apiClient from '../../lib/api';
import { DataSource, ApiResponse } from '../../types';

const API_TYPES = [
  { value: 'teamwork_desk_api', label: 'Teamwork Desk API' },
] as const;

export default function ConnectAPIPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [apiType, setApiType] = useState<string>('teamwork_desk_api');
  const [apiKey, setApiKey] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post<ApiResponse<DataSource>>(
        `/projects/${projectId}/data-sources`,
        {
          name,
          type: apiType,
          connectionConfig: {
            apiKey,
            subdomain,
          },
        }
      );
      navigate(`/projects/${projectId}/data-sources/${response.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to connect API.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/projects/${projectId}`} className="text-sm text-blue-600 hover:text-blue-700">
            &larr; Back to Project
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Connect API</h1>
          <p className="mt-1 text-sm text-gray-500">Connect an external API as a data source</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Data Source Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Teamwork Desk - Support Tickets"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="apiType" className="block text-sm font-medium text-gray-700">
              API Type <span className="text-red-500">*</span>
            </label>
            <select
              id="apiType"
              value={apiType}
              onChange={(e) => setApiType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              {API_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Connection Configuration</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                  Subdomain <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex rounded-lg shadow-sm">
                  <input
                    id="subdomain"
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="yourcompany"
                    className="block w-full px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-lg">
                    .teamwork.com
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  id="apiKey"
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your API key is encrypted and stored securely.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Link
              to={`/projects/${projectId}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Connecting...' : 'Connect API'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
