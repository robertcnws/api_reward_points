import React, { useMemo, useContext, createContext } from 'react';

import { useRewardPointsByUsername, useAllRewardPoints } from 'src/_mock/__reward-points';

import { useRewardPointsHistoryByAction, useRewardPointsHistoryByRewardPointsId } from 'src/_mock/__reward-points-history';
import { fieldsRewardPoints, fieldsRewardPointsHistory } from '../field-descriptors/field-descriptors-reward-points';

const RewardPointsContext = createContext();
export const useRewardPoints = () => useContext(RewardPointsContext);

export function RewardPointsProvider({ children }) {

  const fields = useMemo(() => fieldsRewardPoints, []);
  const fieldsHistory = useMemo(() => fieldsRewardPointsHistory, []);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const roleName = useMemo(() => {
    const user = userLogged?.data;
    return user?.user_role ? user.user_role.name : '';
  }, [userLogged]);

  const byUsernameQuery = useRewardPointsByUsername(
    userLogged?.data?.username,
    fields
  );
  const allPointsQuery = useAllRewardPoints(fields);
  const historyQuery = useRewardPointsHistoryByRewardPointsId(
    roleName !== 'admin' && roleName !== 'superadmin'
      ? byUsernameQuery.data?.id
      : null,
    fieldsHistory
  );

  const byActionHistoryQuery = useRewardPointsHistoryByAction(
    'refunded', 
    fieldsHistory
  );

  const loadedRewardPoints =
    roleName === 'admin' || roleName === 'superadmin'
      ? allPointsQuery.data
      : byUsernameQuery.data;

  const refetchRewardPoints =
    roleName === 'admin' || roleName === 'superadmin'
      ? allPointsQuery.refetch
      : byUsernameQuery.refetch;

  const loadingRewardPoints =
    roleName === 'admin' || roleName === 'superadmin'
      ? allPointsQuery.loading
      : byUsernameQuery.loading;

  const errorRewardPoints =
    roleName === 'admin' || roleName === 'superadmin'
      ? allPointsQuery.error
      : byUsernameQuery.error;

  const loadedRewardPointsHistory = 
    roleName !== 'admin' && roleName !== 'superadmin'
      ? historyQuery.data
      : byActionHistoryQuery.data;

  const refetchRewardPointsHistory = 
    roleName !== 'admin' && roleName !== 'superadmin'
      ? historyQuery.refetch
      : byActionHistoryQuery.refetch;

  const loadingRewardPointsHistory = 
    roleName !== 'admin' && roleName !== 'superadmin'
      ? historyQuery.loading
      : byActionHistoryQuery.loading;

  const errorRewardPointsHistory = 
    roleName !== 'admin' && roleName !== 'superadmin'
      ? historyQuery.error
      : byActionHistoryQuery.error;

  const value = useMemo(
    () => ({
      loadedRewardPoints,
      refetchRewardPoints,
      loadingRewardPoints,
      errorRewardPoints,
      loadedRewardPointsHistory,
      refetchRewardPointsHistory,
      loadingRewardPointsHistory,
      errorRewardPointsHistory,
    }),
    [
      loadedRewardPoints,
      refetchRewardPoints,
      loadingRewardPoints,
      errorRewardPoints,
      loadedRewardPointsHistory,
      refetchRewardPointsHistory,
      loadingRewardPointsHistory,
      errorRewardPointsHistory,
    ]
  );

  return (
    <RewardPointsContext.Provider value={value}>
      {children}
    </RewardPointsContext.Provider>
  );
}