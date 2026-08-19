import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/Button";
import { ComplaintListItem } from "@/components/shared/ComplaintListItem";
import { ComplaintUpdateSheet } from "@/components/complaints/ComplaintUpdateSheet";
import { useComplaintsQuery } from "@/queries/complaints.queries";
import type { CustomerRecord } from "@/types/customers";
import type { ComplaintRecord } from "@/services/complaints.service";
import { EmptyState } from "@/components/ui/EmptyState";

export function useCustomerComplaintsPanel(customer: CustomerRecord) {
  const { colors } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  
  const { data: allComplaints = [], isLoading, isError, refetch } = useComplaintsQuery();
  const complaints = allComplaints.filter((c: ComplaintRecord) => c.customerId === customer.id);

  const content = (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : isError ? (
        <EmptyState
          title="Failed to load"
          description="Could not load complaints"
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      ) : complaints.length === 0 ? (
        <EmptyState
          title="No complaints"
          description="There are no complaints for this customer."
        />
      ) : (
        <View style={styles.list}>
          {complaints.map((complaint: ComplaintRecord) => (
            <ComplaintListItem 
              key={complaint.id} 
              complaint={complaint} 
              onPress={() => {
                setSelectedComplaint(complaint);
                setSheetOpen(true);
              }} 
            />
          ))}
        </View>
      )}

      <ComplaintUpdateSheet
        visible={sheetOpen}
        complaint={selectedComplaint}
        onClose={() => {
          setSheetOpen(false);
          setSelectedComplaint(null);
        }}
      />
    </View>
  );

  return { content, footer: null };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    gap: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  button: {
    width: "100%",
  },
});
