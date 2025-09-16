// app.jsx
import 'src/global.css';

import { ApolloProvider } from '@apollo/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import { Box, Button, IconButton, Typography } from '@mui/material';

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

import { LoadingContext } from 'src/auth/context/loading-context';
import { AuthProvider as Auth0AuthProvider } from 'src/auth/context/auth0';
import { AuthProvider as AmplifyAuthProvider } from 'src/auth/context/amplify';
import { getSession, AuthProvider as JwtAuthProvider } from 'src/auth/context/jwt';

import client from './utils/graphql-client';
import { Iconify } from './components/iconify';
import { useBoolean } from './hooks/use-boolean';
import { ConfirmDialog } from './components/custom-dialog';
import { RouteProvider } from './auth/context/router-context';
import { endpoints, axiosInstanceBackend } from './utils/axios';
import BackdropBackground from './layouts/components/backdrop-background';
import { DataProvider, useDataContext } from './auth/context/data/data-context';
import { StoreProductDetailsCarousel } from './sections/store-product/store-product-details-carousel';
import { Image } from './components/image';

// ----------------------------------------------------------------------

const AuthProvider =
  (CONFIG.auth.method === 'amplify' && AmplifyAuthProvider) ||
  (CONFIG.auth.method === 'auth0' && Auth0AuthProvider) ||
  JwtAuthProvider;

const queryClient = new QueryClient();

const isClientRole = (roleName) =>
  String(roleName || '').toLowerCase() === 'client';

function useAuthBoot(session, loadingUserByUsername) {
  const isLoggedIn = Boolean(session);
  const authResolved = session !== undefined;
  const bootReady = authResolved && (!isLoggedIn || !loadingUserByUsername);
  return { isLoggedIn, bootReady };
}

function useIntroController({
  session,
  userLogged,
  userByUsername,
  loadingUserByUsername,
  loadedAllRewardIntroSteps,
  refetchUserByUsername,
}) {
  const roleName =
    userLogged?.data?.user_role?.name ??
    userLogged?.data?.userRole?.name ??
    '';

  const isClient = isClientRole(roleName);
  const { isLoggedIn, bootReady } = useAuthBoot(session, loadingUserByUsername);

  const showModalIntro = useBoolean(false);
  const isTranslated = useBoolean(false);
  const [index, setIndex] = useState(0);

  const totalSteps = loadedAllRewardIntroSteps?.length || 0;

  useEffect(() => {
    showModalIntro.setValue(Boolean(isLoggedIn && isClient && userByUsername?.showIntroGuideModal));
  }, [isLoggedIn, isClient, userByUsername, showModalIntro]);

  const introTitle = useMemo(() => {
    const step = loadedAllRewardIntroSteps?.[index];
    return isTranslated.value ? step?.translation?.es?.title : step?.title;
  }, [index, loadedAllRewardIntroSteps, isTranslated]);

  const introContent = useMemo(() => {
    const step = loadedAllRewardIntroSteps?.[index];
    return isTranslated.value ? step?.translation?.es?.content : step?.content;
  }, [index, loadedAllRewardIntroSteps, isTranslated]);

  const introRelatedImageName = useMemo(() => {
    const step = loadedAllRewardIntroSteps?.[index];
    return step?.relatedImageName || null;
  }, [index, loadedAllRewardIntroSteps]);

  console.log('introRelatedImageName', introRelatedImageName);

  const isLast = index >= Math.max(0, totalSteps - 1);

  const handleCloseIntro = useCallback(async () => {
    try {
      if (isClient) {
        await axiosInstanceBackend.post(
          endpoints.user.changeShowIntroGuide.user(userByUsername?.id),
          { userReporter: JSON.stringify(userLogged?.data) }
        );
        await (refetchUserByUsername?.() || Promise.resolve());
      }
    } finally {
      showModalIntro.onFalse();
    }
  }, [isClient, userByUsername, userLogged, refetchUserByUsername, showModalIntro]);

  const next = useCallback(async () => {
    if (index < totalSteps - 1) {
      setIndex((i) => i + 1);
      return;
    }
    await handleCloseIntro();
  }, [index, totalSteps, handleCloseIntro]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const toggleLang = useCallback(() => isTranslated.setValue(!isTranslated.value), [isTranslated]);

  const shouldShowIntro = Boolean(isLoggedIn && isClient && showModalIntro.value && totalSteps);

  return {
    bootReady,
    shouldShowIntro,
    introTitle,
    introContent,
    introRelatedImageName,
    isTranslated,
    index,
    isLast,
    prev,
    next,
    toggleLang,
    handleCloseIntro,
  };
}

function buttonLabel(isLast, isTranslated) {
  let label;
  if (isLast) {
    label = isTranslated ? 'Iniciar Tour' : 'Start Tour';
  } else {
    label = isTranslated ? 'Siguiente' : 'Next';
  }
  return label;
}

function IntroDialog({
  title,
  content,
  relatedImageName,
  isMobile,
  isTranslated,
  onToggleLang,
  onPrev,
  onNext,
  onClose,
  canGoBack,
  isLast,
}) {
  return (
    <ConfirmDialog
      maxWidth="md"
      open
      onClose={onClose}
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
          <Typography variant="h6">{title}</Typography>
          <IconButton
            onClick={onToggleLang}
            sx={{
              fontSize: 14,
              '&:hover': { boxShadow: 'none', backgroundColor: 'transparent' },
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-start',
            }}
          >
            <Iconify icon="ri:translate" />
            &nbsp;Translate {!isTranslated ? 'to Spanish' : 'to English'}
          </IconButton>
        </Box>
      }
      content={
        <Box sx={{ width: 1, textAlign: 'center', mt: 1 }}>
          <Image
            alt={relatedImageName}
            src={`/logo/intro/${relatedImageName}.png`}
            // ratio="1/1"
            sx={{ borderRadius: 1, mb: 1 }}
          />
          <Typography variant="body2" align="justify" sx={{ mt: 2, fontSize: 17 }}>
            {content}
          </Typography>
        </Box>
      }
      closeName={!isTranslated ? 'Skip' : 'Omitir'}
      action={
        <>
          {canGoBack && (
            <Button variant="contained" color="success" onClick={onPrev}>
              {!isTranslated ? 'Previous' : 'Anterior'}
            </Button>
          )}
          <Button variant="contained" color="primary" onClick={onNext}>
            {buttonLabel(isLast, isTranslated)}
          </Button>
        </>
      }
      BackdropProps={{ style: { backgroundColor: 'whitesmoke' }, invisible: true }}
      // hideBackdrop
      // BackdropProps={{ invisible: true }}  // o: hideBackdrop
      PaperProps={{
        elevation: 0,
        sx: { boxShadow: 'none', backgroundImage: 'none' },
      }}
    />
  );
}

function AppInner({ session }) {
  const { loading, error, setError, component, isMobile } = useContext(LoadingContext);
  const {
    userByUsername,
    loadingUserByUsername,
    refetchUserByUsername,
    loadedAllRewardIntroSteps,
  } = useDataContext();

  const userLogged = useMemo(
    () => JSON.parse(sessionStorage.getItem('userLogged') || 'null'),
    []
  );

  const {
    bootReady,
    shouldShowIntro,
    introTitle,
    introContent,
    introRelatedImageName,
    isTranslated,
    index,
    isLast,
    prev,
    next,
    toggleLang,
    handleCloseIntro,
  } = useIntroController({
    session,
    userLogged,
    userByUsername,
    loadingUserByUsername,
    loadedAllRewardIntroSteps,
    refetchUserByUsername,
  });

  if (!bootReady) return null;

  if (shouldShowIntro) {
    return (
      <IntroDialog
        title={introTitle}
        content={introContent}
        relatedImageName={introRelatedImageName}
        isMobile={isMobile}
        isTranslated={isTranslated.value}
        onToggleLang={toggleLang}
        onPrev={prev}
        onNext={next}
        onClose={handleCloseIntro}
        canGoBack={index > 0}
        isLast={isLast}
      />
    );
  }

  return (
    <MotionLazy>
      <Snackbar />
      <ProgressBar />
      <SettingsDrawer />
      <Router />
      <BackdropBackground loading={loading} error={error} setError={setError} component={component} />
    </MotionLazy>
  );
}

export default function App() {
  useScrollToTop();

  const [session, setSessionState] = useState(undefined);

  useEffect(() => {
    let isMounted = true;
    getSession().then((sess) => {
      if (isMounted) setSessionState(sess ?? null);
    });
    return () => { isMounted = false; };
  }, []);

  return (
    <I18nProvider>
      <LocalizationProvider>
        <AuthProvider>
          <ApolloProvider client={client}>
            <RouteProvider>
              <QueryClientProvider client={queryClient}>
                <SettingsProvider settings={defaultSettings}>
                  <ThemeProvider>
                    <DataProvider>
                      <AppInner session={session} />
                    </DataProvider>
                  </ThemeProvider>
                </SettingsProvider>
              </QueryClientProvider>
            </RouteProvider>
          </ApolloProvider>
        </AuthProvider>
      </LocalizationProvider>
    </I18nProvider>
  );
}
