import { apiRequest } from "./apiClient";
import type {
  BillingCompletion,
  CommissioningConversion,
  CustomerConnectionDetails,
  CustomerDocument,
  CustomerRecord,
  CustomerStatus,
  FittingsAccessories,
  GiMeasurements,
  IsolationFittings,
  LmcPipeRecord,
  LmcPipelineWork,
  LmcLayingStatus,
  LmcTestingStatus,
  LmcPurgingStatus,
  MdpeFittings,
} from "./mockData";

type BackendCustomerStatus = "draft" | "pending" | "active" | "inactive" | "on_hold" | "completed" | "archived";

const STATUS_TO_MOBILE: Record<BackendCustomerStatus, CustomerStatus> = {
  draft: "Pending",
  pending: "Pending",
  active: "Active",
  inactive: "On Hold",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Completed",
};

const LMC_SIZE_TO_BACKEND: Record<LmcPipeRecord["pipeSize"], string> = {
  "20 mm": "20_mm",
  "32 mm": "32_mm",
  "63 mm": "63_mm",
  "90 mm": "90_mm",
  "125 mm": "125_mm",
  Other: "other",
};

const LMC_SIZE_TO_MOBILE: Record<string, LmcPipeRecord["pipeSize"]> = Object.fromEntries(
  Object.entries(LMC_SIZE_TO_BACKEND).map(([mobile, backend]) => [backend, mobile as LmcPipeRecord["pipeSize"]]),
);

const LAYING_TO_BACKEND: Record<LmcLayingStatus, string> = {
  "Not Started": "not_started",
  "In Progress": "in_progress",
  Completed: "laying_completed",
  "Not Required": "not_required",
  "On Hold": "on_hold",
};
const LAYING_TO_MOBILE: Record<string, LmcLayingStatus> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  laying_completed: "Completed",
  testing_pending: "Completed",
  testing_completed: "Completed",
  purging_completed: "Completed",
  not_required: "Not Required",
  on_hold: "On Hold",
};

const TESTING_TO_BACKEND: Record<LmcTestingStatus, string> = {
  Pending: "testing_pending",
  "In Progress": "in_progress",
  Passed: "testing_completed",
  Failed: "testing_pending",
  "Not Required": "not_required",
  "On Hold": "on_hold",
};
const TESTING_TO_MOBILE: Record<string, LmcTestingStatus> = {
  not_started: "Pending",
  in_progress: "In Progress",
  laying_completed: "Pending",
  testing_pending: "Pending",
  testing_completed: "Passed",
  purging_completed: "Passed",
  not_required: "Not Required",
  on_hold: "On Hold",
};

const PURGING_TO_BACKEND: Record<LmcPurgingStatus, string> = {
  Pending: "not_started",
  "In Progress": "in_progress",
  Completed: "purging_completed",
  "Not Required": "not_required",
  "On Hold": "on_hold",
};
const PURGING_TO_MOBILE: Record<string, LmcPurgingStatus> = {
  not_started: "Pending",
  in_progress: "In Progress",
  laying_completed: "Pending",
  testing_pending: "Pending",
  testing_completed: "Pending",
  purging_completed: "Completed",
  not_required: "Not Required",
  on_hold: "On Hold",
};

function toDateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function numOrEmpty(value: string | number | null | undefined) {
  return value == null || value === "" ? "" : String(value);
}

type BackendCustomer = {
  id: string;
  trBpNumber: string;
  mobileNumber: string | null;
  customerName: string;
  fullAddress: string | null;
  city: string | null;
  connectionType: string | null;
  houseType: string | null;
  scheme: string | null;
  plumberName: string | null;
  supervisorName: string | null;
  giReportNumber: string | null;
  gcReportNumber: string | null;
  conversionReportNumber: string | null;
  status: BackendCustomerStatus;
  createdAt: string;
  survey: Record<string, unknown> | null;
  giMeasurements: Record<string, unknown> | null;
  valvesRegulators: Record<string, unknown> | null;
  fittingsAccessories: Record<string, unknown> | null;
  lmcPipelineWork: Record<string, unknown> | null;
  mdpeFittings: Record<string, unknown> | null;
  commissioningConversion: Record<string, unknown> | null;
  billingCompletion: Record<string, unknown> | null;
  lmcPipeRecords?: BackendLmcPipeRecord[];
  documents?: BackendCustomerDocument[];
};

type BackendLmcPipeRecord = {
  id: string;
  pipeSize: string;
  lengthMetres: string | null;
  layingDate: string | null;
  testingDate: string | null;
  purgingDate: string | null;
  layingStatus: string;
  testingStatus: string;
  purgingStatus: string;
  jointFittingDetails: string | null;
  remarks: string | null;
  evidence: Record<string, unknown>[] | null;
};

type BackendCustomerDocument = {
  id: string;
  documentType: string;
  category: string | null;
  fileName: string;
  status: string;
};

function mapPipeRecord(raw: BackendLmcPipeRecord): LmcPipeRecord {
  return {
    id: raw.id,
    pipeSize: LMC_SIZE_TO_MOBILE[raw.pipeSize] ?? "Other",
    lengthMetres: numOrEmpty(raw.lengthMetres),
    layingDate: toDateOnly(raw.layingDate),
    testingDate: toDateOnly(raw.testingDate),
    purgingDate: toDateOnly(raw.purgingDate),
    layingStatus: LAYING_TO_MOBILE[raw.layingStatus] ?? "Not Started",
    testingStatus: TESTING_TO_MOBILE[raw.testingStatus] ?? "Pending",
    purgingStatus: PURGING_TO_MOBILE[raw.purgingStatus] ?? "Pending",
    jointFittingDetails: raw.jointFittingDetails ?? "",
    remarks: raw.remarks ?? "",
    evidence: (raw.evidence ?? []).map((item, index) => ({
      id: `${raw.id}-evidence-${index}`,
      fileName: String(item.fileName ?? item.label ?? `evidence-${index}`),
      status: "Uploaded",
    })),
  };
}

function withAllPipeSizes(records: BackendLmcPipeRecord[] | undefined): LmcPipeRecord[] {
  const bySize = new Map((records ?? []).map((record) => [LMC_SIZE_TO_MOBILE[record.pipeSize] ?? "Other", record]));
  const sizes: LmcPipeRecord["pipeSize"][] = ["20 mm", "32 mm", "63 mm", "90 mm", "125 mm", "Other"];

  return sizes.map((size) =>
    bySize.has(size)
      ? mapPipeRecord(bySize.get(size)!)
      : {
          id: `pipe-${size.toLowerCase().replace(/\s+/g, "-")}`,
          pipeSize: size,
          lengthMetres: "",
          layingDate: "",
          testingDate: "",
          purgingDate: "",
          layingStatus: "Not Required",
          testingStatus: "Not Required",
          purgingStatus: "Not Required",
          jointFittingDetails: "",
          remarks: "",
          evidence: [],
        },
  );
}

function mapDocument(raw: BackendCustomerDocument): CustomerDocument {
  return {
    id: raw.id,
    category: raw.category ?? raw.documentType,
    fileName: raw.fileName,
    status: raw.status,
  };
}

export function mapCustomer(raw: BackendCustomer): CustomerRecord {
  const gi = (raw.giMeasurements as Partial<GiMeasurements> | null) ?? {};
  const valves = (raw.valvesRegulators as Record<string, string> | null) ?? {};
  const fittings = (raw.fittingsAccessories as Record<string, string> | null) ?? {};
  const lmc = (raw.lmcPipelineWork as Partial<LmcPipelineWork> | null) ?? {};
  const survey = raw.survey as Record<string, unknown> | null;

  const connection: CustomerConnectionDetails = {
    reportNoGi: raw.giReportNumber ?? "",
    reportNoGc: raw.gcReportNumber ?? "",
    reportNoConversion: raw.conversionReportNumber ?? "",
    trBpNo: raw.trBpNumber,
    mobileNo: raw.mobileNumber ?? "",
    customerName: raw.customerName,
    fullAddress: raw.fullAddress ?? "",
    scheme: raw.scheme ?? "",
    plumberName: raw.plumberName ?? "",
    supervisorName: raw.supervisorName ?? "",
    // master-import writes this into billingCompletion.jobCardDone, not a top-level column
    jobCardDone: String((raw.billingCompletion as Record<string, unknown> | null)?.jobCardDone ?? ""),
    connectionType: (raw.connectionType as CustomerConnectionDetails["connectionType"]) || "Domestic",
    houseType: raw.houseType ?? "",
  };

  const giMeasurements: GiMeasurements = {
    tfToRegulator: gi.tfToRegulator ?? "",
    inlet: gi.inlet ?? "",
    outlet: gi.outlet ?? "",
    totalGiPipeHalfInch: gi.totalGiPipeHalfInch ?? "",
    giPipeThreeQuarterInch: gi.giPipeThreeQuarterInch ?? "",
    giPipeOneInch: gi.giPipeOneInch ?? "",
    giPipeOneAndHalfInch: gi.giPipeOneAndHalfInch ?? "",
    giPipeTwoInch: gi.giPipeTwoInch ?? "",
  };

  const isolationFittings: IsolationFittings = {
    isolationValveHalfInch: valves.isolationValveHalfInch ?? "",
    isolationValveThreeQuarterInch: valves.isolationValveThreeQuarterInch ?? "",
    isolationValveOneInch: valves.isolationValveOneInch ?? "",
    isolationValveOneAndHalfInch: valves.isolationValveOneAndHalfInch ?? "",
    isolationValveTwoInch: valves.isolationValveTwoInch ?? "",
    applianceValveHalfInch: valves.applianceValveHalfInch ?? "",
    regulator6BarTo100Mbar: valves.regulator6BarTo100Mbar ?? "",
    regulator6BarTo21Mbar: valves.regulator6BarTo21Mbar ?? "",
    regulator100MbarTo21Mbar: valves.regulator100MbarTo21Mbar ?? "",
    warningPlate: valves.warningPlate ?? "",
    clampHalfInch: fittings.clampHalfInch ?? "",
    elbowHalfInch: fittings.elbowHalfInch ?? "",
    teeHalfInch: fittings.teeHalfInch ?? "",
    extraGiAbove10Metres: fittings.extraGiAbove10Metres ?? "",
  };

  const fittingsAccessories: FittingsAccessories = {
    clampHalfInch: fittings.clampHalfInch ?? "",
    clampThreeInchToHalfInch: fittings.clamp3InchToHalfInch ?? "",
    elbowHalfInch: fittings.elbowHalfInch ?? "",
    mfElbowHalfInch: fittings.mfElbowHalfInch ?? "",
    socketHalfInch: fittings.socketHalfInch ?? "",
    teeHalfInch: fittings.teeHalfInch ?? "",
    nippleTwoInch: fittings.nipple2Inch ?? "",
    nippleThreeInch: fittings.nipple3Inch ?? "",
    nippleFourInch: fittings.nipple4Inch ?? "",
    reducerElbowThreeQuarterToHalfInch: fittings.reducerElbowThreeQuarterToHalfInch ?? "",
    threeQuarterInchToThreeInch: fittings.threeQuarterInchTo3Inch ?? "",
    unionHalfInch: fittings.unionHalfInch ?? "",
    plugHalfInch: fittings.plugHalfInch ?? "",
    fittingsOneAndHalfInch: fittings.fittingsOneAndHalfInchQuantity ?? "",
    fittingsTwoInch: fittings.fittingsTwoInchQuantity ?? "",
  };

  const lmcPipelineWork: LmcPipelineWork = {
    pipeRecords: withAllPipeSizes(raw.lmcPipeRecords),
    fourMetresUnderGc: lmc.fourMetresUnderGc ?? "",
    fourMetresAboveGc: lmc.fourMetresAboveGc ?? "",
    tfHalfInch: lmc.tfHalfInch ?? "",
    tfOneInch: lmc.tfOneInch ?? "",
    pcc: lmc.pcc ?? "",
    rccNalaCrossing: lmc.rccNalaCrossing ?? "",
    paverBlocks: lmc.paverBlocks ?? "",
    malua: lmc.malua ?? "",
    hardRock: lmc.hardRock ?? "",
  };

  const mdpe = (raw.mdpeFittings as Partial<MdpeFittings> | null) ?? {};
  const mdpeFittings: MdpeFittings = {
    saddle90To32Mm: mdpe.saddle90To32Mm ?? "",
    saddle63To32Mm: mdpe.saddle63To32Mm ?? "",
    saddle32To20Mm: mdpe.saddle32To20Mm ?? "",
    tee90Mm: mdpe.tee90Mm ?? "",
    tee32Mm: mdpe.tee32Mm ?? "",
    tee20Mm: mdpe.tee20Mm ?? "",
    reducerCoupler90To63Mm: mdpe.reducerCoupler90To63Mm ?? "",
    reducerCoupler63To32Mm: mdpe.reducerCoupler63To32Mm ?? "",
    reducerCoupler32To20Mm: mdpe.reducerCoupler32To20Mm ?? "",
    coupler90Mm: mdpe.coupler90Mm ?? "",
    coupler32Mm: mdpe.coupler32Mm ?? "",
    coupler20Mm: mdpe.coupler20Mm ?? "",
    endCap90Mm: mdpe.endCap90Mm ?? "",
  };

  const commissioning = (raw.commissioningConversion as Partial<CommissioningConversion> | null) ?? {};
  const commissioningConversion: CommissioningConversion = {
    meterNo: commissioning.meterNo ?? "",
    installationDate: toDateOnly(commissioning.installationDate),
    commissioningDate: toDateOnly(commissioning.commissioningDate),
    conversionDate: toDateOnly(commissioning.conversionDate),
    regulatorPressure: commissioning.regulatorPressure ?? "",
    regulatorNo: commissioning.regulatorNo ?? "",
    meterType: commissioning.meterType ?? "",
    meterReading: commissioning.meterReading ?? "",
    nonConversionRemark: commissioning.nonConversionRemark ?? "",
  };

  const billing = (raw.billingCompletion as Partial<BillingCompletion> | null) ?? {};
  const billingCompletion: BillingCompletion = {
    paymentStatus: billing.paymentStatus ?? "Pending",
    paymentMode: billing.paymentMode ?? "",
    initialAmount: numOrEmpty(billing.initialAmount),
    jmrDone: billing.jmrDone ?? false,
    jmrSubmittedInPbg: billing.jmrSubmittedInPbg ?? false,
    giBillDone: billing.giBillDone ?? false,
    gcBillDone: billing.gcBillDone ?? false,
    conversionBillDone: billing.conversionBillDone ?? false,
    remark: billing.remark ?? "",
  };

  return {
    id: raw.id,
    status: STATUS_TO_MOBILE[raw.status] ?? "Pending",
    projectName: "",
    siteArea: raw.city ?? "",
    city: raw.city ?? "",
    createdDate: toDateOnly(raw.createdAt),
    customerConnection: connection,
    survey: survey
      ? {
          surveyId: String(survey.surveyId ?? ""),
          surveyDate: toDateOnly(survey.surveyDate as string),
          assignedSurveyor: String(survey.assignedSurveyor ?? ""),
          siteAccessibility: survey.siteAccessibility as string | undefined,
          meterPlacement: survey.meterPlacement as string | undefined,
          pipelineRoute: survey.pipelineRoute as string | undefined,
          civilWorkRequired: survey.civilWorkRequired as string | undefined,
          workableStatus: (survey.workableStatus as "Workable" | "Partially Workable" | "Not Workable") ?? "Workable",
          approvalStatus:
            (survey.approvalStatus as "Draft" | "Submitted" | "In Review" | "Approved" | "Sent Back" | "Rejected") ?? "Draft",
          initialMeasurements: String(survey.initialMeasurements ?? ""),
          obstaclesRemarks: String(survey.obstaclesRemarks ?? ""),
          notes: survey.notes as string | undefined,
          reason: survey.reason as string | undefined,
          recommendedAction: survey.recommendedAction as string | undefined,
          expectedResolutionDate: toDateOnly(survey.expectedResolutionDate as string),
          gpsLocation:
            survey.latitude != null && survey.longitude != null ? `${survey.latitude}, ${survey.longitude}` : "",
          photos: [],
          evidence: [],
        }
      : {
          surveyId: "",
          surveyDate: "",
          assignedSurveyor: "",
          workableStatus: "Workable",
          approvalStatus: "Draft",
          initialMeasurements: "",
          obstaclesRemarks: "",
          gpsLocation: "",
          photos: [],
        },
    giMeasurements,
    isolationFittings,
    fittingsAccessories,
    lmcPipelineWork,
    mdpeFittings,
    commissioningConversion,
    billingCompletion,
    documents: (raw.documents ?? []).map(mapDocument),
  };
}

export const customersService = {
  async list(search?: string): Promise<CustomerRecord[]> {
    const query = new URLSearchParams({ limit: "200" });
    if (search) query.set("search", search);
    const rows = await apiRequest<BackendCustomer[]>(`/customers?${query.toString()}`);
    return rows.map(mapCustomer);
  },

  async get(id: string): Promise<CustomerRecord> {
    const raw = await apiRequest<BackendCustomer>(`/customers/${id}`);
    return mapCustomer(raw);
  },

  async updateSurvey(id: string, survey: CustomerRecord["survey"]): Promise<CustomerRecord> {
    const [latitude, longitude] = (survey.gpsLocation || "")
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((value) => !Number.isNaN(value));

    const raw = await apiRequest<BackendCustomer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        survey: {
          surveyId: survey.surveyId,
          surveyDate: survey.surveyDate,
          assignedSurveyor: survey.assignedSurveyor,
          latitude,
          longitude,
          workableStatus: survey.workableStatus,
          approvalStatus: survey.approvalStatus,
          initialMeasurements: survey.initialMeasurements,
          siteAccessibility: survey.siteAccessibility,
          meterPlacement: survey.meterPlacement,
          pipelineRoute: survey.pipelineRoute,
          civilWorkRequired: survey.civilWorkRequired,
          obstaclesRemarks: survey.obstaclesRemarks,
          notes: survey.notes,
          reason: survey.reason,
          recommendedAction: survey.recommendedAction,
          expectedResolutionDate: survey.expectedResolutionDate,
        },
      }),
    });
    return mapCustomer(raw);
  },

  async updateGiMeasurements(id: string, giMeasurements: GiMeasurements): Promise<CustomerRecord> {
    const raw = await apiRequest<BackendCustomer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ giMeasurements }),
    });
    return mapCustomer(raw);
  },

  async updateIsolationRegulators(
    id: string,
    values: Pick<
      IsolationFittings,
      | "isolationValveHalfInch"
      | "isolationValveThreeQuarterInch"
      | "isolationValveOneInch"
      | "isolationValveOneAndHalfInch"
      | "isolationValveTwoInch"
      | "applianceValveHalfInch"
      | "regulator6BarTo100Mbar"
      | "regulator6BarTo21Mbar"
      | "regulator100MbarTo21Mbar"
      | "warningPlate"
    >,
  ): Promise<CustomerRecord> {
    const raw = await apiRequest<BackendCustomer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ valvesRegulators: values }),
    });
    return mapCustomer(raw);
  },

  async updateFittingsAccessories(id: string, values: FittingsAccessories): Promise<CustomerRecord> {
    const raw = await apiRequest<BackendCustomer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        fittingsAccessories: {
          clampHalfInch: values.clampHalfInch,
          clamp3InchToHalfInch: values.clampThreeInchToHalfInch,
          elbowHalfInch: values.elbowHalfInch,
          mfElbowHalfInch: values.mfElbowHalfInch,
          socketHalfInch: values.socketHalfInch,
          teeHalfInch: values.teeHalfInch,
          nipple2Inch: values.nippleTwoInch,
          nipple3Inch: values.nippleThreeInch,
          nipple4Inch: values.nippleFourInch,
          reducerElbowThreeQuarterToHalfInch: values.reducerElbowThreeQuarterToHalfInch,
          threeQuarterInchTo3Inch: values.threeQuarterInchToThreeInch,
          unionHalfInch: values.unionHalfInch,
          plugHalfInch: values.plugHalfInch,
          fittingsOneAndHalfInchQuantity: values.fittingsOneAndHalfInch,
          fittingsTwoInchQuantity: values.fittingsTwoInch,
        },
      }),
    });
    return mapCustomer(raw);
  },

  async updateCivilWork(id: string, values: Omit<LmcPipelineWork, "pipeRecords">): Promise<CustomerRecord> {
    const raw = await apiRequest<BackendCustomer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ lmcPipelineWork: values }),
    });
    return mapCustomer(raw);
  },

  async updateMdpeFittings(id: string, mdpeFittings: MdpeFittings): Promise<CustomerRecord> {
    const raw = await apiRequest<BackendCustomer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ mdpeFittings }),
    });
    return mapCustomer(raw);
  },

  async updateCommissioningConversion(id: string, values: CommissioningConversion): Promise<CustomerRecord> {
    const raw = await apiRequest<BackendCustomer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ commissioningConversion: values }),
    });
    return mapCustomer(raw);
  },

  async updateBilling(id: string, values: BillingCompletion): Promise<CustomerRecord> {
    const raw = await apiRequest<BackendCustomer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ billingCompletion: values }),
    });
    return mapCustomer(raw);
  },

  async upsertLmcPipeRecord(id: string, record: LmcPipeRecord): Promise<LmcPipeRecord> {
    const raw = await apiRequest<BackendLmcPipeRecord>(`/customers/${id}/lmc-pipes`, {
      method: "PUT",
      body: JSON.stringify({
        pipeSize: LMC_SIZE_TO_BACKEND[record.pipeSize] ?? "other",
        lengthMetres: record.lengthMetres || undefined,
        layingDate: record.layingDate || undefined,
        testingDate: record.testingDate || undefined,
        purgingDate: record.purgingDate || undefined,
        layingStatus: LAYING_TO_BACKEND[record.layingStatus] ?? "not_started",
        testingStatus: TESTING_TO_BACKEND[record.testingStatus] ?? "not_started",
        purgingStatus: PURGING_TO_BACKEND[record.purgingStatus] ?? "not_started",
        jointFittingDetails: record.jointFittingDetails || undefined,
        remarks: record.remarks || undefined,
        evidence: record.evidence?.length
          ? record.evidence.map((file) => ({ fileName: file.fileName }))
          : undefined,
      }),
    });
    return mapPipeRecord(raw);
  },
};
