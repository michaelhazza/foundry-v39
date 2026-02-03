import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import apiClient from '../../lib/api';
import { Project, ApiResponse } from '../../types';

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
        setProject(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load project.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProject();
  }, [id]);

  const handleDelete = async () => {
    if (!project || deleteConfirmText !== project.name) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete project.');
      setDeleting(false);
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

  if (error && !project) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/projects/${id}`} className="text-sm text-blue-600 hover:text-blue-700">
            &larr; Back to Project
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Project Settings</h1>
          {project && (
            <p className="mt-1 text-sm text-gray-500">{project.name}</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-white rounded-lg border-2 border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          <p className="mt-2 text-sm text-gray-600">
            Deleting a project is permanent and cannot be undone. All data sources, processing jobs, and datasets associated with this project will be permanently removed.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
            >
              Delete this project
            </button>
          ) : (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                To confirm, type the project name: <span className="font-bold">{project?.name}</span>
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type project name to confirm"
                className="mt-2 block w-full px-3 py-2 border border-red-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 text-sm"
              />
              <div className="mt-3 flex items-center space-x-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting || deleteConfirmText !== project?.name}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete Project'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
