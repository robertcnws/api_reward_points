import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

// Overview
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));

// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);


export const dashboardRoutes = () => [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <OverviewAnalyticsPage /> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      {
        element: <OverviewAnalyticsPage />,
        index: true
      },
      {
        path: 'analytics',
        element: <OverviewAnalyticsPage /> 
      }
    ]
  },
];

