import { KeyValueSection } from '@/components/shared/KeyValueSection';
import type { CustomerRecord } from '@/services/mockData';

export function useCustomerInfoPanel(customer: CustomerRecord) {
  const connection = customer.customerConnection;

  const content = (
    <KeyValueSection
      title="Customer Information"
      items={[
        { label: 'Customer Name', value: connection.customerName },
        { label: 'Mobile Number', value: connection.mobileNo },
        { label: 'BP / TR Number', value: connection.trBpNo },
        { label: 'Project', value: customer.projectName },
        { label: 'Site / Area', value: customer.siteArea },
        { label: 'Address', value: connection.fullAddress },
        { label: 'Connection Type', value: connection.connectionType },
        { label: 'Assigned Plumber', value: connection.plumberName },
        { label: 'Assigned Supervisor', value: connection.supervisorName },
      ]}
    />
  );

  return { content, footer: undefined };
}
