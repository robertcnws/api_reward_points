import 'src/global.css';

// ----------------------------------------------------------------------

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Router } from 'src/routes/sections';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';

import { CONFIG } from 'src/config-global';
import { LocalizationProvider } from 'src/locales';
import { I18nProvider } from 'src/locales/i18n-provider';
import { ThemeProvider } from 'src/theme/theme-provider';

import { Snackbar } from 'src/components/snackbar';
import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';
import { Box, Button, IconButton, Typography } from '@mui/material';

import { LoadingContext } from 'src/auth/context/loading-context';
import { getSession, AuthProvider as JwtAuthProvider, setSession } from 'src/auth/context/jwt';
import { AuthProvider as Auth0AuthProvider } from 'src/auth/context/auth0';
import { AuthProvider as AmplifyAuthProvider } from 'src/auth/context/amplify';
import { useBoolean } from './hooks/use-boolean';
import { ConfirmDialog } from './components/custom-dialog';
import { Iconify } from './components/iconify';
import { axiosInstanceBackend, endpoints } from './utils/axios';

import client from './utils/graphql-client';
import { RouteProvider } from './auth/context/router-context';
import { DataProvider, useDataContext } from './auth/context/data/data-context';
import BackdropBackground from './layouts/components/backdrop-background';
import OnboardingGuide from './layouts/dashboard/onboarding-guide';




// ----------------------------------------------------------------------

const AuthProvider =
  (CONFIG.auth.method === 'amplify' && AmplifyAuthProvider) ||
  (CONFIG.auth.method === 'auth0' && Auth0AuthProvider) ||
  JwtAuthProvider;

const queryClient = new QueryClient();

export default function App() {
  useScrollToTop();

  const { loading, error, setError, component, isMobile } = useContext(LoadingContext);

  const [session, setSessionState] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getSession().then((sess) => {
      if (isMounted) setSessionState(sess);
    });
    return () => { isMounted = false; };
  }, []);

  function AppInner() {
    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const roleName =
      userLogged?.data?.user_role?.name ??
      userLogged?.data?.userRole?.name ??
      '';
    const isClient = typeof roleName === 'string' && roleName.toLowerCase() === 'client';

    const {
      userByUsername,
      loadingUserByUsername,
      refetchUserByUsername,
      loadedAllRewardIntroSteps,
    } = useDataContext();

    // Estado del intro
    const showModalIntro = useBoolean(false);
    const showModalTour = useBoolean(false);
    const isTranslated = useBoolean(false);
    const [currentIntroIndex, setCurrentIntroIndex] = useState(0);

    // Derivados del contenido del intro
    const introTitle = useMemo(
      () =>
        !isTranslated.value
          ? loadedAllRewardIntroSteps?.[currentIntroIndex]?.title
          : loadedAllRewardIntroSteps?.[currentIntroIndex]?.translation?.es?.title,
      [currentIntroIndex, loadedAllRewardIntroSteps, isTranslated]
    );

    const introContent = useMemo(
      () =>
        !isTranslated.value
          ? loadedAllRewardIntroSteps?.[currentIntroIndex]?.content
          : loadedAllRewardIntroSteps?.[currentIntroIndex]?.translation?.es?.content,
      [currentIntroIndex, loadedAllRewardIntroSteps, isTranslated]
    );

    const isLoggedIn =
      Boolean(userByUsername?.id) ||
      Boolean(userLogged?.data?.id);

    useEffect(() => {
      const shouldShow = Boolean(
        isLoggedIn &&
        isClient &&
        userByUsername?.showIntroGuideModal
      );
      showModalIntro.setValue(shouldShow);
    }, [isLoggedIn, isClient, userByUsername, showModalIntro]);

    const handleShowIntroGuide = useCallback(async () => {
      try {
        if (isClient) {
          await axiosInstanceBackend.post(
            endpoints.user.changeShowIntroGuide.user(userByUsername?.id),
            { userReporter: JSON.stringify(userLogged?.data) }
          );
          await (refetchUserByUsername?.() || Promise.resolve());
        }
        showModalIntro.onFalse();
      } catch {
        showModalIntro.onFalse();
      }
    }, [isClient, userByUsername, userLogged, refetchUserByUsername, showModalIntro]);

    if (isLoggedIn && isClient && showModalIntro.value && session) {
      const total = loadedAllRewardIntroSteps?.length || 0;
      const isLast = currentIntroIndex >= total - 1;

      return (
        <ConfirmDialog
          maxWidth="md"
          open
          onClose={handleShowIntroGuide}
          title={
            <Box
              sx={{
                display: 'flex',
                flexDirection: !isMobile ? 'row' : 'column',
                justifyContent: !isMobile ? 'space-between' : 'flex-start',
                gap: 1,
                width: 1,
              }}
            >
              <Typography variant="h6">{introTitle}</Typography>
              <IconButton
                onClick={() => isTranslated.setValue(!isTranslated.value)}
                sx={{
                  fontSize: 14,
                  '&:hover': { boxShadow: 'none', backgroundColor: 'transparent' },
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                }}
              >
                <Iconify icon="ri:translate" />
                &nbsp;Translate {!isTranslated.value ? 'to Spanish' : 'to English'}
              </IconButton>
            </Box>
          }
          content={
            <Typography variant="body2" align="justify" sx={{ mt: 2, fontSize: 17 }}>
              {introContent}
            </Typography>
          }
          closeName={!isTranslated.value ? 'Skip' : 'Omitir'}
          action={
            <>
              {currentIntroIndex > 0 && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setCurrentIntroIndex((i) => Math.max(0, i - 1))}
                >
                  {!isTranslated.value ? 'Previous' : 'Anterior'}
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  const totalSteps = loadedAllRewardIntroSteps?.length || 0;
                  if (currentIntroIndex < totalSteps - 1) {
                    setCurrentIntroIndex((i) => i + 1);
                  } else {
                    // último paso: marca como visto y cierra
                    await handleShowIntroGuide();
                    showModalTour.onTrue(); // si luego quieres abrir el tour
                  }
                }}
              >
                {!isLast
                  ? !isTranslated.value
                    ? 'Next'
                    : 'Siguiente'
                  : !isTranslated.value
                    ? 'Start Tour'
                    : 'Iniciar Tour'}
              </Button>
            </>
          }
          BackdropProps={{ style: { backgroundColor: 'whitesmoke' } }}
        />
      );
    }

    return (
      <>
        <Snackbar />
        <ProgressBar />
        <SettingsDrawer />
        <Router />
        <BackdropBackground loading={loading} error={error} setError={setError} component={component} />
      </>
    );
  }

  return (
    <I18nProvider>
      <LocalizationProvider>
        <AuthProvider>
          <SettingsProvider settings={defaultSettings}>
            <ThemeProvider>
              <ApolloProvider client={client}>
                <RouteProvider>
                  <MotionLazy>
                    <QueryClientProvider client={queryClient}>
                      <DataProvider>
                        {/* <Snackbar />
                        <ProgressBar />
                        <SettingsDrawer />
                        <Router />
                        <BackdropBackground loading={loading} error={error} setError={setError} component={component} /> */}
                        <AppInner />
                      </DataProvider>
                    </QueryClientProvider>
                  </MotionLazy>
                </RouteProvider>
              </ApolloProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </LocalizationProvider>
    </I18nProvider>
  );
}
