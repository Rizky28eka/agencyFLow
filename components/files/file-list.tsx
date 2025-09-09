
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { File, User } from '@prisma/client'; // Assuming types are available
import { useSession } from 'next-auth/react';
import { FileApprovalDialog } from './file-approval-dialog'; // This will be created next

interface FileWithUploader extends File {
  uploadedBy: User;
}

interface FileListProps {
  files: FileWithUploader[];
  onUpdate: () => void;
}

const getStatusVariant = (status) => {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'REVISION_NEEDED': return 'destructive';
    case 'PENDING': return 'secondary';
    default: return 'default';
  }
};

export function FileList({ files, onUpdate }: FileListProps) {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<FileWithUploader | null>(null);
  const [dialogAction, setDialogAction] = useState<'APPROVE' | 'REVISE' | null>(null);

  const openDialog = (file: FileWithUploader, action: 'APPROVE' | 'REVISE') => {
    setSelectedFile(file);
    setDialogAction(action);
  };

  const isClient = session?.user?.role === 'CLIENT';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Project Files</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium"><a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{file.name}</a></TableCell>
                  <TableCell><Badge variant={getStatusVariant(file.approvalStatus)}>{file.approvalStatus.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{file.uploadedBy.name}</TableCell>
                  <TableCell>{new Date(file.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {isClient && file.approvalStatus === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" onClick={() => openDialog(file, 'APPROVE')}>Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => openDialog(file, 'REVISE')}>Request Revision</Button>
                      </div>
                    )}
                    {!isClient && file.approvalStatus === 'REVISION_NEEDED' && (
                        <p className='text-sm text-destructive'>Client requested revisions.</p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {files.length === 0 && <p className="text-center text-muted-foreground p-4">No files uploaded yet.</p>}
        </CardContent>
      </Card>

      {selectedFile && dialogAction && (
        <FileApprovalDialog 
            file={selectedFile}
            action={dialogAction}
            open={!!selectedFile}
            onOpenChange={() => setSelectedFile(null)}
            onSuccess={() => {
                setSelectedFile(null);
                onUpdate();
            }}
        />
      )}
    </>
  );
}
