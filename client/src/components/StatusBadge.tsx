import React from 'react';

type StatusType = 'pending' | 'processing' | 'running' | 'completed' | 'failed' | 'active' | 'inactive' | 'draft' | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-100 text-gray-800',
  draft: 'bg-gray-100 text-gray-800',
};

const defaultStyle = 'bg-gray-100 text-gray-800';

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || defaultStyle;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style} ${className}`}
    >
      {status}
    </span>
  );
}
