'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileApprovalStatus } from '@prisma/client';
import { updateFileApprovalStatus } from '@/app/actions/files';
import { useSession } from 'next-auth/react';

interface FileItem {
  id: string;
  name: string;
  url: string;
  approvalStatus: FileApprovalStatus;
  clientFeedback: string | null;
}

// This is a mock function to simulate fetching files for a project
// In a real application, this would be a server action or API call
async function fetchProjectFiles(id: string): Promise<FileItem[]> {
  void id; // Mark id as intentionally unused
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    {
      id: 'file1',
      name: 'Design Mockup v1.0.png',
      url: '/uploads/a0ef7383-b6d4-4368-853a-b7f9317558af.png',
      approvalStatus: FileApprovalStatus.PENDING,
      clientFeedback: null,
    },
    {
      id: 'file2',
      name: 'Contract Draft.pdf',
      url: '/uploads/23464d04-b128-41e5-bec9-4beebf6734fb.png',
      approvalStatus: FileApprovalStatus.APPROVED,
      clientFeedback: null,
    },
    {
      id: 'file3',
      name: 'Logo Concepts.zip',
      url: '/uploads/bf3b54f1-c26f-4b60-9d22-6235d0b90ce9.png',
      approvalStatus: FileApprovalStatus.REVISION_NEEDED,
      clientFeedback: 'Please make the logo more vibrant.',
    },
  ];
}

const FileApprovalList: React.FC<{ id: string }> = ({ id }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});
  const { data: session } = useSession();

  useEffect(() => {
    const getFiles = async () => {
      try {
        setLoading(true);
        const fetchedFiles = await fetchProjectFiles(id);
        setFiles(fetchedFiles);
      } catch (err) {
        setError('Failed to fetch files.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getFiles();
  }, [id]);

  const handleStatusChange = async (fileId: string, status: FileApprovalStatus) => {
    if (!session?.user) {
      alert('You must be logged in to perform this action.');
      return;
    }

    const feedback = feedbackInput[fileId] || '';

    try {
      // Call the server action
      await updateFileApprovalStatus(fileId, status, feedback);
      // Optimistically update the UI
      setFiles(prevFiles =>
        prevFiles.map(file =>
          file.id === fileId
            ? { ...file, approvalStatus: status, clientFeedback: feedback, approvedBy: session.user.id, approvedAt: new Date().toISOString() }
            : file
        )
      );
      setFeedbackInput(prev => { delete prev[fileId]; return { ...prev }; });
      alert(`File ${status.toLowerCase().replace('_', ' ')} successfully!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update file status.');
      console.error(err);
    }
  };

  if (loading) return <p>Loading files...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Project Files for Approval</h2>
      {files.length === 0 && <p>No files found for this project.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div key={file.id} className="border p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-lg">{file.name}</h3>
            <p className="text-sm text-gray-500">Status: <span className={`font-semibold ${file.approvalStatus === FileApprovalStatus.APPROVED ? 'text-green-600' : file.approvalStatus === FileApprovalStatus.REVISION_NEEDED ? 'text-red-600' : 'text-yellow-600'}`}>{file.approvalStatus.replace('_', ' ')}</span></p>
            {file.clientFeedback && (
              <p className="text-sm text-gray-700 mt-1">Feedback: {file.clientFeedback}</p>
            )}
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">View File</a>

            {session?.user?.role === 'CLIENT' && file.approvalStatus === FileApprovalStatus.PENDING && (
              <div className="mt-3 space-y-2">
                <textarea
                  className="w-full p-2 border rounded-md text-sm"
                  rows={2}
                  placeholder="Add feedback for revision (optional)"
                  value={feedbackInput[file.id] || ''}
                  onChange={(e) => setFeedbackInput({ ...feedbackInput, [file.id]: e.target.value })}
                />
                <button
                  onClick={() => handleStatusChange(file.id, FileApprovalStatus.APPROVED)}
                  className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange(file.id, FileApprovalStatus.REVISION_NEEDED)}
                  className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 text-sm"
                >
                  Request Revision
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ClientProjectDetailPage() {
  const params = useParams();
  const id = params.id as string; // Changed from projectId to id

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Project Details for {id}</h1> {/* Changed from projectId to id */}
      {/* Placeholder for other project details */}
      <p>Here you can see details about your project.</p>

      <div className="mt-8">
        <FileApprovalList id={id} /> {/* Changed projectId to id */}
      </div>
    </div>
  );
}
