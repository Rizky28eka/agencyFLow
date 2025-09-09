
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, PlusCircle } from "lucide-react";
import { Priority } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Task {
  title: string;
  description: string;
  priority: string;
  estimatedHours: number;
}

interface Template {
  id?: string;
  name: string;
  description: string;
  taskTemplates: Task[];
}

export function TemplateFormDialog({ open, onOpenChange, onFormSubmit, template }: { open: boolean, onOpenChange: (open: boolean) => void, onFormSubmit: () => void, template: Template | null }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setDescription(template.description || "");
      // If editing, we might need to fetch full task details if not already loaded
      setTasks(template.taskTemplates || []);
    } else {
      // Reset form for new template
      setName("");
      setDescription("");
      setTasks([]);
    }
  }, [template, open]);

  const handleTaskChange = (index: number, field: string, value: string | number) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleAddTask = () => {
    setTasks([...tasks, { title: "", description: "", priority: "MEDIUM", estimatedHours: 0 }]);
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const url = template ? `/api/project-templates/${template.id}` : "/api/project-templates";
    const method = template ? "PUT" : "POST";

    const payload = { name, description, tasks };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${template ? 'update' : 'create'} template`);
      }

      toast.success(`Template ${template ? 'updated' : 'created'} successfully.`);
      onFormSubmit();
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{template ? "Edit" : "Create"} Project Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Task Templates</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                {tasks.map((task, index) => (
                  <div key={index} className="p-3 border rounded-lg relative">
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleRemoveTask(index)}><X className="h-4 w-4" /></Button>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label>Title</Label>
                            <Input value={task.title} onChange={(e) => handleTaskChange(index, 'title', e.target.value)} required />
                        </div>
                        <div>
                            <Label>Priority</Label>
                            <Select value={task.priority} onValueChange={(value) => handleTaskChange(index, 'priority', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.values(Priority).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <Label>Description</Label>
                            <Textarea value={task.description} onChange={(e) => handleTaskChange(index, 'description', e.target.value)} />
                        </div>
                    </div>
                  </div>
                ))}
                 {tasks.length === 0 && <p className="text-center text-sm text-muted-foreground">No tasks yet. Add one below.</p>}
              </div>
               <Button type="button" variant="outline" className="mt-2" onClick={handleAddTask}><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button>
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
