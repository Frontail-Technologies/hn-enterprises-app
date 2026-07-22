import { customers, planningDprRecords, workProgressRecords } from '@/services/mockData';

export type SupervisorStatTone = 'blue' | 'orange' | 'green' | 'red';

export type SupervisorStat = {
  id: SupervisorStatId;
  label: string;
  value: string;
  suffix: string;
  tone: SupervisorStatTone;
};

export type SupervisorStatId =
  | 'survey-done'
  | 'gi-done'
  | 'gc-done'
  | 'laying'
  | 'valve-chamber'
  | 'pre-commissioning'
  | 'conversion-done'
  | 'jmr-done'
  | 'site-expenses-done'
  | 'flushing-testing'
  | 'route-marker'
  | 'commissioning'
  | 'dpr'
  | 'planning';

export type SupervisorStatDetailRow = {
  id: string;
  customerId?: string;
  title: string;
  reference: string;
  site: string;
  status:
    | 'Done'
    | 'Pending'
    | 'In Progress'
    | 'Sent Back'
    | 'Not Required'
    | 'Not Started'
    | 'On Hold'
    | 'Planned'
    | 'Delayed';
  updatedOn: string;
  helper: string;
};

const totalCustomers = customers.length;

function doneCount(predicate: (customer: (typeof customers)[number]) => boolean) {
  return customers.filter(predicate).length;
}

export function getSupervisorStats(): SupervisorStat[] {
  const surveyDone = doneCount((customer) => customer.survey.approvalStatus === 'Approved');
  const giDone = doneCount((customer) => Boolean(customer.giMeasurements.totalGiPipeHalfInch));
  const gcDone = doneCount((customer) => customer.billingCompletion.gcBillDone);
  const layingDone = doneCount((customer) =>
    customer.lmcPipelineWork.pipeRecords.some((pipe) => pipe.layingStatus === 'Completed'),
  );
  const valveChamberDone = doneCount((customer) =>
    Boolean(customer.lmcPipelineWork.pcc || customer.lmcPipelineWork.rccNalaCrossing),
  );
  const preCommissioningDone = doneCount((customer) => Boolean(customer.commissioningConversion.commissioningDate));
  const conversionDone = doneCount((customer) => Boolean(customer.commissioningConversion.conversionDate));
  const jmrDone = doneCount((customer) => customer.billingCompletion.jmrDone);
  const siteExpensesDone = doneCount((customer) => customer.billingCompletion.paymentStatus === 'Paid');
  const flushingTestingDone = workProgressRecords.filter((record) => record.currentStage === 'GC').length;
  const routeMarkerDone = customers.filter((customer) => customer.mdpeFittings.coupler20Mm).length;
  const commissioningDone = doneCount((customer) => Boolean(customer.commissioningConversion.commissioningDate));
  const dprDone = planningDprRecords.filter((record) => record.status === 'Completed').length;
  const planningDone = planningDprRecords.length;

  return [
    { id: 'survey-done', label: 'Survey Done', value: `${surveyDone}/${totalCustomers}`, suffix: 'Customers', tone: 'green' },
    { id: 'gi-done', label: 'GI Done', value: `${giDone}/${totalCustomers}`, suffix: 'Customers', tone: 'blue' },
    { id: 'gc-done', label: 'GC Done', value: `${gcDone}/${totalCustomers}`, suffix: 'Customers', tone: 'orange' },
    { id: 'laying', label: 'Laying', value: `${layingDone}/${totalCustomers}`, suffix: 'Customers', tone: 'blue' },
    { id: 'valve-chamber', label: 'Valve Chamber', value: `${valveChamberDone}/${totalCustomers}`, suffix: 'Customers', tone: 'orange' },
    { id: 'pre-commissioning', label: 'Pre Commissioning', value: `${preCommissioningDone}/${totalCustomers}`, suffix: 'Customers', tone: 'green' },
    { id: 'conversion-done', label: 'Conversion Done', value: `${conversionDone}/${totalCustomers}`, suffix: 'Customers', tone: 'orange' },
    { id: 'jmr-done', label: 'JMR Done', value: `${jmrDone}/${totalCustomers}`, suffix: 'Customers', tone: 'blue' },
    { id: 'site-expenses-done', label: 'Site Expenses Done', value: `${siteExpensesDone}/${totalCustomers}`, suffix: 'Customers', tone: 'red' },
    { id: 'flushing-testing', label: 'Flushing / Testing', value: String(flushingTestingDone), suffix: 'Records', tone: 'blue' },
    { id: 'route-marker', label: 'Route Marker / Pole Marker', value: String(routeMarkerDone), suffix: 'Customers', tone: 'orange' },
    { id: 'commissioning', label: 'Commissioning', value: `${commissioningDone}/${totalCustomers}`, suffix: 'Customers', tone: 'green' },
    { id: 'dpr', label: 'DPR', value: String(dprDone), suffix: 'Completed', tone: 'blue' },
    { id: 'planning', label: 'Planning', value: String(planningDone), suffix: 'Plans', tone: 'orange' },
  ];
}

export function getSupervisorStatById(statId: string) {
  return getSupervisorStats().find((stat) => stat.id === statId) ?? null;
}

export function getSupervisorStatDetails(statId: string): SupervisorStatDetailRow[] {
  if (statId === 'dpr' || statId === 'planning') {
    return planningDprRecords.map((record) => ({
      id: record.id,
      title: record.activity,
      reference: record.projectName,
      site: record.siteArea,
      status: record.status === 'Completed' ? 'Done' : record.status,
      updatedOn: record.date,
      helper: statId === 'dpr' ? `${record.completedQty} completed` : `${record.plannedQty} planned`,
    }));
  }

  if (statId === 'flushing-testing') {
    return workProgressRecords
      .filter((record) => record.currentStage === 'GC' || record.nextRequiredAction.toLowerCase().includes('testing'))
      .map((record) => ({
        id: record.id,
        customerId: record.customerId,
        title: record.customerName,
        reference: record.bpTrNumber,
        site: record.siteArea,
        status: record.status === 'Completed' ? 'Done' : record.status,
        updatedOn: record.lastUpdated,
        helper: record.nextRequiredAction,
      }));
  }

  return customers.map((customer) => {
    const base = {
      id: `${statId}-${customer.id}`,
      customerId: customer.id,
      title: customer.customerConnection.customerName,
      reference: customer.customerConnection.trBpNo,
      site: customer.siteArea,
      updatedOn: customer.createdDate,
    };

    if (statId === 'survey-done') {
      const done = customer.survey.approvalStatus === 'Approved';
      return { ...base, status: done ? 'Done' : customer.survey.approvalStatus === 'Sent Back' ? 'Sent Back' : 'Pending', updatedOn: customer.survey.surveyDate, helper: customer.survey.workableStatus };
    }
    if (statId === 'gi-done') {
      const done = Boolean(customer.giMeasurements.totalGiPipeHalfInch);
      return { ...base, status: done ? 'Done' : 'Pending', updatedOn: customer.commissioningConversion.installationDate || customer.createdDate, helper: `GI: ${customer.giMeasurements.totalGiPipeHalfInch || '-'} m` };
    }
    if (statId === 'gc-done') {
      return { ...base, status: customer.billingCompletion.gcBillDone ? 'Done' : 'Pending', helper: customer.billingCompletion.remark };
    }
    if (statId === 'laying') {
      const activePipe = customer.lmcPipelineWork.pipeRecords.find((pipe) => pipe.layingStatus !== 'Not Required');
      return { ...base, status: activePipe?.layingStatus === 'Completed' ? 'Done' : activePipe?.layingStatus === 'In Progress' ? 'In Progress' : 'Pending', updatedOn: activePipe?.layingDate || customer.createdDate, helper: activePipe ? `${activePipe.pipeSize} : ${activePipe.lengthMetres} m` : 'No laying required' };
    }
    if (statId === 'valve-chamber') {
      const done = Boolean(customer.lmcPipelineWork.pcc || customer.lmcPipelineWork.rccNalaCrossing);
      return { ...base, status: done ? 'Done' : 'Pending', helper: `PCC ${customer.lmcPipelineWork.pcc || '-'} / RCC ${customer.lmcPipelineWork.rccNalaCrossing || '-'}` };
    }
    if (statId === 'pre-commissioning' || statId === 'commissioning') {
      const done = Boolean(customer.commissioningConversion.commissioningDate);
      return { ...base, status: done ? 'Done' : 'Pending', updatedOn: customer.commissioningConversion.commissioningDate || customer.createdDate, helper: customer.commissioningConversion.regulatorPressure || '-' };
    }
    if (statId === 'conversion-done') {
      const done = Boolean(customer.commissioningConversion.conversionDate);
      return { ...base, status: done ? 'Done' : 'Pending', updatedOn: customer.commissioningConversion.conversionDate || customer.createdDate, helper: customer.commissioningConversion.nonConversionRemark || '-' };
    }
    if (statId === 'jmr-done') {
      return { ...base, status: customer.billingCompletion.jmrDone ? 'Done' : 'Pending', helper: customer.billingCompletion.jmrSubmittedInPbg ? 'Submitted in PBG' : 'Not submitted' };
    }
    if (statId === 'site-expenses-done') {
      return { ...base, status: customer.billingCompletion.paymentStatus === 'Paid' ? 'Done' : 'Pending', helper: `${customer.billingCompletion.paymentMode} : Rs. ${customer.billingCompletion.initialAmount}` };
    }
    if (statId === 'route-marker') {
      const done = Boolean(customer.mdpeFittings.coupler20Mm);
      return { ...base, status: done ? 'Done' : 'Pending', helper: `Coupler 20 mm: ${customer.mdpeFittings.coupler20Mm || '-'}` };
    }

    return { ...base, status: 'Pending', helper: '-' };
  });
}
