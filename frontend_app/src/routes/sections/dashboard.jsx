import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { isClient, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

// Overview
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
// Item
const ItemPage = lazy(() => import('src/pages/dashboard/items'));
// User Roles
const UserRoleDefaultListPage = lazy(() => import('src/pages/dashboard/user-role/list'));
const UserRoleDefaultCreatePage = lazy(() => import('src/pages/dashboard/user-role/new'));
// Permissions
const PermissionListPage = lazy(() => import('src/pages/dashboard/permission/list'));
const PermissionCreatePage = lazy(() => import('src/pages/dashboard/permission/new'));
// Itemgroups
const ItemgroupPage = lazy(() => import('src/pages/dashboard/itemgroups'));
// User
const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
const UserPendingListPage = lazy(() => import('src/pages/dashboard/user/pending-list'));
const UserClientListPage = lazy(() => import('src/pages/dashboard/user/client-list'));
// Store Product
const StoreProductPage = lazy(() => import('src/pages/dashboard/store-product'));
const StoreProductCreatePage = lazy(() => import('src/pages/dashboard/store-product/new'));
const StoreProductEditPage = lazy(() => import('src/pages/dashboard/store-product/edit'));
const StoreProductDetailsPage = lazy(() => import('src/pages/dashboard/store-product/details'));
// Points Settings
const PointsSettingsListPage = lazy(() => import('src/pages/dashboard/points-settings/list'));
const PointsSettingsCreatePage = lazy(() => import('src/pages/dashboard/points-settings/new'));
// Functionalities
const FunctionalityListPage = lazy(() => import('src/pages/dashboard/functionality/list'));
const FunctionalityCreatePage = lazy(() => import('src/pages/dashboard/functionality/new'));
// Purchases
const PurchaseListPage = lazy(() => import('src/pages/dashboard/purchase/list'));
const PurchaseCheckoutPage = lazy(() => import('src/pages/dashboard/purchase/checkout'));
const PurchaseOverviewClientView = lazy(() => import('src/pages/dashboard/purchase/client'));
// Invoices
const InvoicesListPage = lazy(() => import('src/pages/dashboard/invoice/list'));
// Sales Orders
const SalesOrdersListPage = lazy(() => import('src/pages/dashboard/sales-order/list'));
const SalesOrderDetailsPage = lazy(() => import('src/pages/dashboard/sales-order/details'));
// Error
const Page403 = lazy(() => import('src/pages/error/403'));
// FAQ Tutorial
const FAQTutorialListView = lazy(() => import('src/pages/dashboard/faq-tutorial/list'));

// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);


export const dashboardRoutes = (user) => [
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
      },
      {
        path: 'faqs-tutorial',
        element: <FAQTutorialListView />
      },
      {
        path: 'user/profile',
        element: <UserProfilePage />
      },
      {
        path: 'sales-order/:id/details',
        element: <SalesOrderDetailsPage />
      },
      ...isClient(user?.user_role?.name) ? [
        {
          path: 'purchase',
          element: <PurchaseListPage />
        },
        {
          path: 'invoice',
          element: <InvoicesListPage />
        },
        {
          path: 'sales-order',
          element: <SalesOrdersListPage />
        },

      ] : [],
      ...(user && listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.administrator)) ?
        [
          {
            path: 'config/role',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <UserRoleDefaultListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <UserRoleDefaultListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <UserRoleDefaultCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <UserRoleDefaultCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/functionality',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <FunctionalityListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <FunctionalityListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <FunctionalityCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <FunctionalityCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/permission',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.administrator
                ) ? <PermissionListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.administrator
                ) ? <PermissionListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.administrator
                ) ? <PermissionCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.administrator
                ) ? <PermissionCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/points-settings',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <PointsSettingsListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <PointsSettingsListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <PointsSettingsCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <PointsSettingsCreatePage /> : <Page403 />
              },
            ],
          },
        ] : [],
      {
        path: 'config/store-product',
        children: [
          {
            element: (
              listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.client) ||
              listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.officeStaff)
            ) ? <StoreProductPage /> : <Page403 />,
            index: true
          },
          {
            path: 'list',
            element: (
              listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.client) ||
              listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.officeStaff)
            ) ? <StoreProductPage /> : <Page403 />
          },
          ...listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.administrator) ? [
            {
              path: 'new',
              element: listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.administrator) ? <StoreProductCreatePage /> : <Page403 />
            },
          ] : [],
          ...listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.administrator) ? [
            {
              path: ':id/edit',
              element: listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.administrator) ? <StoreProductEditPage /> : <Page403 />
            },
          ] : [],
          {
            path: ':id/details',
            element: (
              listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.client) ||
              listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.officeStaff)
            ) ? <StoreProductDetailsPage /> : <Page403 />,
          }

        ],
      },
      ...(user && listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.officeStaff)) ?
        [
          {
            path: 'client',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.officeStaff
                ) ? <UserClientListPage /> : <Page403 />
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.officeStaff
                ) ? <UserClientListPage /> : <Page403 />
              },
            ]
          },
          {
            path: 'user',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.administrator
                ) ? <UserListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.administrator
                ) ? <UserListPage /> : <Page403 />
              },
              {
                path: 'pending',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.administrator
                ) ? <UserPendingListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.administrator
                ) ? <UserCreatePage /> : <Page403 />
              },
            ],
          },
        ] : [],
      ...(user && listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.officeStaff)) ?
        [
          {
            path: 'purchase',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.officeStaff
                ) ? <PurchaseListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.officeStaff
                ) ? <PurchaseListPage /> : <Page403 />
              },
              {
                path: 'checkout',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.officeStaff
                ) ? <PurchaseCheckoutPage /> : <Page403 />
              },
              {
                path: 'client/:id',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.officeStaff
                ) ? <PurchaseOverviewClientView /> : <Page403 />
              },
            ],
          },
        ] : [],
      ...(user && (
        (listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.officeStaff)) ||
        user?.customerportal_permissions?.map(permission => permission.key).includes(
          CONFIG.permissions.customerportal.canSeeItemsInStock
        )
      )) ?
        [
          {
            path: 'stock',
            children: [
              {
                element: ((listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.officeStaff)) ||
                  user?.customerportal_permissions?.map(permission => permission.key).includes(
                    CONFIG.permissions.customerportal.canSeeItemsInStock
                  )) ? <ItemgroupPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: ((listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.officeStaff)) ||
                  user?.customerportal_permissions?.map(permission => permission.key).includes(
                    CONFIG.permissions.customerportal.canSeeItemsInStock
                  )) ? <ItemgroupPage /> : <Page403 />,
              },
            ],
          },
        ] : [],
    ]
  },
];

