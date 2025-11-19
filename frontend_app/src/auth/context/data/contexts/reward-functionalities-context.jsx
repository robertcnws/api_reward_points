import React, { useMemo, useContext, createContext } from 'react';

import { useRewardLastMonthFunctionalities } from 'src/_mock/__reward-functionalities';

import { fieldsFunctionalities } from '../field-descriptors/field-descriptors-functionalities';

const RewardFunctionalitiesContext = createContext();
export const useRewardFunctionalities = () => useContext(RewardFunctionalitiesContext);

export function RewardFunctionalitiesProvider({ children }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const fields = useMemo(() => fieldsFunctionalities, []);
  const rewardLastMonthFunctionalitiesQuery = useRewardLastMonthFunctionalities(fields);

  const loadedAllRewardFunctionalities = useMemo(
    () => rewardLastMonthFunctionalitiesQuery.data || [],
    [rewardLastMonthFunctionalitiesQuery.data]
  );

  const refetchAllRewardFunctionalities = useMemo(
    () => rewardLastMonthFunctionalitiesQuery.refetch,
    [rewardLastMonthFunctionalitiesQuery]
  );

  const loadingAllRewardFunctionalities = rewardLastMonthFunctionalitiesQuery.loading;

  const errorRewardFunctionalities = rewardLastMonthFunctionalitiesQuery.error;

  const value = useMemo(
    () => ({
      loadedAllRewardFunctionalities,
      refetchAllRewardFunctionalities,
      loadingAllRewardFunctionalities,
      errorRewardFunctionalities,
    }),
    [
      loadedAllRewardFunctionalities,
      refetchAllRewardFunctionalities,
      loadingAllRewardFunctionalities,
      errorRewardFunctionalities,
    ]
  );

  return (
    <RewardFunctionalitiesContext.Provider value={value}>
      {children}
    </RewardFunctionalitiesContext.Provider>
  );
}