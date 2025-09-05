import { getUserProfile } from "../profile/actions";
import { SettingsClientPage } from "./client-page";

export default async function SettingsPage() {
    const user = await getUserProfile();

    if (!user) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">User not found</h2>
                <p>Could not find user profile to edit.</p>
            </div>
        )
    }

    return <SettingsClientPage user={user} />;
}
