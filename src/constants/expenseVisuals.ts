import {
  Building2,
  MoreHorizontal,
  Package,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";

import type { AppColors } from "@/constants/colors";
import type { ExpenseCategory } from "@/services/expenses.service";

type ExpenseCategoryVisual = { icon: LucideIcon; colorKey: keyof AppColors };

export const expenseCategoryVisuals: Record<
  ExpenseCategory,
  ExpenseCategoryVisual
> = {
  worker_payment: { icon: Users, colorKey: "accent" },
  supervisor_payment: { icon: UserCog, colorKey: "primary" },
  plumber_payment: { icon: Wrench, colorKey: "green" },
  rent: { icon: Building2, colorKey: "amber" },
  material_expense: { icon: Package, colorKey: "blue" },
  other_expense: { icon: MoreHorizontal, colorKey: "muted" },
};

const FALLBACK_VISUAL: ExpenseCategoryVisual = {
  icon: MoreHorizontal,
  colorKey: "muted",
};

export function getExpenseCategoryVisual(
  category: ExpenseCategory,
): ExpenseCategoryVisual {
  return expenseCategoryVisuals[category] ?? FALLBACK_VISUAL;
}
