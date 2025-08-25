import React, { useMemo, useContext, createContext } from 'react';

import { useAllRewardIntroSteps } from 'src/_mock/__reward-intro-steps';

import { fieldsIntroSteps } from '../field-descriptors/field-descriptors-intro-steps';

const RewardIntroStepsContext = createContext();
export const useRewardIntroSteps = () => useContext(RewardIntroStepsContext);

export function RewardIntroStepsProvider({ children }) {

  const fields = useMemo(() => fieldsIntroSteps, []);

  const allIntroStepsQuery = useAllRewardIntroSteps(fields);

  const loadedAllRewardIntroSteps =  allIntroStepsQuery.data

  const refetchAllRewardIntroSteps = useMemo(() => allIntroStepsQuery.refetch, [allIntroStepsQuery]);

  const loadingAllRewardIntroSteps = allIntroStepsQuery.loading;

  const errorAllRewardIntroSteps = allIntroStepsQuery.error;

  const value = useMemo(
    () => ({
      loadedAllRewardIntroSteps,
      refetchAllRewardIntroSteps,
      loadingAllRewardIntroSteps,
      errorAllRewardIntroSteps,
    }),
    [
      loadedAllRewardIntroSteps,
      refetchAllRewardIntroSteps,
      loadingAllRewardIntroSteps,
      errorAllRewardIntroSteps,
    ]
  );

  return (
    <RewardIntroStepsContext.Provider value={value}>
      {children}
    </RewardIntroStepsContext.Provider>
  );
}