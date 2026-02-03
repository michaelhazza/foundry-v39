import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api';
import Layout from '../../components/Layout';
import type { Organization } from '../../types';

export default function OrganizationSettingsPage() {
  const { user } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await apiClient.get('/organizations/current');
        const org: Organization = response.data.data;
        setOrganization(org);
        setName(org.name);
      } catch (err: any) {
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to load organization settings.';
        setLoadError(message);
      } finally {
        setIsLoadingOrg(false);
      }
    };

    fetchOrganization();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await apiClient.put('/organizations/current', { name });
      const updatedOrg: Organization = response.data.data;
      setOrganization(updatedOrg);
      setName(updatedOrg.name);
      setSuccess('Organization settings saved successfully.');
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to save organization settings.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const tierLabels: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };

  const tierColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700',
  };

  if (isLoadingOrg) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (loadError) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{loadError}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your organization&apos;s name and view subscription details.
        </p>

        {error && (
          <div className="mt-6 rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-md bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Subscription Tier */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
          <div className="mt-4 flex items-center space-x-3">
            <span className="text-sm text-gray-600">Current plan:</span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium ${
                tierColors[organization?.subscriptionTier || 'free'] || tierColors.free
              }`}
            >
              {tierLabels[organization?.subscriptionTier || 'free'] || 'Free'}
            </span>
          </div>
        </div>

        {/* Organization Name */}
        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">General</h2>
          <div className="mt-4">
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
              Organization name
            </label>
            <input
              id="orgName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSaving || name === organization?.name}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>

        {/* Organization Info */}
        {organization && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Details</h2>
            <dl className="mt-4 space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Organization ID</dt>
                <dd className="text-sm font-medium text-gray-900">{organization.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </Layout>
  );
}
