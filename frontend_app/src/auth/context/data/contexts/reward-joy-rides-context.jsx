import React, { useMemo, useContext, createContext } from 'react';

import { useAllRewardJoyRides } from 'src/_mock/__reward-joy-rides';

import { fieldsJoyRides } from '../field-descriptors/field-descriptors-joy-rides';

const RewardJoyRidesContext = createContext();
export const useRewardJoyRides = () => useContext(RewardJoyRidesContext);

export function RewardJoyRidesProvider({ children }) {

  const fields = useMemo(() => fieldsJoyRides, []);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const roleName = useMemo(() => {
    const user = userLogged?.data;
    return user?.user_role ? user.user_role.name : '';
  }, [userLogged]);

  const allJoyRidesQuery = useAllRewardJoyRides(fields);

  const initialAllRewardJoyRides = allJoyRidesQuery.data

  const loadedAllRewardJoyRides = useMemo(() => {
    if (initialAllRewardJoyRides && initialAllRewardJoyRides.length > 0) {
      return initialAllRewardJoyRides.filter(
        (step) => step.role?.includes(roleName) || step.role === 'all'
      );
    }
    return [];
  }, [initialAllRewardJoyRides, roleName]);

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