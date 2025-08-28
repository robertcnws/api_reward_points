import dayjs from 'dayjs';
import { useMemo, useContext, useCallback, useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import { Box, Typography, LinearProgress, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { axiosInstanceBackend, endpoints } from 'src/utils/axios';

import { fDate, fDateTime } from 'src/utils/format-time';
import { reduceList, buildInvoicesChart } from 'src/utils/invoice-utils';

import { DashboardContent } from 'src/layouts/dashboard';
import { MotivationIllustration } from 'src/assets/illustrations';

import { Iconify } from 'src/components/iconify';
import { useBoolean } from 'src/hooks/use-boolean';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';
import OnboardingGuide from 'src/layouts/dashboard/onboarding-guide';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { EcommerceWelcome } from '../ecommerce-welcome';
import { EcommerceWebsiteVisits } from '../ecommerce-website-visits';
import { EcommerceRewardPointsAttribute } from '../ecommerce-amount-spent';
import { EcommerceNewrewardStoreProducts } from '../ecommerce-new-reward-store-products';
import { EcommerceRewardPointsHistoryList } from '../ecommerce-reward-points-history-list';

// ----------------------------------------------------------------------

export function OverviewEcommerceView({
  loadedRewardPoints,
  refetchRewardPoints,
  loadingRewardPoints,
  errorRewardPoints,
  handleShowTourGuide,
  tookTourGuide,
  showModalTour,
  tookIntroGuide,
  showModalIntro
}) {

  const {
    loadedStoreProducts,
    loadedRewardPointsHistory,
    loadingRewardPointsHistory,
    runDashboard,
    setRunDashboard,
    finishDashboard,
    userByUsername,
    refetchUserByUsername,
    loadingUserByUsername,
    errorUserByUsername,
    loadedAllRewardIntroSteps,
  } = useDataContext();

  const router = useRouter();

  const { isMobile } = useContext(LoadingContext)

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);
  const displayFirstName = useMemo(() => userLogged?.data?.first_name, [userLogged]);
  const displayLastName = useMemo(() => userLogged?.data?.last_name, [userLogged]);
  const displayCompanyName = useMemo(() => userLogged?.data?.company_name, [userLogged]);

  const theme = useTheme();

  // const totalAmountInvoices = useMemo(() => loadedRewardPoints?.totalAmountInvoices || 0, [loadedRewardPoints]);
  const totalAvailablePoints = useMemo(() => loadedRewardPoints?.totalAvailablePoints || 0, [loadedRewardPoints]);
  // const totalOpenedBalanceInvoices = useMemo(() => loadedRewardPoints?.totalOpenedBalanceInvoices || 0, [loadedRewardPoints]);
  // const qtyPendingOrders = useMemo(() => loadedRewardPoints?.qtyPendingOrders || 0, [loadedRewardPoints]);
  // const qtyAllOrders = useMemo(() => loadedRewardPoints?.salesOrders?.length || 0, [loadedRewardPoints]);

  const firstDayYear = useMemo(() => {
    const firstDay = new Date(new Date().getFullYear(), 0, 1);
    return firstDay.toISOString().split('T')[0];
  }, []);

  const lastDayYear = useMemo(() => {
    const lastDay = new Date(new Date().getFullYear(), 11, 31);
    return lastDay.toISOString().split('T')[0];
  }, []);

  const inYear = useMemo(
    () => (inv) =>
      dayjs(inv.date).isAfter(firstDayYear) &&
      dayjs(inv.date).isBefore(lastDayYear),
    [firstDayYear, lastDayYear]
  );

  const totalAmountInvoices = useMemo(
    () => reduceList(loadedRewardPoints?.invoices, inYear, { by: 'paymentMade' }),
    [loadedRewardPoints, inYear]
  );

  const openedInYear = useMemo(
    () => (inv) => inYear(inv) && inv.balance > 0,
    [inYear]
  );

  const totalOpenedBalanceInvoices = useMemo(
    () => reduceList(loadedRewardPoints?.invoices, openedInYear, { by: 'balance' }),
    [loadedRewardPoints, openedInYear]
  );

  const pendingInYear = useMemo(
    () => (inv) => inYear(inv) && inv.status !== 'fulfilled' && inv.status !== 'draft',
    [inYear]
  );

  const qtyPendingOrders = useMemo(
    () => reduceList(loadedRewardPoints?.salesOrders, pendingInYear, { by: 'count' }),
    [loadedRewardPoints, pendingInYear]
  );

  const qtyAllOrders = useMemo(
    () => reduceList(loadedRewardPoints?.salesOrders, inYear, { by: 'count' }),
    [loadedRewardPoints, inYear]
  );

  const images = useMemo(() => {
    const imagesFiles = [];
    if (loadedStoreProducts && loadedStoreProducts.length > 0) {
      imagesFiles.push(...loadedStoreProducts.map((item) =>
        item?.attachments?.map((attachment) => ({
          ...attachment,
          productName: item.name,
          productId: item.id,
        })).flat() || []
      ).flat());
    }
    return imagesFiles;
  }, [loadedStoreProducts]);


  const sortedInvoices = useMemo(() => {
    const invoices = loadedRewardPoints?.invoices ?? [];
    return [...invoices].sort((a, b) => {
      if (a.date && b.date) return dayjs(b.date).diff(dayjs(a.date));
      if (!a.date && b.date) return 1;
      if (a.date && !b.date) return -1;
      return 0;
    });
  }, [loadedRewardPoints?.invoices]);

  const barChartInvoicesSeries = useMemo(
    () => buildInvoicesChart(loadedRewardPoints?.invoices, { year: 2025, by: 'amount' }), // o by: 'amount'
    [loadedRewardPoints?.invoices]
  );

  const seriesFromInvoices = useCallback((attributeName, attributeData, sliceNumber = null, conditions = null) => {
    if (!sortedInvoices) return [];
    const initialList = conditions ? sortedInvoices?.filter(conditions) : sortedInvoices;
    const finalList = sliceNumber ? initialList.slice(0, sliceNumber) : initialList;
    const series = finalList.map((invoice) => {
      const xData = invoice[attributeName] || '';
      const yData = invoice[attributeData] || 0;
      return {
        name: xData,
        value: yData,
      };
    });
    return series || [];
  }, [sortedInvoices]);

  const seriesFromHistory = useCallback((attributeName, types, attributeData, sliceNumber = 10) => {
    const initialList = loadedRewardPointsHistory || [];
    const sortedList = [...initialList].sort((a, b) => {
      if (a[attributeName] && b[attributeName]) return dayjs(b[attributeName]).diff(dayjs(a[attributeName]));
      if (!a[attributeName] && b[attributeName]) return 1;
      if (a[attributeName] && !b[attributeName]) return -1;
      return 0;
    });
    const finalList = sliceNumber ? sortedList.slice(0, sliceNumber) : sortedList;
    const reverseList = finalList.reverse();
    const series = reverseList?.filter(item => types.includes(item.action))
      .map((item) => {
        const xData = item[attributeName] || '';
        const yData = item[attributeData] || 0;
        return {
          name: xData,
          value: yData,
        };
      });
    return series || [];
  }, [loadedRewardPointsHistory]);

  const avgStepTrendPercent = (arr) => {
    if (!Array.isArray(arr) || arr.length < 2) return null;
    const first = arr[0];
    const last = arr[arr.length - 1];
    const n = arr.length - 1;
    if (first <= 0) return null;
    const factor = last / first;
    return (factor ** (1 / n) - 1) * 100;
  }

  const invoicesDateArray = useMemo(
    () => seriesFromInvoices('date', 'paymentMade', 10, null).map(item => fDate(item.name)),
    [seriesFromInvoices]
  );

  const invoicesPaymentMadeArray = useMemo(
    () => seriesFromInvoices('date', 'paymentMade', 10, null).map(item => item.value),
    [seriesFromInvoices]
  );

  const invoicesTrendPercent = useMemo(
    () => avgStepTrendPercent(invoicesPaymentMadeArray),
    [invoicesPaymentMadeArray]
  );

  const openedBalanceInvoicesDateArray = useMemo(
    () => {
      const conditions = (invoice) => invoice.balance > 0;
      return seriesFromInvoices('date', 'balance', 10, conditions).map(item => fDate(item.name));
    }, [seriesFromInvoices]
  );

  const openedBalanceInvoicesPaymentMadeArray = useMemo(
    () => {
      const conditions = (invoice) => invoice.balance > 0;
      return seriesFromInvoices('date', 'balance', 10, conditions).map(item => item.value);
    }, [seriesFromInvoices]
  );

  const openedBalanceInvoicesTrendPercent = useMemo(
    () => avgStepTrendPercent(openedBalanceInvoicesPaymentMadeArray),
    [openedBalanceInvoicesPaymentMadeArray]
  );

  const currentAssignedDateArray = useMemo(
    () => seriesFromHistory('createdTime', ['assigned'], 'gainedPoints').map(item => fDateTime(item.name)),
    [seriesFromHistory]
  );
  const currentAssignedPointsArray = useMemo(
    () => seriesFromHistory('createdTime', ['assigned'], 'gainedPoints').map(item => item.value),
    [seriesFromHistory]
  );
  const currentAssignedTrendPercent = useMemo(
    () => avgStepTrendPercent(currentAssignedPointsArray),
    [currentAssignedPointsArray]
  );

  return (
    <>
      {!showModalIntro.value && (
        <DashboardContent maxWidth="xl"
          sx={{
            display: showModalIntro.value ? 'none' : ''
          }}>
          {(loadingRewardPointsHistory || loadingRewardPoints) ? (
            <Box
              sx={{
                width: 350,
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto',
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                {`Loading reward points for ${displayFirstName} ${displayLastName}...`}
              </Typography>
              <LinearProgress
                sx={{
                  mb: 2,
                  width: '100%',
                  '& .MuiLinearProgress-bar': { backgroundColor: 'black' },
                  backgroundColor: '#e0e0e0',
                }}
              />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{
              display: showModalIntro.value && !loadingRewardPoints && !loadingRewardPointsHistory && !tookIntroGuide ? 'none' : ''
            }}>
              <Grid xs={12} md={images.length > 0 ? 8 : 12}>
                <Box id='dashboard-overview'>
                  <EcommerceWelcome
                    title={
                      <Box sx={{
                        mb: 1,
                        textAlign: { xs: 'center', md: 'left' },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                      }}>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                        }}>
                          <Typography variant="h4">
                            Welcome 🎉 {`${displayFirstName} ${displayLastName}`}
                          </Typography>
                          {!isMobile && (
                            <>
                              <Typography variant="h6">
                                Company: <b>{displayCompanyName}</b>
                              </Typography>
                            </>
                          )}
                        </Box>
                        {!isMobile && (
                          <Typography variant="caption" sx={{ opacity: 0.8, mt: 1 }}>
                            Last login: <b>{fDateTime(userLogged?.data?.last_login)}</b>
                          </Typography>
                        )}
                      </Box>
                    }
                    isCompound
                    description={
                      <Box sx={{
                        mb: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: { xs: 'center', md: 'flex-start' },
                        gap: -1,
                      }}>
                        <Typography variant="body2" sx={{ opacity: 0.64, mb: 2 }}>
                          You currently have a TOTAL of {' '}
                        </Typography>
                        {/* <Alert severity="success" sx={{ mb: 2, fontSize: '1rem', width: '100%' }}>
                    <strong>
                      {totalAvailablePoints || 0}
                    </strong>{' '}reward points
                  </Alert> */}
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 1,
                          // bgcolor: 'primary.main',
                          p: 1,
                          borderRadius: 1,
                          mb: 2,
                          backgroundColor: 'primary.dark',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                          },
                        }}>
                          <Iconify
                            icon="streamline-cyber-color:bookmark-favorite-star"
                            sx={{
                              mt: -0.5,
                              width: 24,
                              height: 24,
                            }}
                          />
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {totalAvailablePoints || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.85 }}>
                            reward points
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.64 }}>
                          You can use them to get discounts on your next purchases.
                        </Typography>
                      </Box>
                    }
                    img={!isMobile ? <MotivationIllustration hideBackground /> : null}
                    action={
                      <Button
                        variant="contained"
                        sx={{
                          alignSelf: 'flex-start',
                          backgroundColor: 'primary.dark',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                          },
                          color: 'whitesmoke',
                        }}
                        onClick={() => {
                          router.push(paths.dashboard.storeProduct.root);
                        }}
                      >
                        <Iconify icon="icons8:buy" sx={{ mr: 1 }} />
                        Redeem rewards!
                      </Button>
                    }
                  />
                </Box>
              </Grid>

              {images?.length > 0 && (
                <Grid xs={12} md={4}>
                  <Box id='rewards-carrousel'>
                    <EcommerceNewrewardStoreProducts list={loadedStoreProducts} />
                  </Box>
                </Grid>
              )}


              <Grid container id='orders-metrics' sx={{ width: '100%' }}>

                <Grid xs={6} md={3}>
                  <EcommerceRewardPointsAttribute
                    title="Orders Amount (USD)"
                    subheader={!isMobile ? `(Current Year ${new Date().getFullYear()})` : `(${new Date().getFullYear()})`}
                    icon='noto:money-with-wings'
                    percent={invoicesTrendPercent || 0}
                    total={totalAmountInvoices}
                    bgcolor='info.lighter'
                    isMoney
                    indicatorName={!isMobile ? '(10 days)' : ''}
                    chart={!isMobile ? {
                      categories: invoicesDateArray,
                      series: invoicesPaymentMadeArray,
                    } : {}}
                  />
                </Grid>

                <Grid xs={6} md={3}>
                  <EcommerceRewardPointsAttribute
                    title="Opened Balance Amount (USD)"
                    subheader={!isMobile ? `(Current Year ${new Date().getFullYear()})` : `(${new Date().getFullYear()})`}
                    icon='streamline-ultimate-color:accounting-coins'
                    percent={openedBalanceInvoicesTrendPercent || 0}
                    total={totalOpenedBalanceInvoices}
                    bgcolor='error.lighter'
                    isMoney
                    indicatorName={!isMobile ? '(10 days)' : ''}
                    chart={!isMobile ? {
                      colors: [theme.vars.palette.error.light, theme.vars.palette.error.main],
                      categories: openedBalanceInvoicesDateArray,
                      series: openedBalanceInvoicesPaymentMadeArray,
                    } : {}}
                  />
                </Grid>

                <Grid xs={6} md={3}>
                  <EcommerceRewardPointsAttribute
                    title="Orders Count"
                    subheader={!isMobile ? `(Current Year ${new Date().getFullYear()})` : `(${new Date().getFullYear()})`}
                    icon='streamline-ultimate-color:performance-increase'
                    percent={currentAssignedTrendPercent || 0}
                    total={qtyAllOrders}
                    bgcolor='success.lighter'
                    indicatorName={!isMobile ? '(10 days)' : ''}
                    chart={!isMobile ? {
                      colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
                      categories: currentAssignedDateArray,
                      series: currentAssignedPointsArray,
                    } : {}}
                  />
                </Grid>

                <Grid xs={6} md={3}>
                  <EcommerceRewardPointsAttribute
                    title="Pending Orders"
                    subheader={!isMobile ? `(Current Year ${new Date().getFullYear()})` : `(${new Date().getFullYear()})`}
                    // icon='fluent-color:reward-24'
                    icon='streamline-ultimate-color:time-clock-hand-1'
                    percent={currentAssignedTrendPercent || 0}
                    total={qtyPendingOrders}
                    bgcolor='secondary.lighter'
                    indicatorName={!isMobile ? '(10 days)' : ''}
                    chart={!isMobile ? {
                      colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
                      categories: !isMobile ? currentAssignedDateArray : [],
                      series: !isMobile ? currentAssignedPointsArray : [],
                    } : {}}
                  />
                </Grid>

              </Grid>


              <Grid xs={12} md={6} lg={8}>
                <Box id='invoice-history-chart' sx={{ width: '100%', height: '100%' }}>
                  <EcommerceWebsiteVisits
                    title='Invoice History'
                    metricUnit="USD"
                    subheader={`Year: ${new Date().getFullYear()}`}
                    chart={{
                      categories: barChartInvoicesSeries.categories,
                      series: !isMobile ? barChartInvoicesSeries.series : barChartInvoicesSeries.series.slice(0, 2),
                    }}
                  />
                </Box>
              </Grid>

              <Grid xs={12} md={6} lg={4}>
                {/* <EcommerceLatestProducts title="Latest products" list={_ecommerceLatestProducts} /> */}
                <Box id='reward-points-history-list' sx={{ width: '100%', height: '100%' }}>
                  <EcommerceRewardPointsHistoryList
                    title='Reward Points History'
                    subheader='Latest reward points history'
                    loadedRewardPoints={loadedRewardPoints}
                    refetchRewardPoints={refetchRewardPoints}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </DashboardContent>
      )}
      {runDashboard && (
        <OnboardingGuide
          run={runDashboard}
          setRun={setRunDashboard}
          ready={loadingRewardPoints && loadingRewardPointsHistory}
          onFinish={finishDashboard}
          stepFilters={(step) => step.module === 'dashboard'}
          disableBeacon
        />
      )}
      
      <ConfirmDialog
        open={!showModalIntro.value && showModalTour.value && !loadingRewardPoints && !loadingRewardPointsHistory && !tookTourGuide}
        onClose={async () => {
          // showModalTour.onFalse();
          await handleShowTourGuide();
        }}
        title="Tour Guide"
        content="Would you like to take a tour of this site?"
        closeName='Skip'
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              await handleShowTourGuide();
              setRunDashboard(true);
              // showModalTour.onFalse();
            }}
          >
            Show Tour
          </Button>
        }
      />
    </>
  );
}
