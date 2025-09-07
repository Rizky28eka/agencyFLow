'use client';

import { useParams } from 'next/navigation';
import { requestFileApproval } from '@/app/actions/files';
import { useState } from 'react';

export default function InternalProjectDetailPage() {
  const params = useParams();
  const id = params.id as string; // Changed from projectId to id
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestApproval = async (fileId: string) => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      // In a real app, you'd select a specific file to request approval for.
      // For demonstration, we'll use a dummy fileId.
      // You would likely have a list of files on this page and a button next to each.
      await requestFileApproval(fileId);
      setMessage(`Approval requested for file ${fileId}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request approval.&apos;');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Internal Project Details for {id}</h1> {/* Changed from projectId to id */}
      <p>This is where team members manage project details and files.</p>

      <div className="mt-8 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-3">File Approval Request (Team Side)</h2>
        <p className="mb-4">Simulate requesting approval for a file. In a real scenario, you&apos;d select a file from a list.</p>
        <button
          onClick={() => handleRequestApproval('dummy-file-id-123')} // Replace with actual file ID
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          
          {loading ? <>Requesting&apos;...</> : <>Request Approval for a File</>}
        </button>
        {message && <p className="text-green-600 mt-2">{message}</p>}
        {error && <p className="text-red-500 mt-2">Error: {error}</p>}
      </div>

      {/* Placeholder for other internal project details */}
    </div>
  );
}
