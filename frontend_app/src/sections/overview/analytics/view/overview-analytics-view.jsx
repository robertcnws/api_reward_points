import React, { useCallback, useMemo } from 'react';

import { useDataContext } from 'src/auth/context/data/data-context';

import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { WelcomeTypography } from '../welcome-typography';
import { OverviewEcommerceView } from '../../e-commerce/view';



export function OverviewAnalyticsView() {
  
  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const currentRole = useMemo(() => userLogged?.data?.user_role?.name, [userLogged]);
  
  const {
    loadedRewardPoints,
    refetchRewardPoints,
    loadingRewardPoints,
    errorRewardPoints
  } = useDataContext();

  return (
    <>
      {currentRole !== 'client' ? (
        <DashboardContent maxWidth="xl">
          <WelcomeTypography
            userLogged={userLogged}
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
