export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  PROCESSING = 'PROCESSING',
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: number; // Assuming it's converted to number for client-side
  issueDate: string; // Assuming it's passed as string
  dueDate: string; // Assuming it's passed as string
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ON_GOING = 'ON_GOING',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Project {
  id: string;
  status: ProjectStatus;
  name: string; // Added as it's used in ClientProjectsSection
}

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Quotation {
  id: string;
  status: QuotationStatus;
  quotationNumber: string; // Added as it's used in ClientQuotationsSection
}

export enum FileApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REVISION_NEEDED = 'REVISION_NEEDED',
}

export enum CommentEntityType {
  TASK = 'TASK',
  PROJECT = 'PROJECT',
  INVOICE = 'INVOICE',
  CLIENT = 'CLIENT',
  FILE = 'FILE',
}

export interface Client {
  id: string;
  name: string;
  email: string;
}

export enum Currency {
  IDR = 'IDR',
  USD = 'USD',
}