'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CommentEntityType } from '@prisma/client'; // Assuming this import path is correct after build
import { useSession } from 'next-auth/react'; // Assuming next-auth/react is used for session
import Image from 'next/image'; // Import next/image
import { addComment, getComments } from '@/app/actions/comments'; // Import server actions
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { v4 as uuidv4 } from 'uuid'; // Import uuid for temporary IDs

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

    const tempId = uuidv4(); // Generate a temporary ID
    const newComment: Comment = {
      id: tempId,
      content: newCommentContent,
      createdAt: new Date(), // Use current date for optimistic update
      author: {
        id: session.user.id as string,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      },
    };

    // Optimistically add the new comment to the UI
    setComments((prevComments) => [...prevComments, newComment]);
    setNewCommentContent(''); // Clear input immediately

    try {
      const addedComment = await addComment(entityType, entityId, newCommentContent);

      // Replace the temporary comment with the actual comment from the server
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === tempId ? { ...addedComment, author: newComment.author } : comment
        )
      );
    } catch (err: unknown) {
      // If the server action fails, remove the optimistically added comment
      setComments((prevComments) => prevComments.filter((comment) => comment.id !== tempId));
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[230px]" />
        </div>
      )}
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