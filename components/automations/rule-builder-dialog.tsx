
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { TriggerType, ActionType, TaskStatus } from "@prisma/client";

const triggerTypes = Object.values(TriggerType);
const actionTypes = Object.values(ActionType);
const taskStatuses = Object.values(TaskStatus);

export function RuleBuilderDialog({ open, onOpenChange, onSuccess, rule }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState(null);
  const [actions, setActions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (rule) {
      setName(rule.name || "");
      setDescription(rule.description || "");
      setTrigger(rule.trigger || null);
      setActions(rule.actions || []);
    } else {
      setName("");
      setDescription("");
      setTrigger({ type: TriggerType.TASK_STATUS_CHANGED, config: {} });
      setActions([]);
    }
  }, [rule, open]);

  const handleTriggerTypeChange = (type) => {
    setTrigger({ type, config: {} });
  };

  const handleTriggerConfigChange = (field, value) => {
    setTrigger({ ...trigger, config: { ...trigger.config, [field]: value } });
  };

  const handleAddAction = () => {
    setActions([...actions, { type: ActionType.CHANGE_TASK_STATUS, config: {} }]);
  };

  const handleRemoveAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionChange = (index, field, value) => {
    const newActions = [...actions];
    newActions[index][field] = value;
    // Reset config when type changes
    if (field === 'type') {
        newActions[index].config = {};
    }
    setActions(newActions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = { name, description, trigger, actions };
    const url = rule ? `/api/automation-rules/${rule.id}` : "/api/automation-rules";
    const method = rule ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save the rule.");
      }

      toast.success(`Rule ${rule ? 'updated' : 'created'} successfully.`);
      onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTriggerConfig = () => {
    if (!trigger) return null;

    switch (trigger.type) {
      case TriggerType.TASK_STATUS_CHANGED:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>From Status</Label>
              <Select onValueChange={(v) => handleTriggerConfigChange('fromStatus', v)} value={trigger.config.fromStatus}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>{taskStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Status</Label>
              <Select onValueChange={(v) => handleTriggerConfigChange('toStatus', v)} value={trigger.config.toStatus}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>{taskStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return <p className="text-sm text-gray-500">This trigger has no configuration.</p>;
    }
  };

  const renderActionConfig = (action, index) => {
    switch (action.type) {
      case ActionType.CHANGE_TASK_STATUS:
        return (
          <div>
            <Label>New Status</Label>
            <Select onValueChange={(v) => handleActionChange(index, 'config', { ...action.config, status: v })} value={action.config.status}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>{taskStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        );
      case ActionType.ASSIGN_USER:
        return (
            <div>
                <Label>Assign to</Label>
                {/* This is a simplified version. A real app would have a user selector component */}
                <Select onValueChange={(v) => handleActionChange(index, 'config', { ...action.config, assigneeId: v })} value={action.config.assigneeId}>
                    <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                        {/* Add actual users here */}
                    </SelectContent>
                </Select>
            </div>
        );
      case ActionType.SEND_SLACK_MESSAGE:
        return (
            <div>
                <Label>Slack Message</Label>
                <Textarea 
                    placeholder="e.g., Task {task.title} is now {task.status}"
                    value={action.config.message || ''}
                    onChange={(e) => handleActionChange(index, 'config', { ...action.config, message: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Use {`{task.title}`} or {`{task.status}`} for dynamic values.</p>
            </div>
        );
      default:
        return <p className="text-sm text-gray-500">This action has no configuration.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Rule" : "Create New Rule"}</DialogTitle>
          <DialogDescription>Define a trigger and one or more actions to automate your workflow.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input id="name" placeholder="e.g., 'Move task to review when done'" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* Trigger Section */}
          <div className="p-4 border rounded-md space-y-4">
            <h3 className="font-semibold">When... (Trigger)</h3>
            <Select onValueChange={handleTriggerTypeChange} value={trigger?.type}>
              <SelectTrigger><SelectValue placeholder="Select a trigger" /></SelectTrigger>
              <SelectContent>{triggerTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            {renderTriggerConfig()}
          </div>

          {/* Actions Section */}
          <div className="p-4 border rounded-md space-y-4">
            <h3 className="font-semibold">Do this... (Actions)</h3>
            {actions.map((action, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-3 relative">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleRemoveAction(index)}><X className="h-4 w-4" /></Button>
                <Select onValueChange={(v) => handleActionChange(index, 'type', v)} value={action.type}>
                  <SelectTrigger><SelectValue placeholder="Select an action" /></SelectTrigger>
                  <SelectContent>{actionTypes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
                {renderActionConfig(action, index)}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddAction}><Plus className="mr-2 h-4 w-4" /> Add Action</Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Rule"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
