'use client';

import { useParams } from 'next/navigation';
import { CommentEntityType } from '@/types/db-models';
import CommentSection from '@/components/comments/comment-section';
import { ClientTaskView } from '@/components/client-dashboard/ClientTaskView';

export default function ClientProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Project Details</h1>
        <p className="text-muted-foreground">Here you can see the latest progress on your project tasks.</p>
      </div>

      {/* Client-facing Task View */}
      <ClientTaskView projectId={id} />

      {/* Project-level comments remain for communication */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Project-Level Comments</h2>
        <CommentSection entityType={CommentEntityType.PROJECT} entityId={id} />
      </div>
    </div>
  );
}