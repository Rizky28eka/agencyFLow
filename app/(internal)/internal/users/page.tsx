import { getUsersByOrganization, getRoles } from "./actions";
import { UserTable } from "./user-table";

export default async function UsersPage() {
  const users = await getUsersByOrganization();
  const roles = await getRoles();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>
      <UserTable initialUsers={users} roles={roles} />
    </div>
  );
}