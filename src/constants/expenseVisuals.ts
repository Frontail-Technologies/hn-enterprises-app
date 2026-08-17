import {
  Building2,
  MoreHorizontal,
  Package,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';

import type { AppColors } from '@/constants/colors';
import type { ExpenseCategory } from '@/services/expenses.service';

// Icon + palette-key per expense category, used by the Expenses Overview
// (donut segments, category rows). colorKey resolves against the active
// theme's colors so it stays correct in dark mode instead of a baked hex.
export const expenseCategoryVisuals: Record<ExpenseCategory, { icon: LucideIcon; colorKey: keyof AppColors }> = {
  worker_payment: { icon: Users, colorKey: 'accent' },
  plumber_payment: { icon: Wrench, colorKey: 'green' },
  rent: { icon: Building2, colorKey: 'amber' },
  material_expense: { icon: Package, colorKey: 'blue' },
  other_expense: { icon: MoreHorizontal, colorKey: 'muted' },
};
