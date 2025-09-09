
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";
import { GripVertical } from "lucide-react";

export function DashboardCustomizationDialog({
  open,
  onOpenChange,
  onSave,
  currentLayout,
  availableSections,
}) {
  const [localLayout, setLocalLayout] = useState(currentLayout);
  const [sectionVisibility, setSectionVisibility] = useState(() => {
    const visibility = {};
    availableSections.forEach(section => {
      visibility[section.id] = currentLayout.includes(section.id);
    });
    return visibility;
  });

  useEffect(() => {
    setLocalLayout(currentLayout);
    const visibility = {};
    availableSections.forEach(section => {
      visibility[section.id] = currentLayout.includes(section.id);
    });
    setSectionVisibility(visibility);
  }, [currentLayout, availableSections, open]);

  const handleToggleVisibility = (sectionId) => {
    setSectionVisibility(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleMove = (fromIndex, toIndex) => {
    const newLayout = [...localLayout];
    const [movedItem] = newLayout.splice(fromIndex, 1);
    newLayout.splice(toIndex, 0, movedItem);
    setLocalLayout(newLayout);
  };

  const handleSave = async () => {
    const finalLayout = availableSections
      .filter(section => sectionVisibility[section.id])
      .map(section => section.id)
      .filter(id => localLayout.includes(id)); // Maintain order of visible items

    // Add any new sections that were not in the original layout but are now visible
    availableSections.forEach(section => {
        if (sectionVisibility[section.id] && !finalLayout.includes(section.id)) {
            finalLayout.push(section.id);
        }
    });

    try {
      const response = await fetch("/api/dashboard-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: finalLayout }),
      });

      if (!response.ok) {
        throw new Error("Failed to save dashboard layout.");
      }

      const savedLayout = await response.json();
      onSave(savedLayout.layout); // Pass the saved layout back to parent
      toast.success("Dashboard layout saved successfully!");
    } catch (error) {
      toast.error(error.message || "An error occurred while saving layout.");
      console.error(error);
    }
  };

  // Filter and sort sections for display in the dialog
  const orderedVisibleSections = localLayout
    .filter(id => sectionVisibility[id])
    .map(id => availableSections.find(s => s.id === id))
    .filter(Boolean); // Remove any undefined if an ID is not found

  const otherSections = availableSections.filter(section => !sectionVisibility[section.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>Drag and drop to reorder, toggle to show/hide sections.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <h3 className="text-md font-semibold">Visible Sections</h3>
          <div className="space-y-2">
            {orderedVisibleSections.length === 0 && <p className="text-muted-foreground text-sm">No sections visible. Toggle some on below.</p>}
            {orderedVisibleSections.map((section, index) => (
              <div key={section.id} className="flex items-center justify-between border p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span>{section.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleMove(index, index - 1)} disabled={index === 0}>Up</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleMove(index, index + 1)} disabled={index === orderedVisibleSections.length - 1}>Down</Button>
                  <Switch
                    checked={sectionVisibility[section.id]}
                    onCheckedChange={() => handleToggleVisibility(section.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {otherSections.length > 0 && (
            <>
              <h3 className="text-md font-semibold mt-4">Hidden Sections</h3>
              <div className="space-y-2">
                {otherSections.map(section => (
                  <div key={section.id} className="flex items-center justify-between border p-2 rounded-md opacity-70">
                    <span>{section.title}</span>
                    <Switch
                      checked={sectionVisibility[section.id]}
                      onCheckedChange={() => handleToggleVisibility(section.id)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Layout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
