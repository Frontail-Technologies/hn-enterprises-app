export type DprTaskId =
  | 'survey'
  | 'gi'
  | 'gc'
  | 'laying'
  | 'valve'
  | 'pre'
  | 'conversion'
  | 'jmr'
  | 'testing'
  | 'route'
  | 'commissioning';

export type DprTaskTemplate = {
  id: DprTaskId;
  label: string;
};

export const dprTaskTemplates: DprTaskTemplate[] = [
  { id: 'survey', label: 'SURVEY' },
  { id: 'gi', label: 'GI' },
  { id: 'gc', label: 'GC' },
  { id: 'laying', label: 'LAYING' },
  { id: 'valve', label: 'VALVE CHAMBER' },
  { id: 'pre', label: 'PREE COMMISING' },
  { id: 'conversion', label: 'CONVERSION' },
  { id: 'jmr', label: 'JMR' },
  { id: 'testing', label: 'FLUSSHING/TESTING' },
  { id: 'route', label: 'ROUTE MARKER/POLE MARKER' },
  { id: 'commissioning', label: 'COMMISSING' },
];
