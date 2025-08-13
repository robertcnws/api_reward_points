import dayjs from 'dayjs';
import { useMemo, useCallback, useContext } from 'react';

import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import { Box, Alert, Typography, LinearProgress } from '@mui/material';
import { Iconify } from 'src/components/iconify';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate, fDateTime } from 'src/utils/format-time';
import { buildInvoicesChart, reduceList } from 'src/utils/invoice-utils';

import { DashboardContent } from 'src/layouts/dashboard';
import { MotivationIllustration } from 'src/assets/illustrations';

import { useDataContext } from 'src/auth/context/data/data-context';
import { LoadingContext } from 'src/auth/context/loading-context';

import { EcommerceWelcome } from '../ecommerce-welcome';
import { EcommerceRewardPointsAttribute } from '../ecommerce-amount-spent';
import { EcommerceInvoicesListItems } from '../ecommerce-invoices-list-items';
import { EcommerceNewrewardStoreProducts } from '../ecommerce-new-reward-store-products';
import { EcommerceRewardPointsHistoryList } from '../ecommerce-reward-points-history-list';
import { EcommerceWebsiteVisits } from '../ecommerce-website-visits';




// ----------------------------------------------------------------------

export function OverviewEcommerceView({
  loadedRewardPoints,
  refetchRewardPoints,
  loadingRewardPoints,
  errorRewardPoints,
}) {

  const {
    loadedStoreProducts,
    loadedRewardPointsHistory,
    loadingRewardPointsHistory,
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
    <DashboardContent maxWidth="xl">
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
        <Grid container spacing={3}>
          <Grid xs={12} md={images.length > 0 ? 8 : 12}>
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
                      Welcome 🎉 to your Customer Portal
                    </Typography>
                    <Typography variant="h6">
                      Client: <b>{displayFirstName} {displayLastName}</b>
                    </Typography>
                    <Typography variant="h6">
                      Company: <b>{displayCompanyName}</b>
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 1 }}>
                    Last login: <b>{fDateTime(userLogged?.data?.last_login)}</b>
                  </Typography>
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
                    bgcolor: 'primary.main',
                    p: 1,
                    borderRadius: 1,
                    mb: 2
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
              img={<MotivationIllustration hideBackground />}
              action={
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    router.push(paths.dashboard.storeProduct.root);
                  }}
                >
                  Go now
                </Button>
              }
            />
          </Grid>

          {images.length > 0 && (
            <Grid xs={12} md={4}>
              <EcommerceNewrewardStoreProducts list={loadedStoreProducts} />
            </Grid>
          )}

          <Grid xs={12} md={3}>
            <EcommerceRewardPointsAttribute
              title="Orders Amount (USD)"
              icon='noto:money-with-wings'
              percent={invoicesTrendPercent || 0}
              total={totalAmountInvoices}
              bgcolor='info.lighter'
              isMoney
              indicatorName='(10 days)'
              chart={{
                categories: invoicesDateArray,
                series: invoicesPaymentMadeArray,
              }}
            />
          </Grid>

          <Grid xs={12} md={3}>
            <EcommerceRewardPointsAttribute
              title="Opened Balance Amount (USD)"
              icon='streamline-ultimate-color:accounting-coins'
              percent={openedBalanceInvoicesTrendPercent || 0}
              total={totalOpenedBalanceInvoices}
              bgcolor='error.lighter'
              isMoney
              indicatorName='(10 days)'
              chart={{
                colors: [theme.vars.palette.error.light, theme.vars.palette.error.main],
                categories: openedBalanceInvoicesDateArray,
                series: openedBalanceInvoicesPaymentMadeArray,
              }}
            />
          </Grid>

          <Grid xs={12} md={3}>
            <EcommerceRewardPointsAttribute
              title="Orders Count"
              icon='streamline-ultimate-color:performance-increase'
              percent={currentAssignedTrendPercent || 0}
              total={qtyAllOrders}
              bgcolor='success.lighter'
              indicatorName='(10 days)'
              chart={{
                colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
                categories: currentAssignedDateArray,
                series: currentAssignedPointsArray,
              }}
            />
          </Grid>


          {/* <Grid xs={12} md={3}>
            <EcommerceRewardPointsAttribute
              title="Current Points"
              icon='streamline-stickies-color:star'
              percent={currentGainedTrendPercent || 0}
              total={totalAvailablePoints}
              bgcolor='success.lighter'
              chart={{
                colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
                categories: currentGainedDateArray,
                series: currentGainedPointsArray,
              }}
            />
          </Grid> */}

          <Grid xs={12} md={3}>
            <EcommerceRewardPointsAttribute
              title="Pending Orders"
              // icon='fluent-color:reward-24'
              icon='streamline-ultimate-color:time-clock-hand-1'
              percent={currentAssignedTrendPercent || 0}
              total={qtyPendingOrders}
              bgcolor='secondary.lighter'
              indicatorName='(10 days)'
              chart={{
                colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
                categories: currentAssignedDateArray,
                series: currentAssignedPointsArray,
              }}
            />
          </Grid>



          {/* <Grid xs={12} md={2.4}>
            <EcommerceRewardPointsAttribute
              title="Substracted Points"
              icon='fluent-color:error-circle-16'
              percent={currentSubstractedTrendPercent || 0}
              total={totalSubstractedPoints}
              bgcolor='error.lighter'
              chart={{
                colors: [theme.vars.palette.error.light, theme.vars.palette.error.main],
                categories: currentSubstractedDateArray,
                series: currentSubstractedPointsArray,
              }}
            />
          </Grid> */}

          {/* <Grid xs={12} md={6} lg={4}>
            <EcommerceSaleByGender
              title="Sale by gender"
              total={2324}
              chart={{
                series: [
                  { label: 'Mens', value: 25 },
                  { label: 'Womens', value: 50 },
                  { label: 'Kids', value: 75 },
                ],
              }}
            />
          </Grid>

          <Grid xs={12} md={6} lg={8}>
            <EcommerceYearlySales
              title="Yearly sales"
              subheader="(+43%) than last year"
              chart={{
                categories: [
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ],
                series: [
                  {
                    name: '2022',
                    data: [
                      {
                        name: 'Total income',
                        data: [10, 41, 35, 51, 49, 62, 69, 91, 148, 35, 51, 49],
                      },
                      {
                        name: 'Total expenses',
                        data: [10, 34, 13, 56, 77, 88, 99, 77, 45, 13, 56, 77],
                      },
                    ],
                  },
                  {
                    name: '2023',
                    data: [
                      {
                        name: 'Total income',
                        data: [51, 35, 41, 10, 91, 69, 62, 148, 91, 69, 62, 49],
                      },
                      {
                        name: 'Total expenses',
                        data: [56, 13, 34, 10, 77, 99, 88, 45, 77, 99, 88, 77],
                      },
                    ],
                  },
                ],
              }}
            />
          </Grid> */}

          {/* <Grid xs={12} md={6} lg={8}>
            <EcommerceSalesOverview title="Sales overview" data={_ecommerceSalesOverview} />
          </Grid>

          <Grid xs={12} md={6} lg={4}>
            <EcommerceCurrentBalance
              title="Current balance"
              earning={25500}
              refunded={1600}
              orderTotal={287650}
              currentBalance={187650}
            />
          </Grid> */}

          <Grid xs={12} md={6} lg={8}>
            {/* <EcommerceInvoicesListItems
              title="Invoices History"
              tableData={sortedInvoices}
              headLabel={[
                { id: 'date', label: 'Date', align: 'left' },
                { id: 'order', label: 'Order' },
                { id: 'totalItems', label: 'Qty of Items', align: 'center' },
                { id: 'paymentMade', label: 'Payment', align: 'right' },
              ]}
            /> */}
            <EcommerceWebsiteVisits
              title='Invoice History'
              metricUnit="USD"
              subheader={`Year: ${new Date().getFullYear()}`}
              chart={{
                categories: barChartInvoicesSeries.categories,
                series: !isMobile ? barChartInvoicesSeries.series : barChartInvoicesSeries.series.slice(0, 2),
              }}
            />
          </Grid>

          <Grid xs={12} md={6} lg={4}>
            {/* <EcommerceLatestProducts title="Latest products" list={_ecommerceLatestProducts} /> */}
            <EcommerceRewardPointsHistoryList
              title='Reward Points History'
              subheader='Latest reward points history'
              loadedRewardPoints={loadedRewardPoints}
              refetchRewardPoints={refetchRewardPoints}
            />
          </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}
