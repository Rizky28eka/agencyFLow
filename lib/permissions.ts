import { User } from "@prisma/client";

// We can expand this type as needed, but for now, we only need the role.
// This ensures we don't accidentally depend on the full session object.
	type PermissionUser = Pick<User, 'roleId'> & { role?: { name: string } | null };

// A simple role check for admin
export function isAdmin(user: PermissionUser): boolean {
    return user.role?.name === 'ADMIN';
}

// Check for roles that can manage projects, clients, etc.
export function isManager(user: PermissionUser): boolean {
    return user.role?.name === 'ADMIN' || user.role?.name === 'PROJECT_MANAGER';
}

// Specific permission checks

export function canManageUsers(user: PermissionUser): boolean {
    return isAdmin(user);
}

export function canViewResources(user: PermissionUser): boolean {
    return isManager(user);
}

export function canManageContracts(user: PermissionUser): boolean {
    return isManager(user);
}

export function canManageClients(user: PermissionUser): boolean {
    return isManager(user);
}

// Add more granular permissions as the application grows
// For example:
// export function canDeleteProject(user: PermissionUser): boolean {
//     return isAdmin(user);
// }
