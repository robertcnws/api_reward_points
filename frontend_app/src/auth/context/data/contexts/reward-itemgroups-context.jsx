import React, { useMemo, useContext, createContext } from 'react';
import { CONFIG } from 'src/config-global';
import { useRewardItemgroupsByZohoOrgId } from 'src/_mock/__reward-itemgroups';

import { fieldsRewardItemGroups } from '../field-descriptors/field-descriptors-reward-itemgroups';



const RewardItemgroupsContext = createContext();
export const useRewardItemgroups = () => useContext(RewardItemgroupsContext);

export function RewardItemgroupsProvider({ children }) {

  const fields = useMemo(() => fieldsRewardItemGroups, []);

  const zohoOrgId = CONFIG.zohoOrgIds.nws;

  const allItemgroupsQuery = useRewardItemgroupsByZohoOrgId(zohoOrgId, fields);

  const loadedAllRewardItemgroups = allItemgroupsQuery.data;

  const refetchAllRewardItemgroups = allItemgroupsQuery.refetch;

  const loadingAllRewardItemgroups = allItemgroupsQuery.loading || false;

  const errorRewardItemgroups = allItemgroupsQuery.error || null;

  const value = useMemo(
    () => ({
      loadedAllRewardItemgroups,
      refetchAllRewardItemgroups,
      loadingAllRewardItemgroups,
      errorRewardItemgroups,
    }),
    [
      loadedAllRewardItemgroups,
      refetchAllRewardItemgroups,
      loadingAllRewardItemgroups,
      errorRewardItemgroups,
    ]
  );

  return (
    <RewardItemgroupsContext.Provider value={value}>
      {children}
    </RewardItemgroupsContext.Provider>
  );
}