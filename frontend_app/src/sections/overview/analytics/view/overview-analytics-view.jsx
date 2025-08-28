import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'src/routes/hooks';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { axiosInstanceBackend, endpoints } from 'src/utils/axios';
import { useBoolean } from 'src/hooks/use-boolean';
import { LoadingContext } from 'src/auth/context/loading-context';

import { DashboardContent } from 'src/layouts/dashboard';

import { useDataContext } from 'src/auth/context/data/data-context';

import { OverviewAdminView } from '../../admin/view';
import { WelcomeTypography } from '../welcome-typography';
import { OverviewEcommerceView } from '../../e-commerce/view';




export function OverviewAnalyticsView({
  handleShowTourGuide,
  tookTourGuide,
  showModalTour,
  tookIntroGuide,
  showModalIntro
}) {

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
    loadedRewardPointsGainedHistory,
    refetchRewardPointsGainedHistory,
    loadingRewardPointsGainedHistory,
    errorRewardPointsGainedHistory,
    loadedRewardPointsSpentHistory,
    refetchRewardPointsSpentHistory,
    loadingRewardPointsSpentHistory,
    errorRewardPointsSpentHistory,
    loadedUsers,
    loadedPendingUsers,
    refetchUsers,
    loadingUsers,
    errorUsers,
    loadedStoreProducts,
    refetchStoreProducts,
    loadingStoreProducts,
    errorStoreProducts,
    loadedAllRewardIntroSteps,
    userByUsername,
    refetchUserByUsername
  } = useDataContext();



  return (
    <>
      {currentRole !== 'client' ? (
        <OverviewAdminView
          loadedRewardPoints={loadedRewardPoints}
          refetchRewardPoints={refetchRewardPoints}
          loadingRewardPoints={loadingRewardPoints}
          errorRewardPoints={errorRewardPoints}
          loadedRewardPointsHistory={loadedRewardPointsHistory}
          refetchRewardPointsHistory={refetchRewardPointsHistory}
          loadingRewardPointsHistory={loadingRewardPointsHistory}
          errorRewardPointsHistory={errorRewardPointsHistory}
          loadedRewardPointsGainedHistory={loadedRewardPointsGainedHistory}
          refetchRewardPointsGainedHistory={refetchRewardPointsGainedHistory}
          loadingRewardPointsGainedHistory={loadingRewardPointsGainedHistory}
          errorRewardPointsGainedHistory={errorRewardPointsGainedHistory}
          loadedRewardPointsSpentHistory={loadedRewardPointsSpentHistory}
          refetchRewardPointsSpentHistory={refetchRewardPointsSpentHistory}
          loadingRewardPointsSpentHistory={loadingRewardPointsSpentHistory}
          errorRewardPointsSpentHistory={errorRewardPointsSpentHistory}
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
      ) : (
        <OverviewEcommerceView
          loadedRewardPoints={loadedRewardPoints}
          refetchRewardPoints={refetchRewardPoints}
          loadingRewardPoints={loadingRewardPoints}
          errorRewardPoints={errorRewardPoints}
          handleShowTourGuide={handleShowTourGuide}
          tookTourGuide={tookTourGuide}
          showModalTour={showModalTour}
          tookIntroGuide={tookIntroGuide}
          showModalIntro={showModalIntro}
        />
      )}
    </>
  );
}
