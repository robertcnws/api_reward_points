import { Box, Button, IconButton, Typography } from '@mui/material';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDataContext } from 'src/auth/context/data/data-context';
import { LoadingContext } from 'src/auth/context/loading-context';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Iconify } from 'src/components/iconify';

import { CONFIG } from 'src/config-global';
import { useBoolean } from 'src/hooks/use-boolean';

import { OverviewAnalyticsView } from 'src/sections/overview/analytics/view';
import { axiosInstanceBackend, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const metadata = { title: `Analytics | Dashboard - ${CONFIG.appName}` };

export default function Page() {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    userByUsername,
    refetchUserByUsername,
    loadingUserByUsername,
  } = useDataContext();

  const showModalTour = useBoolean();
  const tookTourGuide = useMemo(() => userByUsername?.tookTourGuide, [userByUsername]);
  const showModalIntro = useBoolean(false);
  const tookIntroGuide = useMemo(() => userByUsername?.tookIntroGuide, [userByUsername]);

  useEffect(() => {
    showModalTour.setValue(userByUsername?.showTourGuideModal);
  }, [userByUsername, showModalTour]);

  useEffect(() => {
    showModalIntro.setValue(userByUsername?.showIntroGuideModal);
  }, [userByUsername, showModalIntro]);

  const handleShowTourGuide = useCallback(async () => {
    try {
      await axiosInstanceBackend.post(endpoints.user.changeShowTourGuide.user(userByUsername?.id), {
        userReporter: JSON.stringify(userLogged?.data),
      });
      refetchUserByUsername?.().catch(console.error);
    } catch (error) {
      console.error('Error showing tour guide:', error);
    }
  }, [userByUsername, userLogged, refetchUserByUsername]);

  return (
    <>
      {!(loadingUserByUsername && showModalIntro.value) && (
        <>
          <Helmet>
            <title> {metadata.title}</title>
          </Helmet>
          <OverviewAnalyticsView
            handleShowTourGuide={handleShowTourGuide}
            tookTourGuide={tookTourGuide}
            showModalTour={showModalTour}
            tookIntroGuide={tookIntroGuide}
            showModalIntro={showModalIntro}
          />
        </>
      )}
    </>
  );
}
