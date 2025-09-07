'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Fetch projects for a specific client
 */
export async function getClientProjects() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clientId || !session?.user?.organizationId) {
    throw new Error('Unauthorized or client ID not found.');
  }
  try {
    const projects = await prisma.project.findMany({
      where: { clientId: session.user.clientId, organizationId: session.user.organizationId },
    });
    return projects || [];
  } catch (error) {
    console.error("Failed to fetch client projects:", error);
    throw new Error("Failed to fetch client projects.");
  }
}

/**
 * Fetch invoices for a specific client
 */
export async function getClientInvoices() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clientId || !session?.user?.organizationId) {
    throw new Error('Unauthorized or client ID not found.');
  }
  try {
    const invoices = await prisma.invoice.findMany({
      where: { clientId: session.user.clientId, organizationId: session.user.organizationId },
    });
    return invoices || [];
  } catch (error) {
    console.error("Failed to fetch client invoices:", error);
    throw new Error("Failed to fetch client invoices.");
  }
}

/**
 * Fetch outstanding invoices for a specific client
 */
export async function getOutstandingClientInvoices() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clientId || !session?.user?.organizationId) {
    throw new Error('Unauthorized or client ID not found.');
  }
  try {
    const outstandingInvoices = await prisma.invoice.findMany({
      where: {
        clientId: session.user.clientId,
        organizationId: session.user.organizationId,
        status: { in: ["DRAFT", "SENT", "OVERDUE", "PROCESSING"] }, // Assuming these are outstanding statuses
      },
    });
    return outstandingInvoices || [];
  } catch (error) {
    console.error("Failed to fetch outstanding client invoices:", error);
    throw new Error("Failed to fetch outstanding client invoices.");
  }
}

/**
 * Fetch quotations for a specific client
 */
export async function getClientQuotations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clientId || !session?.user?.organizationId) {
    throw new Error('Unauthorized or client ID not found.');
  }
  try {
    const quotations = await prisma.quotation.findMany({
      where: { clientId: session.user.clientId, organizationId: session.user.organizationId },
    });
    return quotations || [];
  } catch (error) {
    console.error("Failed to fetch client quotations:", error);
    throw new Error("Failed to fetch client quotations.");
  }
}

/**
 * Fetch all dashboard data for a specific client
 */
export async function getClientDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clientId || !session?.user?.organizationId) {
    throw new Error('Unauthorized or client ID not found.');
  }

  try {
    const projects = await getClientProjects();
    const invoices = await getClientInvoices();
    const outstandingInvoices = await getOutstandingClientInvoices();
    const quotations = await getClientQuotations();

    return {
      projects,
      invoices,
      outstandingInvoices,
      quotations,
    };
  } catch (error) {
    console.error("Failed to fetch client dashboard data:", error);
    throw new Error("Failed to fetch client dashboard data.");
  }
}
