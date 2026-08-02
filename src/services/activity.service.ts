import { planningApi, type BackendDprRecord } from "./planning.service";
import { workProgressApi, type BackendWorkProgressUpdate } from "./workProgress.service";
import type { ActivityLogEntry } from "./mockData";

const STAGE_LABEL: Record<BackendWorkProgressUpdate["stage"], string> = {
  survey: "Survey",
  workable: "Workable",
  plumbing_gi: "Plumbing / GI",
  gc: "GC",
  commissioning: "Commissioning",
  conversion: "Conversion",
};

const STATUS_LABEL: Record<BackendWorkProgressUpdate["status"], string> = {
  not_started: "Not Started",
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  sent_back: "Sent Back",
  on_hold: "On Hold",
};

function mapWorkProgressToActivity(update: BackendWorkProgressUpdate): ActivityLogEntry {
  const stageLabel = STAGE_LABEL[update.stage] ?? update.stage;
  const statusLabel = STATUS_LABEL[update.status] ?? update.status;
  return {
    id: `activity-work-${update.id}`,
    title: `${stageLabel} : ${statusLabel}`,
    description: `${update.customer?.name ?? "Customer"} : ${update.nextRequiredAction ?? update.remarks ?? "Work progress updated"}`,
    category: update.stage === "survey" ? "Survey" : "Work",
    timestamp: update.createdAt,
    route: { pathname: "/work/[id]", params: { id: update.customerId } },
  };
}

function mapDprToActivity(record: BackendDprRecord): ActivityLogEntry {
  return {
    id: `activity-dpr-${record.id}`,
    title: `DPR ${record.status}`,
    description: `${record.site?.name ?? "Site"} : ${record.remarks ?? "Daily progress report"}`,
    category: "Work",
    timestamp: record.submittedAt ?? record.date,
    route: { pathname: "/work" },
  };
}

export async function getRecentActivity({
  extra = [],
  limit = 10,
  supervisorId,
}: {
  extra?: ActivityLogEntry[];
  limit?: number;
  supervisorId?: string;
}): Promise<ActivityLogEntry[]> {
  const [workUpdates, dprRecords] = await Promise.all([
    supervisorId
      ? workProgressApi.list({ supervisorId, limit: 20 }).catch((): BackendWorkProgressUpdate[] => [])
      : Promise.resolve<BackendWorkProgressUpdate[]>([]),
    supervisorId
      ? planningApi.listDprRecords({ supervisorId }).catch((): BackendDprRecord[] => [])
      : Promise.resolve<BackendDprRecord[]>([]),
  ]);

  const workEntries = workUpdates.map(mapWorkProgressToActivity);
  const dprEntries = dprRecords.map(mapDprToActivity);

  return [...extra, ...workEntries, ...dprEntries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
