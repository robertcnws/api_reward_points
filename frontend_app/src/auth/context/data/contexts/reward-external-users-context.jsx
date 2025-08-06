import React, { useMemo, useContext, createContext } from 'react';

import { useRewardExternalUserByUsername } from 'src/_mock/__reward-login-users';

import { fieldsExternalUsers } from '../field-descriptors/field-descriptors-login-users';
// import { useFilteredLoginUsers } from '../hooks/use-filtered-user-roles';

const RewardExternalUsersContext = createContext();
export const useRewardExternalUsers = () => useContext(RewardExternalUsersContext);

export function RewardExternalUsersProvider({ children }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const usernameLogged = useMemo(() => {
    const user = userLogged?.data;
    return user?.username || '';
  }, [userLogged]);

  const fields = useMemo(() => fieldsExternalUsers, []);

  const externalUserQuery = useRewardExternalUserByUsername(usernameLogged, fields);

  const externalUser = useMemo(
    () => externalUserQuery.data || {},
    [externalUserQuery.data]
  );

  const refetchExternalUser = useMemo(
    () => (usernameLogged !== '') ? externalUserQuery.refetch : () => {},
    [externalUserQuery, usernameLogged]
  );

  const loadingExternalUser = usernameLogged !== '' ?
    externalUserQuery.loading : false;

  const errorExternalUser = usernameLogged !== '' ?
    externalUserQuery.error : null;

  const value = useMemo(
    () => ({
      externalUser,
      refetchExternalUser,
      loadingExternalUser,
      errorExternalUser,
    }),
    [
      externalUser,
      refetchExternalUser,
      loadingExternalUser,
      errorExternalUser,
    ]
  );

  return (
    <RewardExternalUsersContext.Provider value={value}>
      {children}
    </RewardExternalUsersContext.Provider>
  );
}