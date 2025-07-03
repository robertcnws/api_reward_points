
import { paths } from 'src/routes/paths';

import { isClient } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';
import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';



// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
  item: icon('ic-item'),
  shipment: icon('ic-shipment'),
  salesOrder: icon('ic-sale-order'),
  project: icon('ic-project'),
  stage: icon('ic-stage'),
  stageTask: icon('ic-stage-task'),
  task: icon('ic-task'),
  access: icon('ic-access'),
  radar: icon('ic-radar'),
  config: icon('ic-config'),
  track: icon('ic-track'),
  defaultGuideProduct: icon('ic-guide-product'),
  service: icon('ic-service'),
  serviceIssue: icon('ic-service-issue'),
  serviceStage: icon('ic-service-stage'),
  serviceTask: icon('ic-service-task'),
  calendarOverview: icon('ic-calendar-overview'),
  measurement: icon('ic-measurements'),
  defaultMaterial: icon('ic-material'),
  pointsSettings: icon('ic-points-settings'),
};

const userLogged = JSON.parse(sessionStorage.getItem('userLogged'));

const userRole = userLogged?.data?.user_role?.name;

// const { countLostItems } = useDataContext();

// ----------------------------------------------------------------------

export const navData = (loadedPendingUsers, isNavMini) => [
  // export const navData = (countLostItems) => [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      {
        title: 'Analytics',
        path: paths.dashboard.general.analytics,
        icon: ICONS.analytics
      },
      ...(userLogged && isClient(userRole) ? [
        {
          title: 'Store Products',
          path: paths.dashboard.storeProduct.root,
          icon: ICONS.item,
          children: [
            {
              title: 'List',
              path: paths.dashboard.storeProduct.list,
            },
          ],
        },
      ] : []),
    ],
  },
  ...(userLogged && !isClient(userRole) ? [
    {
      subheader: 'Management',
      items: [
        ...(userLogged && !isClient(userRole) ? [
          {
            title: (
              <>
                <Box component="span"
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: isNavMini ? 'center' : 'flex-start',
                  }}
                >
                  <Typography
                    variant={isNavMini ? 'caption' : 'subtitle2'}
                    sx={{
                      mr: 1,
                      color: loadedPendingUsers?.length > 0 ? 'error.main' : 'text.primary',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    Users
                  </Typography>
                  {(loadedPendingUsers?.length > 0 && !isNavMini) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                      <Label color="error" sx={{ ml: 1, gap: 0 }}>
                        {loadedPendingUsers?.length}
                        <Iconify icon='mdi:account-pending' width={20} height={20} sx={{ ml: 1 }} />
                        <Typography variant="subtitle2" sx={{ ml: 1 }}>
                          Pending
                        </Typography>
                      </Label>
                    </Box>
                  )}
                </Box>
              </>
            ),
            path: paths.dashboard.user.root,
            icon: ICONS.user,
            children: [
              {
                title: (
                  <>
                    <Box component="span" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mr: 1,
                          color: loadedPendingUsers?.length > 0 ? 'error.main' : 'text.primary',
                        }}
                      >
                        Pending Approval
                      </Typography>
                      {loadedPendingUsers?.length > 0 && (
                        <Label color="error" sx={{ ml: 1 }}>
                          {loadedPendingUsers?.length}
                        </Label>
                      )}
                    </Box>
                  </>
                ),
                path: paths.dashboard.user.pending,
              },
              {
                title: 'All Clients',
                path: paths.dashboard.user.client,
              },
              {
                title: 'Approved Users',
                path: paths.dashboard.user.list,
              },
              {
                title: 'Create',
                path: paths.dashboard.user.new,
              },
            ],
          },
          // {
          //   title: 'Items',
          //   path: paths.dashboard.item.root,
          //   icon: ICONS.item,
          //   children: [
          //     {
          //       title: 'List',
          //       path: paths.dashboard.item.list,
          //     },
          //     ...((userLogged && !isClient(userLogged?.data?.user_role?.name)) ? [
          //       {
          //         title: 'Attachments',
          //         path: paths.dashboard.item.attachments,
          //       },
          //     ] : []),
          //   ],
          // },
        ] : []),
      ]
    },
  ] : []),
  ...(userLogged && !isClient(userRole) ? [
    {
      subheader: 'Settings',
      items: [
        ...(userLogged && !isClient(userRole) ? [
          {
            title: 'Store Products',
            path: paths.dashboard.storeProduct.root,
            icon: ICONS.item,
            children: [
              {
                title: 'List',
                path: paths.dashboard.storeProduct.list,
              },
              {
                title: 'Attachments',
                path: paths.dashboard.storeProduct.attachments,
              },
              {
                title: 'Create',
                path: paths.dashboard.storeProduct.new,
              },
            ],
          },
          ...(userLogged && !isClient(userRole) ? [
            {
              title: 'Points Settings',
              path: paths.dashboard.pointsSettings.root,
              icon: ICONS.pointsSettings,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.pointsSettings.list,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.pointsSettings.new,
                },
              ],
            },
            {
              title: 'Roles',
              path: paths.dashboard.role.root,
              icon: ICONS.access,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.role.list,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.role.new,
                },
              ],
            },
          ] : []),
        ] : []),
      ]
    }
  ] : []),
];
