'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestFileApproval, updateFileApprovalStatus } from '@/app/actions/files';
import { FileApprovalStatus } from '@prisma/client';

interface FileApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  projectId: string;
  currentStatus: FileApprovalStatus;
  onStatusChange: () => void;
}

export function FileApprovalDialog({
  isOpen,
  onClose,
  fileId,
  projectId,
  currentStatus,
  onStatusChange,
}: FileApprovalDialogProps) {
  const [clientFeedback, setClientFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestApproval = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await requestFileApproval(fileId, projectId);
      onStatusChange();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request approval');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateFileApprovalStatus(fileId, FileApprovalStatus.APPROVED, clientFeedback);
      onStatusChange();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateFileApprovalStatus(fileId, FileApprovalStatus.REVISION_NEEDED, clientFeedback);
      onStatusChange();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request revision');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File Approval Workflow</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>Current Status: {currentStatus}</p>
          {currentStatus === FileApprovalStatus.PENDING && (
            <div className="space-y-2">
              <Label htmlFor="feedback">Client Feedback (Optional)</Label>
              <Input
                id="feedback"
                value={clientFeedback}
                onChange={(e) => setClientFeedback(e.target.value)}
                placeholder="Add feedback for revision..."
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          {currentStatus === FileApprovalStatus.PENDING ? (
            <>
              <Button onClick={handleApprove} disabled={isLoading}>
                {isLoading ? 'Approving...' : 'Approve'}
              </Button>
              <Button onClick={handleRequestRevision} disabled={isLoading} variant="outline">
                {isLoading ? 'Requesting...' : 'Request Revision'}
              </Button>
            </>
          ) : (
            <Button onClick={handleRequestApproval} disabled={isLoading}>
              {isLoading ? 'Requesting...' : 'Request Approval'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}