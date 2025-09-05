import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserProfile } from "./actions";

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Profile not found</h2>
            <p>Could not find user profile.</p>
        </div>
    )
  }

  // Mock data that is not in the DB yet
  const mockData = {
    avatarUrl: "https://github.com/shadcn.png", // Example avatar
    bio: "Experienced Project Manager with a passion for building amazing web applications and leading high-performing teams.",
    skills: ["Next.js", "React", "TypeScript", "Project Management", "Agile"],
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
            <Link href="/settings">
                <Button>Edit Profile</Button>
            </Link>
        </div>
        <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={mockData.avatarUrl} alt={`@${user.name}`} />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="text-muted-foreground font-medium">{user.role.name.replace("_", " ")}</p>
            </CardHeader>
            <CardContent className="mt-4">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">About Me</h3>
                        <p className="text-muted-foreground">
                            {mockData.bio}
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {mockData.skills.map(skill => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
