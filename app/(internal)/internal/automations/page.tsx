
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RuleBuilderDialog } from "@/components/automations/rule-builder-dialog";

interface Rule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
  };
  actions: Action[];
}

interface Action {
  id: string;
  type: string;
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/automation-rules");
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Failed to fetch automation rules:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateNew = () => {
    setSelectedRule(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (rule: Rule) => {
    setSelectedRule(rule);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    fetchRules(); // Refetch rules after closing the dialog
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Workflow Automations</h1>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {rules.length > 0 ? (
            rules.map((rule) => (
              <div key={rule.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg">{rule.name}</h2>
                  <p className="text-sm text-gray-500">{rule.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-semibold">Trigger:</span>
                    <span className="px-2 py-1 bg-gray-200 rounded-md text-xs">{rule.trigger.type}</span>
                    <span>-&gt;</span>
                    {rule.actions.map((action: Action) => (
                        <span key={action.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">{action.type}</span>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>Edit</Button>
              </div>
            ))
          ) : (
            <p>No automation rules created yet.</p>
          )}
        </div>
      )}

      <RuleBuilderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleDialogClose}
        rule={selectedRule}
      />
    </div>
  );
}
