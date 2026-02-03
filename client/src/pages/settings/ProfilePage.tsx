import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api';
import Layout from '../../components/Layout';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      await apiClient.put('/users/me', { name });
      await refreshUser();
      setProfileSuccess('Profile updated successfully.');
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to update profile.';
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await apiClient.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to change password. Please check your current password.';
      setPasswordError(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your personal information and security settings.
        </p>

        {/* Profile Section */}
        <form onSubmit={handleProfileSubmit} className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>

          {profileError && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{profileError}</p>
            </div>
          )}

          {profileSuccess && (
            <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-700">{profileSuccess}</p>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                readOnly
                value={user?.email || ''}
                className="mt-1 block w-full max-w-md rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500 sm:text-sm cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">
                Email address cannot be changed.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSavingProfile || name === user?.name}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>

        {/* Password Section */}
        <form onSubmit={handlePasswordSubmit} className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>

          {passwordError && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{passwordError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-700">{passwordSuccess}</p>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="mt-1 block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Repeat your new password"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmNewPassword}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingPassword ? 'Changing...' : 'Change password'}
            </button>
          </div>
        </form>

        {/* Account Info */}
        {user && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
            <dl className="mt-4 space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Role</dt>
                <dd className="text-sm font-medium text-gray-900 capitalize">{user.role}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Email verified</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {user.emailVerified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-yellow-600">Not verified</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </Layout>
  );
}
