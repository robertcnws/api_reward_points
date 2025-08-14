import React, { useMemo, useContext, createContext } from 'react';

import { useAllRewardJoyRides } from 'src/_mock/__reward-joy-rides';

import { fieldsJoyRides } from '../field-descriptors/field-descriptors-joy-rides';

const RewardJoyRidesContext = createContext();
export const useRewardJoyRides = () => useContext(RewardJoyRidesContext);

export function RewardJoyRidesProvider({ children }) {

  const fields = useMemo(() => fieldsJoyRides, []);

  const allJoyRidesQuery = useAllRewardJoyRides(fields);

  const loadedAllRewardJoyRides =  allJoyRidesQuery.data

  const refetchAllRewardJoyRides = useMemo(() => allJoyRidesQuery.refetch, [allJoyRidesQuery]);

  const loadingAllRewardJoyRides = allJoyRidesQuery.loading;

  const errorAllRewardJoyRides = allJoyRidesQuery.error;

  const value = useMemo(
    () => ({
      loadedAllRewardJoyRides,
      refetchAllRewardJoyRides,
      loadingAllRewardJoyRides,
      errorAllRewardJoyRides,
    }),
    [
      loadedAllRewardJoyRides,
      refetchAllRewardJoyRides,
      loadingAllRewardJoyRides,
      errorAllRewardJoyRides,
    ]
  );

  return (
    <RewardJoyRidesContext.Provider value={value}>
      {children}
    </RewardJoyRidesContext.Provider>
  );
}