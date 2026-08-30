import type { EvidenceFile } from '@/types/evidence';

export type CustomerGridRow = {
  id: string;
  trBpNo: string;
  customerName: string;
  fullAddress: string;
  mobileNo: string;
  projectName: string;
  siteArea: string;
  supervisorName: string;
  status: string;
  canOpen: boolean;
};

export type CustomerGridColumnKey = keyof Pick<
  CustomerGridRow,
  'trBpNo' | 'customerName' | 'siteArea' | 'status' | 'mobileNo' | 'supervisorName' | 'fullAddress'
>;

export type CustomerStatus = 'Active' | 'Pending' | 'On Hold' | 'Completed';
export type ConnectionType = 'Domestic' | 'Commercial' | 'Industrial';

export type CustomerConnectionDetails = {
  reportNoGi: string;
  reportNoGc: string;
  reportNoConversion: string;
  trBpNo: string;
  mobileNo: string;
  customerName: string;
  fullAddress: string;
  scheme: string;
  plumberName: string;
  supervisorName: string;
  supervisorId: string | null;
  jobCardDone: string;
  connectionType: ConnectionType;
  houseType: string;
};

export type CustomerSurvey = {
  surveyId: string;
  surveyDate: string;
  assignedSurveyor: string;
  siteAccessibility?: string;
  meterPlacement?: string;
  pipelineRoute?: string;
  civilWorkRequired?: string;
  workableStatus: 'Workable' | 'Partially Workable' | 'Not Workable';
  approvalStatus: 'Draft' | 'Submitted' | 'In Review' | 'Approved' | 'Sent Back' | 'Rejected';
  initialMeasurements: string;
  obstaclesRemarks: string;
  notes?: string;
  reason?: string;
  recommendedAction?: string;
  expectedResolutionDate?: string;
  sentBackRemarks?: string;
  revisions?: {
    revisionNo: number;
    status: string;
    remarks: string;
    date: string;
  }[];
  gpsLocation: string;
  photos: string[];
  evidence?: EvidenceFile[];
};

export type GiMeasurements = {
  tfToRegulator: string;
  inlet: string;
  outlet: string;
  totalGiPipeHalfInch: string;
  giPipeThreeQuarterInch: string;
  giPipeOneInch: string;
  giPipeOneAndHalfInch: string;
  giPipeTwoInch: string;
  evidence?: EvidenceFile[];
  approvalStatus?: 'draft' | 'submitted' | 'approved';
  approvalComments?: string;
};

export type IsolationFittings = {
  isolationValveHalfInch: string;
  isolationValveThreeQuarterInch: string;
  isolationValveOneInch: string;
  isolationValveOneAndHalfInch: string;
  isolationValveTwoInch: string;
  applianceValveHalfInch: string;
  regulator6BarTo100Mbar: string;
  regulator6BarTo21Mbar: string;
  regulator100MbarTo21Mbar: string;
  warningPlate: string;
  clampHalfInch: string;
  elbowHalfInch: string;
  teeHalfInch: string;
  extraGiAbove10Metres: string;
  evidence?: EvidenceFile[];
};

export type FittingsAccessories = {
  clampHalfInch: string;
  clampThreeInchToHalfInch: string;
  elbowHalfInch: string;
  mfElbowHalfInch: string;
  socketHalfInch: string;
  teeHalfInch: string;
  nippleTwoInch: string;
  nippleThreeInch: string;
  nippleFourInch: string;
  reducerElbowThreeQuarterToHalfInch: string;
  threeQuarterInchToThreeInch: string;
  unionHalfInch: string;
  plugHalfInch: string;
  fittingsOneAndHalfInch: string;
  fittingsTwoInch: string;
  remarks?: string;
  evidence?: EvidenceFile[];
};

export type LmcLayingStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'Not Required'
  | 'On Hold';

export type LmcTestingStatus = 'Pending' | 'In Progress' | 'Passed' | 'Failed' | 'Not Required' | 'On Hold';
export type LmcPurgingStatus = 'Pending' | 'In Progress' | 'Completed' | 'Not Required' | 'On Hold';
export type LmcPipeStatus = LmcLayingStatus | LmcTestingStatus | LmcPurgingStatus;

export type LmcPipeRecord = {
  id: string;
  pipeSize: '20 mm' | '32 mm' | '63 mm' | '90 mm' | '125 mm' | 'Other';
  lengthMetres: string;
  layingDate: string;
  testingDate: string;
  purgingDate: string;
  layingStatus: LmcLayingStatus;
  testingStatus: LmcTestingStatus;
  purgingStatus: LmcPurgingStatus;
  jointFittingDetails: string;
  remarks: string;
  evidence: EvidenceFile[];
};

export type LmcPipelineWork = {
  pipeRecords: LmcPipeRecord[];
  fourMetresUnderGc: string;
  fourMetresAboveGc: string;
  tfHalfInch: string;
  tfOneInch: string;
  pcc: string;
  rccNalaCrossing: string;
  paverBlocks: string;
  malua: string;
  hardRock: string;
  civilRemarks?: string;
  civilEvidence?: EvidenceFile[];
  approvalStatus?: 'draft' | 'submitted' | 'approved';
  approvalComments?: string;
};

export type MdpeFittings = {
  saddle90To32Mm: string;
  saddle63To32Mm: string;
  saddle32To20Mm: string;
  tee90Mm: string;
  tee32Mm: string;
  tee20Mm: string;
  reducerCoupler90To63Mm: string;
  reducerCoupler63To32Mm: string;
  reducerCoupler32To20Mm: string;
  coupler90Mm: string;
  coupler32Mm: string;
  coupler20Mm: string;
  endCap90Mm: string;
};

export type CommissioningConversion = {
  meterNo: string;
  installationDate: string;
  commissioningDate: string;
  conversionDate: string;
  regulatorPressure: string;
  regulatorNo: string;
  meterType: string;
  meterReading: string;
  nonConversionRemark: string;
  evidence?: EvidenceFile[];
  approvalStatus?: 'draft' | 'submitted' | 'approved';
  approvalComments?: string;
};

export type BillingCompletion = {
  paymentStatus: string;
  paymentMode: string;
  initialAmount: string;
  jmrDone: boolean;
  jmrSubmittedInPbg: boolean;
  giBillDone: boolean;
  gcBillDone: boolean;
  conversionBillDone: boolean;
  remark: string;
  evidence?: EvidenceFile[];
};

export type CustomerDocument = {
  id: string;
  category: string;
  fileName: string;
  status: string;
  evidence?: EvidenceFile;
};

export type CompletionStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export type CompletionSectionKey =
  | "giMeasurements"
  | "valvesRegulators"
  | "fittingsAccessories"
  | "mdpeFittings"
  | "gc"
  | "valveChamber"
  | "poleMarker"
  | "routeMarker"
  | "preCommissioning"
  | "connection"
  | "siteExpenses";

export type SectionCompletionResult = {
  status: CompletionStatus;
  requiredFields: string[];
  missingRequiredFields: string[];
};

export type CustomerSectionCompletion = {
  survey: SectionCompletionResult;
  commissioning: SectionCompletionResult;
  giMeasurements: SectionCompletionResult;
  valvesRegulators: SectionCompletionResult;
  fittingsAccessories: SectionCompletionResult;
  mdpeFittings: SectionCompletionResult;
  lmc: SectionCompletionResult;
  gc: SectionCompletionResult;
  valveChamber: SectionCompletionResult;
  poleMarker: SectionCompletionResult;
  routeMarker: SectionCompletionResult;
  preCommissioning: SectionCompletionResult;
  connection: SectionCompletionResult;
  siteExpenses: SectionCompletionResult;
};

export type CustomerCompletionAudit = {
  gcCompletedOn: string | null;
  gcCompletedBy: string | null;
  valveChamberCompletedOn: string | null;
  valveChamberCompletedBy: string | null;
  preCommissioningCompletedOn: string | null;
  preCommissioningCompletedBy: string | null;
  poleMarkerCompletedOn: string | null;
  poleMarkerCompletedBy: string | null;
  routeMarkerCompletedOn: string | null;
  routeMarkerCompletedBy: string | null;
  connectionCompletedOn: string | null;
  connectionCompletedBy: string | null;
  siteExpensesCompletedOn: string | null;
  siteExpensesCompletedBy: string | null;
};

export type CustomerRecord = {
  id: string;
  status: CustomerStatus;
  projectName: string;
  siteArea: string;
  city: string;
  createdDate: string;
  customerConnection: CustomerConnectionDetails;
  survey: CustomerSurvey;
  giMeasurements: GiMeasurements;
  isolationFittings: IsolationFittings;
  fittingsAccessories?: FittingsAccessories;
  lmcPipelineWork: LmcPipelineWork;
  mdpeFittings: MdpeFittings;
  commissioningConversion: CommissioningConversion;
  billingCompletion: BillingCompletion;
  documents: CustomerDocument[];
  customFields?: Record<string, string | boolean>;
  sectionCompletion?: CustomerSectionCompletion;
  completionAudit?: CustomerCompletionAudit;
};
