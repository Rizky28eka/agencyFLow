import { getClientQuotations } from "@/app/actions/client-data";
import QuotationsClientPage from "./quotations-client-page";

export default async function ClientQuotationsPage() {
  const quotations = await getClientQuotations();

  return <QuotationsClientPage quotations={quotations} />;
}
