'use client'

import { useTheme } from "next-themes";
import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Toaster } from '@/components/ui/sonner';
import { updatePassword, updateProfileImage, updateUserProfile, updateUserCapacity } from '../profile/actions';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { User } from "@prisma/client";
import { toast } from "sonner";

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save Changes'}</Button>;
}

function ProfileForm({ user }: { user: User }) {
    const [state, formAction] = useActionState(updateUserProfile, { success: false, message: "" });

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" defaultValue={user.name || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" defaultValue={user.email || ''} />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    )
}

function PasswordForm() {
    const [state, formAction] = useActionState(updatePassword, { success: false, message: "" });

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your account password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="oldPassword">Current Password</Label>
                        <Input id="oldPassword" name="oldPassword" type="password" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" name="newPassword" type="password" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input id="confirmNewPassword" name="confirmNewPassword" type="password" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    );
}

function ProfileImageForm({ user }: { user: User }) {
    const [state, formAction] = useActionState(updateProfileImage, { success: false, message: "" });
    const [previewImage, setPreviewImage] = useState<string | null>(user.image || null);

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
                if (state.imageUrl) { // Assuming updateProfileImage returns imageUrl on success
                    setPreviewImage(state.imageUrl);
                }
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewImage(user.image || null);
        }
    };

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Profile Image</CardTitle>
                    <CardDescription>Upload a new profile image.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden">
                            {previewImage ? (
                                <Image src={previewImage} alt="Profile Preview" layout="fill" objectFit="cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>
                            )}
                        </div>
                        <Input
                            id="profileImage"
                            name="profileImage"
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            className="w-full max-w-xs"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    );
}

function CapacityForm({ user }: { user: User }) {
    const [state, formAction] = useActionState(updateUserCapacity, { success: false, message: "" });

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Capacity</CardTitle>
                    <CardDescription>Set your daily work capacity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="dailyCapacityHours">Daily Capacity (hours)</Label>
                        <Input
                            id="dailyCapacityHours"
                            name="dailyCapacityHours"
                            type="number"
                            defaultValue={user.dailyCapacityHours?.toString() || '8'}
                            step="0.5"
                            min="0"
                            max="24"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    );
}

export function SettingsClientPage({ user }: { user: User }) {
  const { setTheme, theme } = useTheme();
  const [isDarkTheme, setIsDarkTheme] = useState(theme === 'dark');

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDarkTheme(checked);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Toaster />
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="profile-image">Profile Image</TabsTrigger>
                <TabsTrigger value="capacity">Capacity</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-4">
                <ProfileForm user={user} />
            </TabsContent>
            <TabsContent value="appearance" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the look and feel of the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="dark-mode">Dark Mode</Label>
                                <CardDescription>Enable or disable dark mode.</CardDescription>
                            </div>
                            <Switch id="dark-mode" checked={isDarkTheme} onCheckedChange={handleThemeChange} />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Manage how you receive notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-notifications">Email Notifications</Label>
                                <CardDescription>Receive notifications via email.</CardDescription>
                            </div>
                            <Switch id="email-notifications" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="push-notifications">Push Notifications</Label>
                                <CardDescription>Receive push notifications on your devices.</CardDescription>
                            </div>
                            <Switch id="push-notifications" />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
                <PasswordForm />
            </TabsContent>
            <TabsContent value="profile-image" className="space-y-4">
                <ProfileImageForm user={user} />
            </TabsContent>
            <TabsContent value="capacity" className="space-y-4">
                <CapacityForm user={user} />
            </TabsContent>
        </Tabs>
    </div>
  );
}