export type WorkStage = 'Survey' | 'Workable' | 'Plumbing / GI' | 'GC' | 'Commissioning' | 'Conversion';
export type WorkProgressStatus = 'Not Started' | 'Pending' | 'In Progress' | 'Completed' | 'Sent Back' | 'On Hold';

export type WorkProgressRecord = {
  id: string;
  customerId: string;
  customerName: string;
  mobileNumber: string;
  bpTrNumber: string;
  projectName: string;
  siteArea: string;
  supervisor: string;
  currentStage: WorkStage;
  expectedNextStage: WorkStage;
  nextRequiredAction: string;
  stageDate: string;
  ageDays: number;
  evidenceCount: number;
  lastUpdated: string;
  updatedBy: string;
  status: WorkProgressStatus;
};

export type WorkQueueFilter = "All" | WorkProgressStatus;
