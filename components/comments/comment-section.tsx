'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CommentEntityType } from '@prisma/client'; // Assuming this import path is correct after build
import { useSession } from 'next-auth/react'; // Assuming next-auth/react is used for session
import Image from 'next/image'; // Import next/image
import { addComment, getComments } from '@/app/actions/comments'; // Import server actions

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface CommentSectionProps {
  entityId: string;
  entityType: CommentEntityType;
}

const CommentSection: React.FC<CommentSectionProps> = ({ entityId, entityType }) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Replace API call with server action
      const data = await getComments(entityType, entityId);
      setComments(data as Comment[]); // Cast to Comment[]
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !session?.user) {
      return;
    }

    try {
      // Replace API call with server action
      const addedComment = await addComment(entityType, entityId, newCommentContent);

      // Optimistically update UI or refetch comments
      setComments((prevComments) => [...prevComments, {
        ...addedComment,
        author: {
          id: session.user.id as string,
          name: session.user.name ?? null,
          image: session.user.image ?? null,
        }
      }]);
      setNewCommentContent('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      {isLoading && <p>Loading comments...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-3 max-h-60 overflow-y-auto p-2 border rounded-md">
        {comments.length === 0 && !isLoading && <p className="text-gray-500">No comments yet.</p>}
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-3 rounded-md shadow-sm">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {comment.author.image && (
                <Image
                  src={comment.author.image}
                  alt={comment.author.name || 'User'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="font-medium">{comment.author.name || 'Unknown User'}</span>
              <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-gray-800">{comment.content}</p>
          </div>
        ))}
      </div>
      {session?.user && (
        <form onSubmit={handleAddComment} className="flex space-x-2">
          <textarea
            className="flex-1 p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Add a comment..."
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Post
          </button>
        </form>
      )}
      {!session?.user && (
        <p className="text-sm text-gray-500">Please log in to add comments.</p>
      )}
    </div>
  );
};

export default CommentSection;