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

  const byActionGainedHistoryQuery = useRewardPointsHistoryByAction(
    'gained',
    fieldsHistory
  );

  const byActionSpentHistoryQuery = useRewardPointsHistoryByAction(
    'spent',
    fieldsHistory
  );

  const loadedRewardPoints =
    roleName !== 'client'
      ? allPointsQuery.data
      : byUsernameQuery.data;

  const refetchRewardPoints =
    roleName !== 'client'
      ? allPointsQuery.refetch
      : byUsernameQuery.refetch;

  const loadingRewardPoints =
    roleName !== 'client'
      ? allPointsQuery.loading
      : byUsernameQuery.loading;

  const errorRewardPoints =
    roleName !== 'client'
      ? allPointsQuery.error
      : byUsernameQuery.error;

  const loadedRewardPointsHistory = 
    roleName !== 'client'
      ? historyQuery.data
      : byActionHistoryQuery.data;

  const loadedRewardPointsGainedHistory = 
    roleName !== 'client'
      ? null
      : byActionGainedHistoryQuery.data;

  const loadedRewardPointsSpentHistory = 
    roleName !== 'client'
      ? null
      : byActionSpentHistoryQuery.data;

  const refetchRewardPointsHistory = 
    roleName !== 'client'
      ? historyQuery.refetch
      : byActionHistoryQuery.refetch;

  const refetchRewardPointsGainedHistory = 
    roleName !== 'client'
      ? null
      : byActionGainedHistoryQuery.refetch;

  const refetchRewardPointsSpentHistory = 
    roleName !== 'client'
      ? null
      : byActionSpentHistoryQuery.refetch;

  const loadingRewardPointsHistory = 
    roleName !== 'client'
      ? historyQuery.loading
      : byActionHistoryQuery.loading;

  const errorRewardPointsHistory = 
    roleName !== 'client'
      ? historyQuery.error
      : byActionHistoryQuery.error;

  const loadingRewardPointsGainedHistory = 
    roleName !== 'client'
      ? null
      : byActionGainedHistoryQuery.loading;

  const errorRewardPointsGainedHistory = 
    roleName !== 'client'
      ? null
      : byActionGainedHistoryQuery.error;

  const loadingRewardPointsSpentHistory = 
    roleName !== 'client'
      ? null
      : byActionSpentHistoryQuery.loading;

  const errorRewardPointsSpentHistory =
    roleName !== 'client'
      ? null
      : byActionSpentHistoryQuery.error;

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
      loadedRewardPointsGainedHistory,
      refetchRewardPointsGainedHistory,
      loadingRewardPointsGainedHistory,
      errorRewardPointsGainedHistory,
      loadedRewardPointsSpentHistory,
      refetchRewardPointsSpentHistory,
      loadingRewardPointsSpentHistory,
      errorRewardPointsSpentHistory,
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
      loadedRewardPointsGainedHistory,
      refetchRewardPointsGainedHistory,
      loadingRewardPointsGainedHistory,
      errorRewardPointsGainedHistory,
      loadedRewardPointsSpentHistory,
      refetchRewardPointsSpentHistory,
      loadingRewardPointsSpentHistory,
      errorRewardPointsSpentHistory,
    ]
  );

  return (
    <RewardPointsContext.Provider value={value}>
      {children}
    </RewardPointsContext.Provider>
  );
}