import React, { useCallback, useMemo } from 'react';

import { useDataContext } from 'src/auth/context/data/data-context';

import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { WelcomeTypography } from '../welcome-typography';
import { OverviewEcommerceView } from '../../e-commerce/view';
import { OverviewAdminView } from '../../admin/view';



export function OverviewAnalyticsView() {
  
  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const currentRole = useMemo(() => userLogged?.data?.user_role?.name, [userLogged]);
  
  const {
    loadedRewardPoints,
    refetchRewardPoints,
    loadingRewardPoints,
    errorRewardPoints,
    loadedRewardPointsHistory,
    refetchRewardPointsHistory,
    loadingRewardPointsHistory,
    errorRewardPointsHistory,
    loadedUsers,
    loadedPendingUsers,
    refetchUsers,
    loadingUsers,
    errorUsers,
    loadedStoreProducts,
    refetchStoreProducts,
    loadingStoreProducts,
    errorStoreProducts,
  } = useDataContext();

  return (
    <>
      {currentRole !== 'client' ? (
        <DashboardContent maxWidth="xl">
          <WelcomeTypography
            userLogged={userLogged}
          />
          <OverviewAdminView
            loadedRewardPoints={loadedRewardPoints}
            refetchRewardPoints={refetchRewardPoints}
            loadingRewardPoints={loadingRewardPoints}
            errorRewardPoints={errorRewardPoints}
            loadedRewardPointsHistory={loadedRewardPointsHistory}
            refetchRewardPointsHistory={refetchRewardPointsHistory}
            loadingRewardPointsHistory={loadingRewardPointsHistory}
            errorRewardPointsHistory={errorRewardPointsHistory}
            loadedUsers={loadedUsers}
            loadedPendingUsers={loadedPendingUsers}
            refetchUsers={refetchUsers}
            loadingUsers={loadingUsers}
            errorUsers={errorUsers}
            loadedStoreProducts={loadedStoreProducts}
            refetchStoreProducts={refetchStoreProducts}
            loadingStoreProducts={loadingStoreProducts}
            errorStoreProducts={errorStoreProducts}
          />
        </DashboardContent>
      ) : (
        <OverviewEcommerceView
          loadedRewardPoints={loadedRewardPoints}
          refetchRewardPoints={refetchRewardPoints}
          loadingRewardPoints={loadingRewardPoints}
          errorRewardPoints={errorRewardPoints}
        />
      )}
    </>
  );
}
