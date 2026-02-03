import React, { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white font-bold text-xl mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Foundry</h1>
          <p className="mt-1 text-sm text-gray-500">Data processing platform</p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-md rounded-lg px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
