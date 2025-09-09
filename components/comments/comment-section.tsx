
'use client';

import { useState, useCallback, useEffect } from 'react';
import { MentionsInput, Mention, OnChangeHandlerFunc } from 'react-mentions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { createComment, getCommentsByEntity, CommentWithAuthorAndMentions } from '@/app/actions/comments';
import { User } from '@prisma/client';
import { useSession } from 'next-auth/react';

interface CommentSectionProps {
  entityType: 'TASK' | 'PROJECT' | 'INVOICE' | 'CLIENT' | 'FILE';
  entityId: string;
}

interface UserMention {
  id: string;
  display: string;
}

export function CommentSection({ entityType, entityId }: CommentSectionProps) {
  useSession();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentWithAuthorAndMentions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedComments = await getCommentsByEntity(entityType, entityId);
      setComments(fetchedComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  const fetchUsers = useCallback(async (query: string, callback: (users: UserMention[]) => void) => {
    try {
      const response = await fetch(`/api/users?query=${query}`);
      const data: User[] = await response.json();
      const userMentions = data.map(user => ({
        id: user.id,
        display: user.name || user.email,
      }));
      callback(userMentions);
    } catch (err) {
      console.error('Error fetching users for mentions:', err);
      callback([]);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleChange: OnChangeHandlerFunc = (event, newValue, newPlainTextValue) => {
    setCommentText(newPlainTextValue);
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      const newComment = await createComment(entityType, entityId, commentText);
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <MentionsInput
            value={commentText}
            onChange={handleChange}
            placeholder="Leave a comment... @mention someone"
            className="mentions-input"
            a11ySuggestionsListLabel="Suggested mentions"
          >
            <Mention
              trigger="@"
              data={fetchUsers}
              renderSuggestion={(suggestion, search, highlightedDisplay) => (
                <div className="mention-suggestion">{highlightedDisplay}</div>
              )}
              className="mentions-mention"
            />
          </MentionsInput>
          <Button onClick={handleSubmit} className="mt-2">Add Comment</Button>
        </div>

        {isLoading ? (
          <p>Loading comments...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Avatar>
                  <AvatarImage src={comment.author.image || '/placeholder-avatar.png'} />
                  <AvatarFallback>{comment.author.name?.charAt(0) || comment.author.email.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{comment.author.name || comment.author.email}</span>
                    <span className="text-sm text-gray-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: comment.content }}></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
