
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateFileApprovalStatus } from '@/app/actions/files';
import { FileApprovalStatus } from '@prisma/client';

export function FileApprovalDialog({ file, action, open, onOpenChange, onSuccess }) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const newStatus = action === 'APPROVE' ? FileApprovalStatus.APPROVED : FileApprovalStatus.REVISION_NEEDED;
      await updateFileApprovalStatus(file.id, newStatus, feedback);
      toast.success(`File has been ${newStatus === 'APPROVED' ? 'approved' : 'marked for revision'}.`);
      onSuccess();
    } catch (error) {
      toast.error("Failed to update file status.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm File {action === 'APPROVE' ? 'Approval' : 'Revision Request'}</DialogTitle>
          <DialogDescription>
            You are about to {action === 'APPROVE' ? 'approve' : 'request revisions for'} the file: <strong>{file.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        {action === 'REVISE' && (
          <div className="py-4">
            <Label htmlFor="feedback">Feedback (Required)</Label>
            <Textarea 
              id="feedback"
              placeholder="Please provide clear feedback for the team..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (action === 'REVISE' && !feedback.trim())}
            variant={action === 'APPROVE' ? 'success' : 'destructive'}
          >
            {isSubmitting ? 'Submitting...' : `Confirm ${action === 'APPROVE' ? 'Approval' : 'Revision'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
