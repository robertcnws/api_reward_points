import React, { useMemo, useContext, createContext } from 'react';

import { useAllRewardLoginUsers } from 'src/_mock/__reward-login-users';

import { fieldsLoginUsers } from '../field-descriptors/field-descriptors-login-users';
// import { useFilteredLoginUsers } from '../hooks/use-filtered-user-roles';

const RewardLoginUsersContext = createContext();
export const useRewardLoginUsers = () => useContext(RewardLoginUsersContext);

export function RewardLoginUsersProvider({ children }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const roleName = useMemo(() => {
    const user = userLogged?.data;
    return user?.user_role ? user.user_role.name : '';
  }, [userLogged]);

  const fields = useMemo(() => fieldsLoginUsers, []);

  const allLoginUsersQuery = useAllRewardLoginUsers(fields);

  const listAllRewardLoginUsers = useMemo(
    () => (roleName === 'admin' || roleName === 'superadmin') ? 
    allLoginUsersQuery.data : [],
    [allLoginUsersQuery.data, roleName]
  );

  const refetchAllRewardLoginUsers = useMemo(
    () => (roleName === 'admin' || roleName === 'superadmin') ? allLoginUsersQuery.refetch : () => {},
    [allLoginUsersQuery, roleName]
  );

  const loadingAllRewardLoginUsers = roleName === 'admin' || roleName === 'superadmin' ?
    allLoginUsersQuery.loading : false;

  const errorRewardLoginUsers = roleName === 'admin' || roleName === 'superadmin' ?
    allLoginUsersQuery.error : null;

  const loadedAllRewardLoginUsers = useMemo(
    () => listAllRewardLoginUsers.filter(user => user.isApproved), 
    [listAllRewardLoginUsers]
  );

  const loadedPendingRewardLoginUsers = useMemo(
    () => listAllRewardLoginUsers.filter(user => !user.isApproved),
    [listAllRewardLoginUsers]
  );

  const value = useMemo(
    () => ({
      listAllRewardLoginUsers,
      loadedAllRewardLoginUsers,
      loadedPendingRewardLoginUsers,
      refetchAllRewardLoginUsers,
      loadingAllRewardLoginUsers,
      errorRewardLoginUsers,
    }),
    [
      listAllRewardLoginUsers,
      loadedAllRewardLoginUsers,
      loadedPendingRewardLoginUsers,
      refetchAllRewardLoginUsers,
      loadingAllRewardLoginUsers,
      errorRewardLoginUsers,
    ]
  );

  return (
    <RewardLoginUsersContext.Provider value={value}>
      {children}
    </RewardLoginUsersContext.Provider>
  );
}