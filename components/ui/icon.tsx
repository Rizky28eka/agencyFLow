'use client'

import {
    IconChartBar,
    IconDashboard,
    IconFileDescription,
    IconFolder,
    IconHelp,
    IconReceipt,
    IconSettings,
    IconUsers,
    IconDatabase,
    IconReport,
    IconFileWord,
    IconCreditCard,
    type Icon as TablerIcon
} from "@tabler/icons-react";

export const iconMap: Record<string, TablerIcon> = {
    'dashboard': IconDashboard,
    'projects': IconFolder,
    'invoices': IconReceipt,
    'contracts': IconFileDescription,
    'expenses': IconCreditCard,
    'clients': IconUsers,
    'analytics': IconChartBar,
    'users': IconUsers,
    'resource-management': IconUsers,
    'settings': IconSettings,
    'support': IconHelp,
    'data-library': IconDatabase,
    'reports': IconReport,
    'word-assistant': IconFileWord,
};

interface IconProps {
    name: string;
    className?: string;
}

export function Icon({ name, className }: IconProps) {
    const IconComponent = iconMap[name];

    if (!IconComponent) {
        // Return a default icon or null if the name is not found
        return null;
    }

    return <IconComponent className={className} />;
}
