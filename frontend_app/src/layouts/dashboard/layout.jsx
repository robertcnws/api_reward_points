import dayjs from 'dayjs';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import IconButton, { iconButtonClasses } from '@mui/material/IconButton';
import { Iconify } from 'src/components/iconify';
import { Portal, Tooltip } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useRouter } from 'src/routes/hooks';

import { wsEndpoints } from 'src/utils/axios';
import { isClient } from 'src/utils/check-permissions';

import { useRewardStoreProductSelectionBuyByUsername } from 'src/_mock/__reward-store-product-selection-buys';

import { Logo } from 'src/components/logo';
import { useSettingsContext } from 'src/components/settings';

import { useDataContext } from 'src/auth/context/data/data-context';
import { fieldsRewardStoreProductSelectionBuys } from 'src/auth/context/data/field-descriptors/field-descriptors-reward-store-product-selection';

import { Main } from './main';
import { NavMobile } from './nav-mobile';
import { layoutClasses } from '../classes';
import { NavVertical } from './nav-vertical';
import { CustomFooter } from '../main/footer';
import { NavHorizontal } from './nav-horizontal';
import { _account } from '../config-nav-account';
import { Searchbar } from '../components/searchbar';
import { MenuButton } from '../components/menu-button';
import { LayoutSection } from '../core/layout-section';
import { HeaderSection } from '../core/header-section';
import { CartsDrawer } from '../components/cart-drawer';
import { StyledDivider, useNavColorVars } from './styles';
import { AccountDrawer } from '../components/account-drawer';
import { SettingsButton } from '../components/settings-button';
import { navData as dashboardNavData } from '../config-nav-dashboard';
import OnboardingGuide from './onboarding-guide';
import { GuideTourButton } from '../components/guide-tour-button';
import ChatLauncher from './chat-laucher';




// ----------------------------------------------------------------------

export function DashboardLayout({ sx, children, header, data }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const roleName = useMemo(() => userLogged?.data?.user_role?.name, [userLogged]);

  const router = useRouter();

  const isAnalyticsUrl = router.currentUrl().includes('/analytics');

  const theme = useTheme();

  const mobileNavOpen = useBoolean();

  const settings = useSettingsContext();

  const navColorVars = useNavColorVars(theme, settings);

  const layoutQuery = 'lg';

  // const navData = data?.nav ?? dashboardNavData(countLostItems);

  const isNavMini = settings.navLayout === 'mini';
  const isNavHorizontal = settings.navLayout === 'horizontal';
  const isNavVertical = isNavMini || settings.navLayout === 'vertical';

  const [operators, setOperators] = useState([]);

  const {
    loadedPendingUsers,
    loadedOfficeStaffUsers,
    refetchUsers,
    refetchRewardPoints,
  } = useDataContext();

  const rewardHook = useRewardStoreProductSelectionBuyByUsername(
    userLogged?.data?.username,
    fieldsRewardStoreProductSelectionBuys
  );
  const dataContextHook = useDataContext();

  const {
    data: clientData,
    loading: clientLoading,
    error: clientError,
    refetch: clientRefetch
  } = rewardHook;

  const {
    loadedStoreProductSelectionBuys: otherData,
    loadingStoreProductSelectionBuys: otherLoading,
    errorStoreProductSelectionBuys: otherError,
    refetchStoreProductSelectionBuys: otherRefetch,
    runNavVertical,
    setRunNavVertical,
    finishNavVertical,
    runDashboard,
    runNavTop,
    setRunNavTop,
    finishNavTop,
  } = dataContextHook;

  const loadedPurchases = roleName === 'client' ? clientData : otherData;
  const loadingPurchases = roleName === 'client' ? clientLoading : otherLoading;
  const errorPurchases = roleName === 'client' ? clientError : otherError;
  const refetchPurchases = roleName === 'client' ? clientRefetch : otherRefetch;

  const [pendingUsers, setPendingUsers] = useState(loadedPendingUsers);

  const [purchases, setPurchases] = useState(loadedPurchases);

  useEffect(() => {
    refetchUsers?.();
    setPendingUsers(loadedPendingUsers);
    setOperators(
      loadedOfficeStaffUsers?.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName} (${user.userRole.name})`,
        chatUrl: `/chat/${user.id}`,
      }))
    );
    refetchRewardPoints?.();
  }, [refetchUsers, loadedPendingUsers, refetchRewardPoints, loadedOfficeStaffUsers]);

  useEffect(() => {
    if (loadedPurchases && Array.isArray(loadedPurchases) && loadedPurchases.length > 0) {
      setPurchases(loadedPurchases);
    }
  }, [loadedPurchases]);

  useEffect(() => {
    const url = !isClient(roleName) ?
      wsEndpoints.rewardPoints.storeProductSelectionBuy.all :
      wsEndpoints.rewardPoints.storeProductSelectionBuy.byUsername(userLogged?.data?.username);
    const socket = new WebSocket(url);
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated' || message.type === 'deleted') {
        refetchPurchases().catch((err) => console.error('Error fetching purchases data:', err));
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [userLogged?.data?.username, roleName, refetchPurchases]);

  const newPurchases = useMemo(
    () => {
      const today = dayjs().format('YYYY-MM-DD');
      return purchases?.filter(p => {
        const purchaseDate = dayjs(p.createdTime, 'YYYY-MM-DD');
        return purchaseDate.isSame(today, 'day');
      }) || [];
    },
    [purchases]
  );

  const oldPurchases = useMemo(
    () => {
      const today = dayjs().format('YYYY-MM-DD');
      return purchases?.filter(p => {
        const purchaseDate = dayjs(p.createdTime, 'YYYY-MM-DD');
        return !purchaseDate.isSame(today, 'day');
      }) || [];
    },
    [purchases]
  );

  const navData = data?.nav ?? dashboardNavData(pendingUsers, newPurchases, oldPurchases, isNavMini);

  return (
    <>
      <LayoutSection
        /** **************************************
         * Header
         *************************************** */
        headerSection={
          <HeaderSection
            layoutQuery={layoutQuery}
            disableElevation={isNavVertical}
            slotProps={{
              toolbar: {
                sx: {
                  ...(isNavHorizontal && {
                    bgcolor: 'var(--layout-nav-bg)',
                    [`& .${iconButtonClasses.root}`]: {
                      color: 'var(--layout-nav-text-secondary-color)',
                    },
                    [theme.breakpoints.up(layoutQuery)]: {
                      height: 'var(--layout-nav-horizontal-height)',
                    },
                  }),
                },
              },
              container: {
                maxWidth: false,
                sx: {
                  ...(isNavVertical && { px: { [layoutQuery]: 5 } }),
                },
              },
            }}
            sx={header?.sx}
            slots={{
              topArea: (
                <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                  This is an info Alert.
                </Alert>
              ),
              bottomArea: isNavHorizontal ? (
                <NavHorizontal
                  data={navData}
                  layoutQuery={layoutQuery}
                  cssVars={navColorVars.section}
                />
              ) : null,
              leftArea: (
                <>
                  {/* -- Nav mobile -- */}
                  <MenuButton
                    onClick={mobileNavOpen.onTrue}
                    sx={{
                      mr: 1,
                      ml: -1,
                      [theme.breakpoints.up(layoutQuery)]: { display: 'none' },
                    }}
                  />
                  <NavMobile
                    data={navData}
                    open={mobileNavOpen.value}
                    onClose={mobileNavOpen.onFalse}
                    cssVars={navColorVars.section}
                  />
                  {/* -- Logo -- */}
                  {isNavHorizontal && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Logo isSingle={false} sx={{ width: '60px', height: 'auto' }} />
                    </Box>
                    // <Logo
                    //   isSingle={false}
                    //   sx={{
                    //     width: '500px',
                    //     display: 'none',
                    //     [theme.breakpoints.up(layoutQuery)]: {
                    //       display: 'inline-flex',
                    //     },
                    //   }}
                    // />
                  )}
                  {/* -- Divider -- */}
                  {isNavHorizontal && (
                    <StyledDivider
                      sx={{
                        [theme.breakpoints.up(layoutQuery)]: { display: 'flex' },
                      }}
                    />
                  )}
                  {/* -- Workspace popover -- */}
                  {/* <WorkspacesPopover
                  data={_workspaces}
                  sx={{ color: 'var(--layout-nav-text-primary-color)' }}
                /> */}
                </>
              ),
              rightArea: (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  // justifyContent: runDashboard || runNavVertical || runNavTop || !isAnalyticsUrl || !isClient(roleName)?
                  //   'flex-end' : 'space-between',
                  justifyContent: 'flex-end',
                  width: '100%'
                }}>
                  {/* {isClient(roleName) && <GuideTourButton width={30} />} */}

                  <Box display="flex" alignItems="center" gap={{ xs: 0, sm: 0.75 }}>
                    {/* -- Searchbar -- */}
                    <Searchbar data={navData} />
                    {/* -- Language popover -- */}
                    {/* <LanguagePopover data={allLangs} /> */}
                    {/* -- Cart popover -- */}
                    {isClient(roleName) && (
                      <CartsDrawer />
                    )}
                    {/* -- Notifications popover -- */}
                    {/* <NotificationsDrawer /> */}
                    {/* -- Contacts popover -- */}
                    {/* <ContactsPopover data={_contacts} /> */}
                    {/* -- Settings button -- */}
                    <SettingsButton />
                    {/* -- Account drawer -- */}
                    <AccountDrawer data={_account({ role: userLogged?.data?.user_role?.name })} />
                  </Box>
                </Box>
              ),
            }}
          />
        }
        /** **************************************
         * Sidebar
         *************************************** */
        sidebarSection={
          isNavHorizontal ? null : (
            <NavVertical
              data={navData}
              isNavMini={isNavMini}
              layoutQuery={layoutQuery}
              cssVars={navColorVars.section}
              onToggleNav={() =>
                settings.onUpdateField(
                  'navLayout',
                  settings.navLayout === 'vertical' ? 'mini' : 'vertical'
                )
              }
            />
          )
        }
        /** **************************************
         * Footer
         *************************************** */
        // footerSection={null}
        // footerSection={<Footer layoutQuery={layoutQuery} />}
        footerSection={
          <>
            {/* <Portal>
              <Box
                sx={{
                  position: 'fixed',
                  right: 10,
                  bottom: { xs: 40, md: 32 },
                  zIndex: (t) => t.zIndex.tooltip,
                }}
              >
                <Tooltip title="Chat with us" placement="left" arrow>
                  <IconButton
                    sx={{
                      width: 56, height: 56,
                      bgcolor: 'background.paper',
                      boxShadow: 3,
                      // borderRadius: '50%',
                      color: 'primary.dark',
                      '&:hover': {
                        color: 'primary.main',
                        transform: 'scale(1.15) rotate(10deg)', 
                        boxShadow: 6,
                      },
                      '@keyframes bounce': {
                        '0%, 100%': { transform: 'translateY(0)' },
                        '50%': { transform: 'translateY(-6px)' },
                      },
                      animation: 'bounce 1s infinite',
                    }}
                    onClick={null}
                  >
                    <Iconify icon="cryptocurrency:chat" sx={{ width: 50, height: 50, }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Portal> */}
            <ChatLauncher
              componentId='chat-with-operators'
              operators={operators}
            />
            <CustomFooter roleName={roleName} />
          </>
        }
        /** **************************************
         * Style
         *************************************** */
        cssVars={{
          ...navColorVars.layout,
          '--layout-transition-easing': 'linear',
          '--layout-transition-duration': '120ms',
          '--layout-nav-mini-width': '88px',
          '--layout-nav-vertical-width': '280px',
          '--layout-nav-horizontal-height': '64px',
          '--layout-dashboard-content-pt': theme.spacing(1),
          '--layout-dashboard-content-pb': theme.spacing(8),
          '--layout-dashboard-content-px': theme.spacing(5),
        }}
        sx={{
          [`& .${layoutClasses.hasSidebar}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
              pl: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
            },
          },
          ...sx,
        }}
      >
        <Main isNavHorizontal={isNavHorizontal}>{children}</Main>
      </LayoutSection>
      {runNavVertical && !runDashboard && !runNavTop && (
        <OnboardingGuide
          run={runNavVertical}
          setRun={setRunNavVertical}
          ready={!runDashboard}
          onFinish={finishNavVertical}
          stepFilters={(step) => step.module === 'nav_vertical'}
          disableBeacon={!runDashboard}
        />
      )}
      {runNavTop && !runDashboard && !runNavVertical && (
        <OnboardingGuide
          run={runNavTop}
          setRun={setRunNavTop}
          ready={!runNavVertical}
          onFinish={finishNavTop}
          stepFilters={(step) => step.module === 'nav_top'}
          disableBeacon={!runNavVertical}
        />
      )}

    </>
  );
}
