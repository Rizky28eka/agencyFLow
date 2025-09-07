import { getContracts } from "./actions";
import { ContractTable } from "./contract-table";

export default async function ContractsPage() {
  const contracts = (await getContracts()).map((contract) => ({
    ...contract,
    amount: contract.amount.toString(),
    project: contract.project ? {
      ...contract.project,
      budget: contract.project.budget ? contract.project.budget.toString() : null,
    } : null,
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Contracts</h2>
      </div>
      <ContractTable initialContracts={contracts} />
    </div>
  );
}
