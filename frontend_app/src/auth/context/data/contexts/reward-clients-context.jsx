import React, { useMemo, useContext, createContext } from 'react';
import { useAllRewardClients } from 'src/_mock/__reward-clients';

import { fieldsClients } from '../field-descriptors/field-descriptors-clients';


const RewardClientsContext = createContext();
export const useRewardClients = () => useContext(RewardClientsContext);

export function RewardClientsProvider({ children }) {

  const fields = useMemo(() => fieldsClients, []);

  const allItemsQuery = useAllRewardClients(fields);

  const loadedAllRewardClients = allItemsQuery.data;

  const refetchAllRewardClients = allItemsQuery.refetch;

  const loadingAllRewardClients = allItemsQuery.loading || false;

  const errorRewardClients = allItemsQuery.error || null;

  const loadedPendingRewardClients = useMemo(
    () => loadedAllRewardClients?.filter(client => !client.isApproved && client.isVerified) || [],
    [loadedAllRewardClients]
  );

  const value = useMemo(
    () => ({
      loadedAllRewardClients,
      loadedPendingRewardClients,
      refetchAllRewardClients,
      loadingAllRewardClients,
      errorRewardClients,
    }),
    [
      loadedAllRewardClients,
      loadedPendingRewardClients,
      refetchAllRewardClients,
      loadingAllRewardClients,
      errorRewardClients,
    ]
  );

  return (
    <RewardClientsContext.Provider value={value}>
      {children}
    </RewardClientsContext.Provider>
  );
}