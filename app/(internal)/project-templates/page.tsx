"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TemplateList } from "@/components/project-templates/template-list";
import { TemplateFormDialog } from "@/components/project-templates/template-form-dialog";
import { PlusCircle } from "lucide-react";

export default function ProjectTemplatesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleTemplateCreated = () => {
    // Logic to refresh the list or show a success message
    setIsFormOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Project Templates</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Template
        </Button>
      </div>

      <div className="flex-1">
        <TemplateList />
      </div>

      <TemplateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onTemplateCreated={handleTemplateCreated}
      />
    </div>
  );
}
