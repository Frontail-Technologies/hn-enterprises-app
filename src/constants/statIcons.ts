import {
  BadgeCheck,
  Box,
  Cable,
  CalendarDays,
  ClipboardCheck,
  Construction,
  Droplets,
  FileCheck2,
  FileText,
  IndianRupee,
  ListChecks,
  RefreshCcw,
  Ruler,
} from 'lucide-react-native';

import type { SupervisorStatId } from '@/services/mobileStats';

export const statIcons: Record<SupervisorStatId, typeof ClipboardCheck> = {
  'survey-done': ClipboardCheck,
  'conversion-done': RefreshCcw,
  'gi-done': Ruler,
  'jmr-done': FileCheck2,
  'gc-done': Cable,
  'site-expenses-done': IndianRupee,
  laying: Construction,
  'flushing-testing': Droplets,
  'valve-chamber': Box,
  'pre-commissioning': ListChecks,
  commissioning: BadgeCheck,
  dpr: FileText,
  planning: CalendarDays,
};
