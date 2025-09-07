import { getClientInvoices } from "@/app/actions/client-data";
import BillingClientPage from "./billing-client-page";

export default async function ClientBillingPage() {
  const invoices = await getClientInvoices();

  return <BillingClientPage invoices={invoices} />;
}
