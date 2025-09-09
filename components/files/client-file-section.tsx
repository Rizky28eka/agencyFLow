
"use client";

import { useState } from 'react';
import { FileList } from './file-list';

export function ClientFileSection({ initialFiles }) {
    const [files] = useState(initialFiles);

    // This component exists to allow for future client-side updates 
    // without refetching the whole page, for example, after uploading a new file.
    // For now, it just manages the state for the FileList.

    const handleUpdate = () => {
        // In a real app, you might re-fetch the file list here
        // For now, we assume the parent will handle re-fetching if necessary
        console.log("File list updated");
    };

    return <FileList files={files} onUpdate={handleUpdate} />;
}
