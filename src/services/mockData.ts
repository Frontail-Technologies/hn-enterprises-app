import type { AttendanceStatus } from '@/types/field';

export type SupervisorProfile = {
  id: string;
  name: string;
  email: string;
  role: 'Supervisor';
  mobile: string;
  assignedSites: string[];
};

export type CustomerStatus = 'Active' | 'Pending' | 'On Hold' | 'Completed';
export type ConnectionType = 'Domestic' | 'Commercial' | 'Industrial';
export type WorkStage = 'Survey' | 'Workable' | 'Plumbing / GI' | 'GC' | 'Commissioning' | 'Conversion';
export type WorkProgressStatus = 'Not Started' | 'Pending' | 'In Progress' | 'Completed' | 'Sent Back' | 'On Hold';
export type PlanningStatus = 'Planned' | 'In Progress' | 'Completed' | 'Delayed';
export type NotificationCategory = 'Work' | 'Attendance' | 'Survey' | 'System';

export type Notification = {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
  route?: {
    pathname: string;
    params?: Record<string, string>;
  };
};

export type ActivityLogEntry = {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  timestamp: string;
  route?: {
    pathname: string;
    params?: Record<string, string>;
  };
};

export type EvidenceFile = {
  id: string;
  label?: string;
  fileName: string;
  uri?: string;
  fileUrl?: string;
  mimeType?: string;
  caption?: string;
  status?: 'Pending' | 'Uploading' | 'Uploaded' | 'Failed';
  errorMessage?: string;
  uploadedOn?: string;
  capturedAt?: string;
  gpsLocation?: string;
};

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
};

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

export type PlanningDprRecord = {
  id: string;
  date: string;
  supervisor: string;
  projectName: string;
  siteArea: string;
  activity: string;
  plannedQty: string;
  completedQty: string;
  status: PlanningStatus;
  delayReason: string;
  photoCount: number;
};

export type AttendanceDay = {
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  locationAddress?: string;
};

export const supervisorProfile: SupervisorProfile = {
  id: 'sup-001',
  name: 'Amit Rathore',
  email: 'supervisor@hnenterprises.com',
  role: 'Supervisor',
  mobile: '9823411122',
  assignedSites: ['Shyam Nagar Block A', 'Shyam Nagar Block B', 'Green City Phase 1'],
};

const ALL_PIPE_SIZES: LmcPipeRecord['pipeSize'][] = ['20 mm', '32 mm', '63 mm', '90 mm', '125 mm', 'Other'];

function createEmptyPipeRecord(pipeSize: LmcPipeRecord['pipeSize']): LmcPipeRecord {
  return {
    id: `pipe-${pipeSize.toLowerCase().replace(/\s+/g, '-')}`,
    pipeSize,
    lengthMetres: '0',
    layingDate: '',
    testingDate: '',
    purgingDate: '',
    layingStatus: 'Not Required',
    testingStatus: 'Not Required',
    purgingStatus: 'Not Required',
    jointFittingDetails: '-',
    remarks: '-',
    evidence: [],
  };
}

function withAllPipeSizes(records: LmcPipeRecord[]): LmcPipeRecord[] {
  return ALL_PIPE_SIZES.map(
    (pipeSize) => records.find((record) => record.pipeSize === pipeSize) ?? createEmptyPipeRecord(pipeSize),
  );
}

export const customers: CustomerRecord[] = [
  {
    id: 'cust-001',
    status: 'Active',
    projectName: 'Shyam Nagar CGD Project',
    siteArea: 'Shyam Nagar Block A',
    city: 'Jaipur',
    createdDate: '2025-01-24',
    customerConnection: {
      reportNoGi: 'GI-100245',
      reportNoGc: 'GC-100245',
      reportNoConversion: 'CNV-100245',
      trBpNo: 'BP-100245',
      mobileNo: '9876543210',
      customerName: 'Rajesh Kumar',
      fullAddress: '42, Shyam Nagar Block A, Jaipur',
      scheme: 'Standard',
      plumberName: 'Group A',
      supervisorName: 'Amit Rathore',
      jobCardDone: 'Yes',
      connectionType: 'Domestic',
      houseType: 'Independent House',
    },
    survey: {
      surveyId: 'SUR-100245',
      surveyDate: '2025-01-28',
      assignedSurveyor: 'Vikas Saini',
      workableStatus: 'Workable',
      approvalStatus: 'Approved',
      siteAccessibility: 'Accessible',
      meterPlacement: 'Available near front wall',
      pipelineRoute: 'Clear',
      civilWorkRequired: 'No',
      initialMeasurements: 'Meter point and route marked.',
      obstaclesRemarks: 'No obstruction found.',
      notes: 'Site is ready for GI planning.',
      reason: '-',
      recommendedAction: 'Proceed for installation.',
      expectedResolutionDate: '-',
      revisions: [
        { revisionNo: 1, status: 'Approved', remarks: 'Initial survey approved.', date: '2025-01-28' },
      ],
      gpsLocation: '26.8951, 75.7684',
      photos: ['site_front_bp_100245.jpg', 'meter_location_bp_100245.jpg'],
      evidence: [
        { id: 'ev-sur-1', label: 'Site Front', fileName: 'site_front_bp_100245.jpg', status: 'Uploaded' },
        { id: 'ev-sur-2', label: 'Meter Location', fileName: 'meter_location_bp_100245.jpg', status: 'Uploaded' },
      ],
    },
    giMeasurements: {
      tfToRegulator: '2.4',
      inlet: '1.2',
      outlet: '1.1',
      totalGiPipeHalfInch: '18.5',
      giPipeThreeQuarterInch: '0',
      giPipeOneInch: '0',
      giPipeOneAndHalfInch: '0',
      giPipeTwoInch: '0',
    },
    isolationFittings: {
      isolationValveHalfInch: '1',
      isolationValveThreeQuarterInch: '0',
      isolationValveOneInch: '0',
      isolationValveOneAndHalfInch: '0',
      isolationValveTwoInch: '0',
      applianceValveHalfInch: '1',
      regulator6BarTo100Mbar: '1',
      regulator6BarTo21Mbar: '0',
      regulator100MbarTo21Mbar: '1',
      warningPlate: '1',
      clampHalfInch: '12',
      elbowHalfInch: '6',
      teeHalfInch: '1',
      extraGiAbove10Metres: '8.5',
    },
    fittingsAccessories: {
      clampHalfInch: '12',
      clampThreeInchToHalfInch: '0',
      elbowHalfInch: '6',
      mfElbowHalfInch: '2',
      socketHalfInch: '3',
      teeHalfInch: '1',
      nippleTwoInch: '2',
      nippleThreeInch: '1',
      nippleFourInch: '0',
      reducerElbowThreeQuarterToHalfInch: '0',
      threeQuarterInchToThreeInch: '0',
      unionHalfInch: '1',
      plugHalfInch: '1',
      fittingsOneAndHalfInch: '0',
      fittingsTwoInch: '0',
      remarks: 'Standard domestic fittings used.',
      evidence: [{ id: 'ev-fit-1', label: 'Fittings Photo', fileName: 'fittings_bp_100245.jpg', status: 'Uploaded' }],
    },
    lmcPipelineWork: {
      pipeRecords: withAllPipeSizes([
        {
          id: 'pipe-20-mm',
          pipeSize: '20 mm',
          lengthMetres: '18.5',
          layingDate: '2025-02-09',
          testingDate: '2025-02-10',
          purgingDate: '2025-02-11',
          layingStatus: 'Completed',
          testingStatus: 'Passed',
          purgingStatus: 'Completed',
          jointFittingDetails: '20 mm service line with standard MDPE joints.',
          remarks: 'Domestic service line completed.',
          evidence: [
            { id: 'ev-lmc-1', label: 'Trench', fileName: 'lmc_trench_bp_100245.jpg', status: 'Uploaded' },
            { id: 'ev-lmc-2', label: 'Joint', fileName: 'lmc_joint_bp_100245.jpg', status: 'Uploaded' },
          ],
        },
      ]),
      fourMetresUnderGc: '4',
      fourMetresAboveGc: '0',
      tfHalfInch: '1',
      tfOneInch: '0',
      pcc: '0',
      rccNalaCrossing: '0',
      paverBlocks: '2',
      malua: '0',
      hardRock: '0',
      civilRemarks: 'No major civil restoration required.',
      civilEvidence: [],
    },
    mdpeFittings: {
      saddle90To32Mm: '0',
      saddle63To32Mm: '0',
      saddle32To20Mm: '1',
      tee90Mm: '0',
      tee32Mm: '0',
      tee20Mm: '1',
      reducerCoupler90To63Mm: '0',
      reducerCoupler63To32Mm: '0',
      reducerCoupler32To20Mm: '1',
      coupler90Mm: '0',
      coupler32Mm: '0',
      coupler20Mm: '2',
      endCap90Mm: '0',
    },
    commissioningConversion: {
      meterNo: 'MTR-77881',
      installationDate: '2025-02-08',
      commissioningDate: '2025-02-15',
      conversionDate: '',
      regulatorPressure: '21 mbar',
      regulatorNo: 'REG-2230',
      meterType: 'Smart Meter',
      meterReading: '0 SCM',
      nonConversionRemark: '-',
      evidence: [{ id: 'ev-meter-1', label: 'Meter Photo', fileName: 'meter_photo_bp_100245.jpg', status: 'Uploaded' }],
    },
    billingCompletion: {
      paymentStatus: 'Approved',
      paymentMode: 'UPI',
      initialAmount: '2500',
      jmrDone: true,
      jmrSubmittedInPbg: true,
      giBillDone: true,
      gcBillDone: true,
      conversionBillDone: false,
      remark: 'Conversion bill pending.',
      evidence: [],
    },
    documents: [
      { id: 'doc-1', category: 'Meter Photo', fileName: 'meter_photo_bp_100245.jpg', status: 'Approved' },
      { id: 'doc-2', category: 'LMC / Site Evidence', fileName: 'lmc_trench_bp_100245.jpg', status: 'Approved' },
    ],
  },
  {
    id: 'cust-002',
    status: 'Pending',
    projectName: 'Shyam Nagar CGD Project',
    siteArea: 'Shyam Nagar Block B',
    city: 'Jaipur',
    createdDate: '2025-02-02',
    customerConnection: {
      reportNoGi: 'GI-553901',
      reportNoGc: 'GC-553901',
      reportNoConversion: 'CNV-553901',
      trBpNo: 'TR-553901',
      mobileNo: '9823411122',
      customerName: 'Meena Sharma',
      fullAddress: 'House No. 12, Shanti Nagar, Jaipur',
      scheme: 'Standard',
      plumberName: 'Group B',
      supervisorName: 'Amit Rathore',
      jobCardDone: 'Yes',
      connectionType: 'Domestic',
      houseType: 'Flat',
    },
    survey: {
      surveyId: 'SUR-553901',
      surveyDate: '2025-02-04',
      assignedSurveyor: 'Vikas Saini',
      workableStatus: 'Workable',
      approvalStatus: 'Approved',
      siteAccessibility: 'Accessible',
      meterPlacement: 'Available',
      pipelineRoute: 'Clear after GC correction',
      civilWorkRequired: 'No',
      initialMeasurements: 'Meter point available.',
      obstaclesRemarks: 'GC image correction required.',
      notes: 'Customer available after 11 AM.',
      reason: 'Corrected evidence required.',
      recommendedAction: 'Resubmit GC evidence.',
      expectedResolutionDate: '2025-02-20',
      sentBackRemarks: 'Upload clearer GC image near meter joint.',
      revisions: [
        { revisionNo: 1, status: 'Sent Back', remarks: 'GC image correction required.', date: '2025-02-12' },
      ],
      gpsLocation: '26.9022, 75.7621',
      photos: ['meter_location_tr_553901.jpg'],
      evidence: [{ id: 'ev-sur-3', label: 'Meter Location', fileName: 'meter_location_tr_553901.jpg', status: 'Uploaded' }],
    },
    giMeasurements: {
      tfToRegulator: '2.0',
      inlet: '1.0',
      outlet: '1.0',
      totalGiPipeHalfInch: '14',
      giPipeThreeQuarterInch: '0',
      giPipeOneInch: '0',
      giPipeOneAndHalfInch: '0',
      giPipeTwoInch: '0',
    },
    isolationFittings: {
      isolationValveHalfInch: '1',
      isolationValveThreeQuarterInch: '0',
      isolationValveOneInch: '0',
      isolationValveOneAndHalfInch: '0',
      isolationValveTwoInch: '0',
      applianceValveHalfInch: '1',
      regulator6BarTo100Mbar: '1',
      regulator6BarTo21Mbar: '0',
      regulator100MbarTo21Mbar: '1',
      warningPlate: '1',
      clampHalfInch: '9',
      elbowHalfInch: '4',
      teeHalfInch: '1',
      extraGiAbove10Metres: '4',
    },
    fittingsAccessories: {
      clampHalfInch: '9',
      clampThreeInchToHalfInch: '0',
      elbowHalfInch: '4',
      mfElbowHalfInch: '1',
      socketHalfInch: '2',
      teeHalfInch: '1',
      nippleTwoInch: '1',
      nippleThreeInch: '1',
      nippleFourInch: '0',
      reducerElbowThreeQuarterToHalfInch: '0',
      threeQuarterInchToThreeInch: '0',
      unionHalfInch: '1',
      plugHalfInch: '1',
      fittingsOneAndHalfInch: '0',
      fittingsTwoInch: '0',
      remarks: 'Correction visit pending.',
      evidence: [],
    },
    lmcPipelineWork: {
      pipeRecords: withAllPipeSizes([
        {
          id: 'pipe-20-mm',
          pipeSize: '20 mm',
          lengthMetres: '12',
          layingDate: '2025-02-11',
          testingDate: '2025-02-12',
          purgingDate: '',
          layingStatus: 'Completed',
          testingStatus: 'Passed',
          purgingStatus: 'Pending',
          jointFittingDetails: '20 mm service line ready for corrected GC evidence.',
          remarks: 'Need clearer photo near meter joint.',
          evidence: [{ id: 'ev-lmc-3', label: 'Meter Joint', fileName: 'meter_joint_tr_553901.jpg', status: 'Uploaded' }],
        },
      ]),
      fourMetresUnderGc: '4',
      fourMetresAboveGc: '0',
      tfHalfInch: '1',
      tfOneInch: '0',
      pcc: '0',
      rccNalaCrossing: '0',
      paverBlocks: '1',
      malua: '0',
      hardRock: '0',
      civilRemarks: 'Paver block restoration pending.',
      civilEvidence: [],
    },
    mdpeFittings: {
      saddle90To32Mm: '0',
      saddle63To32Mm: '0',
      saddle32To20Mm: '1',
      tee90Mm: '0',
      tee32Mm: '0',
      tee20Mm: '1',
      reducerCoupler90To63Mm: '0',
      reducerCoupler63To32Mm: '0',
      reducerCoupler32To20Mm: '1',
      coupler90Mm: '0',
      coupler32Mm: '0',
      coupler20Mm: '1',
      endCap90Mm: '0',
    },
    commissioningConversion: {
      meterNo: 'MTR-77892',
      installationDate: '2025-02-15',
      commissioningDate: '',
      conversionDate: '',
      regulatorPressure: '21 mbar',
      regulatorNo: 'REG-2231',
      meterType: 'Mechanical',
      meterReading: '0 SCM',
      nonConversionRemark: 'GC correction pending.',
      evidence: [],
    },
    billingCompletion: {
      paymentStatus: 'Pending',
      paymentMode: 'Cash',
      initialAmount: '1500',
      jmrDone: false,
      jmrSubmittedInPbg: false,
      giBillDone: true,
      gcBillDone: false,
      conversionBillDone: false,
      remark: 'GC upload pending.',
      evidence: [{ id: 'ev-bill-1', label: 'GC Report', fileName: 'gc_report_tr_553901.pdf', status: 'Uploaded' }],
    },
    documents: [
      { id: 'doc-3', category: 'GC Report', fileName: 'gc_report_tr_553901.pdf', status: 'Sent Back' },
    ],
  },
  {
    id: 'cust-003',
    status: 'Active',
    projectName: 'Green City Phase 1',
    siteArea: 'Commercial Block',
    city: 'Indore',
    createdDate: '2025-02-18',
    customerConnection: {
      reportNoGi: 'GI-220118',
      reportNoGc: 'GC-220118',
      reportNoConversion: 'CNV-220118',
      trBpNo: 'BP-220118',
      mobileNo: '9988776655',
      customerName: 'Green Mart Store',
      fullAddress: 'Shop 8, Green City Phase 1, Indore',
      scheme: 'Commercial',
      plumberName: 'Group C',
      supervisorName: 'Amit Rathore',
      jobCardDone: 'Yes',
      connectionType: 'Commercial',
      houseType: 'Shop',
    },
    survey: {
      surveyId: 'SUR-220118',
      surveyDate: '2025-02-20',
      assignedSurveyor: 'Neha Verma',
      workableStatus: 'Workable',
      approvalStatus: 'Approved',
      siteAccessibility: 'Accessible',
      meterPlacement: 'Commercial meter room',
      pipelineRoute: 'Approved commercial route',
      civilWorkRequired: 'Yes',
      initialMeasurements: 'Commercial meter point marked.',
      obstaclesRemarks: '-',
      notes: 'Commercial work completed.',
      reason: '-',
      recommendedAction: 'No action pending.',
      expectedResolutionDate: '-',
      revisions: [
        { revisionNo: 1, status: 'Approved', remarks: 'Commercial survey approved.', date: '2025-02-20' },
      ],
      gpsLocation: '22.7196, 75.8577',
      photos: ['commercial_front_bp_220118.jpg'],
      evidence: [{ id: 'ev-sur-4', label: 'Commercial Front', fileName: 'commercial_front_bp_220118.jpg', status: 'Uploaded' }],
    },
    giMeasurements: {
      tfToRegulator: '4',
      inlet: '1.5',
      outlet: '1.5',
      totalGiPipeHalfInch: '22',
      giPipeThreeQuarterInch: '8',
      giPipeOneInch: '2',
      giPipeOneAndHalfInch: '0',
      giPipeTwoInch: '0',
    },
    isolationFittings: {
      isolationValveHalfInch: '1',
      isolationValveThreeQuarterInch: '1',
      isolationValveOneInch: '0',
      isolationValveOneAndHalfInch: '0',
      isolationValveTwoInch: '0',
      applianceValveHalfInch: '2',
      regulator6BarTo100Mbar: '1',
      regulator6BarTo21Mbar: '0',
      regulator100MbarTo21Mbar: '1',
      warningPlate: '1',
      clampHalfInch: '16',
      elbowHalfInch: '8',
      teeHalfInch: '2',
      extraGiAbove10Metres: '12',
    },
    fittingsAccessories: {
      clampHalfInch: '16',
      clampThreeInchToHalfInch: '0',
      elbowHalfInch: '8',
      mfElbowHalfInch: '3',
      socketHalfInch: '4',
      teeHalfInch: '2',
      nippleTwoInch: '2',
      nippleThreeInch: '2',
      nippleFourInch: '1',
      reducerElbowThreeQuarterToHalfInch: '1',
      threeQuarterInchToThreeInch: '0',
      unionHalfInch: '2',
      plugHalfInch: '1',
      fittingsOneAndHalfInch: '0',
      fittingsTwoInch: '0',
      remarks: 'Commercial fitting quantity verified.',
      evidence: [],
    },
    lmcPipelineWork: {
      pipeRecords: withAllPipeSizes([
        {
          id: 'pipe-32-mm',
          pipeSize: '32 mm',
          lengthMetres: '28',
          layingDate: '2025-03-01',
          testingDate: '2025-03-02',
          purgingDate: '2025-03-03',
          layingStatus: 'Completed',
          testingStatus: 'Passed',
          purgingStatus: 'Completed',
          jointFittingDetails: '32 mm line with commercial tee connection.',
          remarks: 'Completed.',
          evidence: [
            { id: 'ev-lmc-4', label: 'Commercial Trench', fileName: 'commercial_trench_bp_220118.jpg', status: 'Uploaded' },
            { id: 'ev-lmc-5', label: 'Tee Connection', fileName: 'tee_connection_bp_220118.jpg', status: 'Uploaded' },
          ],
        },
      ]),
      fourMetresUnderGc: '0',
      fourMetresAboveGc: '4',
      tfHalfInch: '0',
      tfOneInch: '1',
      pcc: '2',
      rccNalaCrossing: '0',
      paverBlocks: '4',
      malua: '0',
      hardRock: '0',
      civilRemarks: 'Paver restoration completed.',
      civilEvidence: [],
    },
    mdpeFittings: {
      saddle90To32Mm: '1',
      saddle63To32Mm: '0',
      saddle32To20Mm: '0',
      tee90Mm: '0',
      tee32Mm: '1',
      tee20Mm: '0',
      reducerCoupler90To63Mm: '0',
      reducerCoupler63To32Mm: '0',
      reducerCoupler32To20Mm: '0',
      coupler90Mm: '0',
      coupler32Mm: '2',
      coupler20Mm: '0',
      endCap90Mm: '0',
    },
    commissioningConversion: {
      meterNo: 'MTR-88120',
      installationDate: '2025-03-01',
      commissioningDate: '2025-03-04',
      conversionDate: '2025-03-04',
      regulatorPressure: '21 mbar',
      regulatorNo: 'REG-4012',
      meterType: 'Commercial Meter',
      meterReading: '3 SCM',
      nonConversionRemark: '-',
      evidence: [{ id: 'ev-meter-2', label: 'Commercial Meter', fileName: 'commercial_meter_bp_220118.jpg', status: 'Uploaded' }],
    },
    billingCompletion: {
      paymentStatus: 'Completed',
      paymentMode: 'Bank Transfer',
      initialAmount: '12000',
      jmrDone: true,
      jmrSubmittedInPbg: true,
      giBillDone: true,
      gcBillDone: true,
      conversionBillDone: true,
      remark: 'Completed.',
      evidence: [],
    },
    documents: [
      { id: 'doc-4', category: 'Conversion Report', fileName: 'conversion_bp_220118.pdf', status: 'Approved' },
    ],
  },
];

export const planningDprRecords: PlanningDprRecord[] = [
  {
    id: 'dpr-001',
    date: '2025-02-18',
    supervisor: 'Amit Rathore',
    projectName: 'Shyam Nagar CGD Project',
    siteArea: 'Shyam Nagar Block A',
    activity: 'GI installation',
    plannedQty: '34 customers',
    completedQty: '28 customers',
    status: 'In Progress',
    delayReason: '-',
    photoCount: 4,
  },
  {
    id: 'dpr-002',
    date: '2025-02-18',
    supervisor: 'Amit Rathore',
    projectName: 'Shyam Nagar CGD Project',
    siteArea: 'Shyam Nagar Block B',
    activity: 'GC correction visit',
    plannedQty: '18 customers',
    completedQty: '12 customers',
    status: 'Delayed',
    delayReason: 'Customer unavailable',
    photoCount: 3,
  },
];

export const todayAttendance: AttendanceDay = {
  date: new Date().toISOString(),
  status: 'Not Marked',
};

export function getCustomerById(customerId: string) {
  return customers.find((customer) => customer.id === customerId) ?? null;
}

export function requestPasswordReset(identifier: string) {
  return identifier.trim().length > 0;
}
