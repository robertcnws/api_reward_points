import { lazy, useMemo, Suspense, useEffect } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import { AuthSplitLayout } from 'src/layouts/auth-split';

import { SplashScreen } from 'src/components/loading-screen';

import { GuestGuard } from 'src/auth/guard';

import { useRewardLoginUserByUsername } from 'src/_mock/__reward-login-users';
import { fieldsLoginUsers } from 'src/auth/context/data/field-descriptors/field-descriptors-login-users';
import { wsEndpoints } from 'src/utils/axios';

import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { dashboardRoutes } from './dashboard';




// ----------------------------------------------------------------------

// const HomePage = lazy(() => import('src/pages/home'));
const Jwt = {
  SignInPage: lazy(() => import('src/pages/auth/jwt/sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth/jwt/sign-up')),
};

export function Router() {

  // console.log('listPermissions', listPermissions);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const userByUsernameQuery = useRewardLoginUserByUsername(userLogged?.data?.username, fieldsLoginUsers);

  const refetchUserByUsername = userByUsernameQuery.refetch;

  const finalUser = useMemo(() => {
    if (!userByUsernameQuery.data) return null;
    return {
      ...userByUsernameQuery?.data,
      customerportal_permissions: userByUsernameQuery.data?.customerportalPermissions || []
    };
  }, [userByUsernameQuery.data]);

  // useEffect(() => {
  //   if (loadedPermissions && userLogged) {
  //     const results = loadedPermissions?.results;

  //     const permissions = results?.filter((item) => item.username === userLogged?.data.username);

  //     if (permissions.length > 0) {
  //       setListPermissions(permissions[0].permissions);
  //     }

  //   }
  // }, [loadedPermissions, userLogged]);

  useEffect(() => {
      const url = wsEndpoints.users.byUsername(userLogged?.data?.username);
      const socket = new WebSocket(url);
      let refetchTimer = null;
  
      const safeRefetch = () => {
        if (refetchTimer) return;
        refetchTimer = setTimeout(() => {
          refetchTimer = null;
          refetchUserByUsername?.().catch((err) => console.error('Error fetching user data:', err));
        }, 250); // throttle 250ms
      };
  
      socket.onerror = (e) => {
        console.error('WebSocket error:', e);
      };
  
      socket.onmessage = (event) => {
        // console.log('WS message received for user data:', event.data);
        try {
          const allData = JSON.parse(event.data);
          const message = allData?.message || allData; 
          // console.log('Parsed WS message for user data:', message);
          if (['created', 'updated', 'deleted'].includes(message?.type)) {
            safeRefetch();
          }
        } catch (e) {
          console.error('Invalid WS payload:', e);
        }
      };
  
      return () => {
        try { socket.close(); } catch (e) { console.error('Error closing WebSocket:', e); }
        if (refetchTimer) { clearTimeout(refetchTimer); refetchTimer = null; }
      };
    }, [userLogged?.data?.username, refetchUserByUsername]);

  return useRoutes([
    {
      path: '/',
      /**
       * Skip home page
       * element: <Navigate to={CONFIG.auth.redirectPath} replace />,
       */
      // element: (
      //   <Suspense fallback={<SplashScreen />}>
      //     <MainLayout>
      //       <HomePage />
      //     </MainLayout>
      //   </Suspense>
      // ),
      element: (
        <Suspense fallback={<SplashScreen />}>
          <GuestGuard>
            <AuthSplitLayout section={{ title: '' }}>
              <Jwt.SignInPage />
            </AuthSplitLayout>
          </GuestGuard>
        </Suspense>
      ),
    },

    // Auth
    ...authRoutes,

    // Dashboard
    ...dashboardRoutes({ user: finalUser }),

    // Main
    ...mainRoutes,

    // No match
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
