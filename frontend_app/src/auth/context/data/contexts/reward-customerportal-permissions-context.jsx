import React, { useMemo, useContext, createContext } from 'react';

import { useAllRewardCustomerportalPermissions } from 'src/_mock/__reward-customerportal-permissions';

import { fieldsCustomerportalPermissions } from '../field-descriptors/field-descriptors-customerportal-permissions';

const RewardCustomerportalPermissionsContext = createContext();
export const useRewardCustomerportalPermissions = () => useContext(RewardCustomerportalPermissionsContext);

export function RewardCustomerportalPermissionsProvider({ children }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const fields = useMemo(() => fieldsCustomerportalPermissions, []);

  const allCustomerportalPermissionsQuery = useAllRewardCustomerportalPermissions(fields);

  const loadedAllRewardCustomerportalPermissions = useMemo(
    () => allCustomerportalPermissionsQuery.data || [],
    [allCustomerportalPermissionsQuery.data]
  );

  const refetchAllRewardCustomerportalPermissions = useMemo(
    () => allCustomerportalPermissionsQuery.refetch,
    [allCustomerportalPermissionsQuery]
  );

  const loadingAllRewardCustomerportalPermissions = allCustomerportalPermissionsQuery.loading;

  const errorRewardCustomerportalPermissions = allCustomerportalPermissionsQuery.error;

  const value = useMemo(
    () => ({
      loadedAllRewardCustomerportalPermissions,
      refetchAllRewardCustomerportalPermissions,
      loadingAllRewardCustomerportalPermissions,
      errorRewardCustomerportalPermissions,
    }),
    [
      loadedAllRewardCustomerportalPermissions,
      refetchAllRewardCustomerportalPermissions,
      loadingAllRewardCustomerportalPermissions,
      errorRewardCustomerportalPermissions,
    ]
  );

  return (
    <RewardCustomerportalPermissionsContext.Provider value={value}>
      {children}
    </RewardCustomerportalPermissionsContext.Provider>
  );
}