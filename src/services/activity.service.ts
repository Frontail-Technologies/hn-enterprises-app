import { planningApi, type BackendDprRecord } from "./planning.service";
import { STAGE_TO_MOBILE, STATUS_TO_MOBILE, workProgressApi, type BackendWorkProgressUpdate } from "./workProgress.service";
import type { ActivityLogEntry } from "../types/activity";

function mapWorkProgressToActivity(update: BackendWorkProgressUpdate): ActivityLogEntry {
  const stageLabel = STAGE_TO_MOBILE[update.stage] ?? update.stage;
  const statusLabel = STATUS_TO_MOBILE[update.status] ?? update.status;
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

export type RecentActivityResult = {
  items: ActivityLogEntry[];
  partial: boolean;
};

export async function getRecentActivity({
  extra = [],
  limit = 10,
  supervisorId,
}: {
  extra?: ActivityLogEntry[];
  limit?: number;
  supervisorId?: string;
}): Promise<RecentActivityResult> {
  let partial = false;

  const [workUpdates, dprRecords] = await Promise.all([
    supervisorId
      ? workProgressApi.list({ supervisorId, limit: 20 }).catch((error): BackendWorkProgressUpdate[] => {
          console.error('[activity.service] failed to load work updates for activity feed', error);
          partial = true;
          return [];
        })
      : Promise.resolve<BackendWorkProgressUpdate[]>([]),
    supervisorId
      ? planningApi.listDprRecords({ supervisorId }).catch((error): BackendDprRecord[] => {
          console.error('[activity.service] failed to load DPR records for activity feed', error);
          partial = true;
          return [];
        })
      : Promise.resolve<BackendDprRecord[]>([]),
  ]);

  const workEntries = workUpdates.map(mapWorkProgressToActivity);
  const dprEntries = dprRecords.map(mapDprToActivity);

  const items = [...extra, ...workEntries, ...dprEntries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return { items, partial };
}
