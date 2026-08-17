import { useLocalSearchParams } from "expo-router";

import { ExpenseFormScreen } from "@/components/expenses/ExpenseFormScreen";

export default function EditExpenseRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <ExpenseFormScreen expenseId={id} />;
}
