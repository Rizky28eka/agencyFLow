'use client'

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { registerUser } from "../app/register/actions";
import { cn } from '@/lib/utils';

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Registering...' : 'Create an account'}</Button>;
}

export function RegisterForm({
    className,
    ...props
  }: React.ComponentProps<"form">) {
    const router = useRouter();
    const [state, formAction] = useActionState(registerUser, { success: false, message: "" });

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
                setTimeout(() => router.push('/login'), 2000);
            } else {
                toast.error(state.message);
            }
        }
    }, [state, router]);

    return (
        <form action={formAction} className={cn("flex flex-col gap-6", className)} {...props}>
            <Toaster />
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                    Enter your information to create an account
                </p>
            </div>
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                </div>
                <SubmitButton />
            </div>
            <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                    Sign in
                </Link>
            </div>
        </form>
    );
}
