
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Template {
  id: string;
  name: string;
  description: string;
  taskTemplates: {
    _count: number;
  };
}

// Mock data for now
const mockTemplates = [
  { id: '1', name: 'Web Development', description: 'Standard template for web projects', taskTemplates: { _count: 5 } },
  { id: '2', name: 'Marketing Campaign', description: 'Template for new marketing campaigns', taskTemplates: { _count: 8 } },
];

export default function ProjectTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Fetch templates from the API
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/project-templates");
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error("Failed to fetch project templates:", error);
        // For now, use mock data on error
        setTemplates(mockTemplates);
      }
      setIsLoading(false);
    };

    fetchTemplates();
  }, []);

  const handleCreateNew = () => {
    // The commented out lines below were part of the original code
    // setSelectedTemplate(null);
    // setIsFormOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Project Templates</h1>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        // <TemplateList templates={templates} onEdit={handleEdit} />
        // For now, just display the raw data
        <div className="bg-white p-4 rounded-lg shadow">
            <pre>{JSON.stringify(templates, null, 2)}</pre>
        </div>
      )}

      {/* 
      <TemplateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFormSubmit={handleFormClose}
        template={selectedTemplate}
      />
      */}
    </div>
  );
}
