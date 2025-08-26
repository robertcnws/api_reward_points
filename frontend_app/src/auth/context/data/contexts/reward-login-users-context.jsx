import React, { useMemo, useContext, createContext } from 'react';
import { isOfficeStaff } from 'src/utils/check-permissions';

import { useAllRewardLoginUsers, useRewardLoginUserByUsername } from 'src/_mock/__reward-login-users';

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
    () => (roleName !== 'client') ? 
    allLoginUsersQuery.data : [],
    [allLoginUsersQuery.data, roleName]
  );

  const refetchAllRewardLoginUsers = useMemo(
    () => (roleName !== 'client') ? allLoginUsersQuery.refetch : () => {},
    [allLoginUsersQuery, roleName]
  );

  const loadingAllRewardLoginUsers = roleName !== 'client' ?
    allLoginUsersQuery.loading : false;

  const errorRewardLoginUsers = roleName !== 'client' ?
    allLoginUsersQuery.error : null;

  const loadedAllRewardLoginUsers = useMemo(
    () => listAllRewardLoginUsers.filter(user => user.isApproved), 
    [listAllRewardLoginUsers]
  );

  const loadedPendingRewardLoginUsers = useMemo(
    () => listAllRewardLoginUsers.filter(user => !user.isApproved),
    [listAllRewardLoginUsers]
  );

  const userByUsernameQuery = useRewardLoginUserByUsername(userLogged?.data?.username, fields);

  const userByUsername = useMemo(
    () => userByUsernameQuery.data,
    [userByUsernameQuery.data]
  );

  const refetchUserByUsername = useMemo(
    () => userByUsernameQuery.refetch,
    [userByUsernameQuery]
  );

  const loadingUserByUsername = userByUsernameQuery.loading;

  const errorUserByUsername = userByUsernameQuery.error;

  const allUsers = useMemo(() => allLoginUsersQuery.data, [allLoginUsersQuery.data]);

  const loadedAllRewardOfficeStaffUsers = useMemo(
    () => allUsers.filter(user => isOfficeStaff(user?.userRole?.name)),
    [allUsers]
  );

  const value = useMemo(
    () => ({
      listAllRewardLoginUsers,
      loadedAllRewardLoginUsers,
      loadedPendingRewardLoginUsers,
      loadedAllRewardOfficeStaffUsers,
      refetchAllRewardLoginUsers,
      loadingAllRewardLoginUsers,
      errorRewardLoginUsers,
      userByUsername,
      refetchUserByUsername,
      loadingUserByUsername,
      errorUserByUsername,
    }),
    [
      listAllRewardLoginUsers,
      loadedAllRewardLoginUsers,
      loadedPendingRewardLoginUsers,
      loadedAllRewardOfficeStaffUsers,
      refetchAllRewardLoginUsers,
      loadingAllRewardLoginUsers,
      errorRewardLoginUsers,
      userByUsername,
      refetchUserByUsername,
      loadingUserByUsername,
      errorUserByUsername,
    ]
  );

  return (
    <RewardLoginUsersContext.Provider value={value}>
      {children}
    </RewardLoginUsersContext.Provider>
  );
}