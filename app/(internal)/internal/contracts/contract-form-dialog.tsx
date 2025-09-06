'use client'

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActionState } from "react";
import { createContract, ContractWithRelations } from "./actions";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getClientsForSelection } from "../clients/actions";
import { getProjectsForSelection } from "../projects/actions";

interface SelectItem {
    id: string;
    name: string;
}

interface ContractFormDialogProps {
    trigger: React.ReactNode;
    onContractCreated?: (newContract: ContractWithRelations) => void;
}

const initialState: { success: boolean; message: string; data?: ContractWithRelations | null } = { success: false, message: "", data: null };

export function ContractFormDialog({ trigger, onContractCreated }: ContractFormDialogProps) {
    const [state, formAction] = useActionState(createContract, initialState);
    const [isOpen, setIsOpen] = useState(false);
    const [clients, setClients] = useState<SelectItem[]>([]);
    const [projects, setProjects] = useState<SelectItem[]>([]);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            toast.success(state.message);
            if (state.data && onContractCreated) {
                onContractCreated(state.data as ContractWithRelations);
            }
            setIsOpen(false);
            formRef.current?.reset();
        } else if (state.message) {
            toast.error(state.message);
        }
    }, [state, onContractCreated]);

    useEffect(() => {
        if (isOpen) {
            getClientsForSelection().then(setClients);
            getProjectsForSelection().then(setProjects);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Contract</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new contract. All fields are required.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} ref={formRef} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Title</Label>
                        <Input id="title" name="title" className="col-span-3" required />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="clientId" className="text-right">Client</Label>
                        <Select name="clientId" required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="projectId" className="text-right">Project</Label>
                        <Select name="projectId">
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="(Optional) Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(project => (
                                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Amount</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startDate" className="text-right">Start Date</Label>
                        <Input id="startDate" name="startDate" type="date" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endDate" className="text-right">End Date</Label>
                        <Input id="endDate" name="endDate" type="date" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="file" className="text-right">Contract File</Label>
                        <Input id="file" name="file" type="file" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Create Contract</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
