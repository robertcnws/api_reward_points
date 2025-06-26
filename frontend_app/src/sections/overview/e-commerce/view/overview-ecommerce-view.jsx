import { useMemo } from 'react';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import { Alert, Box, LinearProgress, Typography } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { MotivationIllustration } from 'src/assets/illustrations';
import {
  _ecommerceNewProducts,
  _ecommerceBestSalesman,
  _ecommerceSalesOverview,
  _ecommerceLatestProducts,
} from 'src/_mock';

import dayjs from 'dayjs';

import { useDataContext } from 'src/auth/context/data/data-context';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { useMockedUser } from 'src/auth/hooks';

import { EcommerceWelcome } from '../ecommerce-welcome';
import { EcommerceNewProducts } from '../ecommerce-new-products';
import { EcommerceYearlySales } from '../ecommerce-yearly-sales';
import { EcommerceBestSalesman } from '../ecommerce-best-salesman';
import { EcommerceSaleByGender } from '../ecommerce-sale-by-gender';
import { EcommerceSalesOverview } from '../ecommerce-sales-overview';
import { EcommerceWidgetSummary } from '../ecommerce-widget-summary';
import { EcommerceLatestProducts } from '../ecommerce-latest-products';
import { EcommerceCurrentBalance } from '../ecommerce-current-balance';
import { EcommerceRewardPointsAttribute } from '../ecommerce-amount-spent';
import { EcommerceInvoicesListItems } from '../ecommerce-invoices-list-items';
import { EcommerceRewardPointsHistoryList } from '../ecommerce-reward-points-history-list';





// ----------------------------------------------------------------------

export function OverviewEcommerceView({
  loadedRewardPoints,
  refetchRewardPoints,
  loadingRewardPoints,
  errorRewardPoints,
}) {

  const {
    loadedRewardPointsHistory,
    refetchRewardPointsHistory,
    loadingRewardPointsHistory,
    errorRewardPointsHistory,
  } = useDataContext();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);
  const displayFirstName = useMemo(() => userLogged?.data?.first_name, [userLogged]);
  const displayLastName = useMemo(() => userLogged?.data?.last_name, [userLogged]);

  const theme = useTheme();

  const totalAmountInvoices = useMemo(() => loadedRewardPoints?.totalAmountInvoices || 0, [loadedRewardPoints]);
  const totalGainedPoints = useMemo(() => loadedRewardPoints?.totalGainedPoints || 0, [loadedRewardPoints]);
  const totalSpentPoints = useMemo(() => loadedRewardPoints?.totalSpentPoints || 0, [loadedRewardPoints]);
  const sortedInvoices = useMemo(() => {
    const invoices = loadedRewardPoints?.invoices ?? [];
    return [...invoices].sort((a, b) => {
      if (a.date && b.date) return dayjs(b.date).diff(dayjs(a.date));
      if (!a.date && b.date) return 1;
      if (a.date && !b.date) return -1;
      return 0;
    });
  }, [loadedRewardPoints?.invoices]);
  const listItems = useMemo(() => {
    if (!sortedInvoices) return [];
    return sortedInvoices.flatMap((invoice) =>
      invoice.lineItems?.map((item) => ({
        id: item?.id,
        name: item?.name,
        sku: item?.sku,
        quantity: item?.quantity,
        rate: item?.rate,
        itemTotal: item?.itemTotal,
        date: invoice?.date,
      })) || []
    );
  }, [sortedInvoices]);

  const sortedRewardPointsHistory = useMemo(() => {
    if (!loadedRewardPointsHistory || !Array.isArray(loadedRewardPointsHistory)) {
      return [];
    }
    const rewardPointsHistory = loadedRewardPointsHistory ?? [];
    const pointsHistory = [...rewardPointsHistory].sort((a, b) => {
      if (a.createdTime && b.createdTime) return dayjs(b.createdTime).diff(dayjs(a.createdTime));
      if (!a.createdTime && b.createdTime) return 1;
      if (a.createdTime && !b.createdTime) return -1;
      return 0;
    });
    return pointsHistory || [];
  }, [loadedRewardPointsHistory]);

  return (
    <DashboardContent maxWidth="xl">
      {!loadedRewardPoints?.totalGainedPoints ? (
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
          <Grid xs={12} md={8}>
            <EcommerceWelcome
              title={`Congratulations 🎉  \n ${displayFirstName} ${displayLastName}`}
              isCompound
              description={
                <>
                  <Box sx={{
                    mb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'center', md: 'flex-start' },
                    gap: -1,
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.64, mb: 2 }}>
                      You have earned a TOTAL of {' '}
                    </Typography>
                    <Alert severity="success" sx={{ mb: 2, fontSize: '1rem', width: '100%' }}>
                      <strong>{loadedRewardPoints?.totalGainedPoints}</strong>{' '}reward points
                    </Alert>
                    <Typography variant="body2" sx={{ opacity: 0.64 }}>
                      You can use them to get discounts on your next purchases.
                    </Typography>
                  </Box>
                </>
              }
              img={<MotivationIllustration hideBackground />}
              action={
                <Button variant="contained" color="primary">
                  Go now
                </Button>
              }
            />
          </Grid>

          <Grid xs={12} md={4}>
            <EcommerceNewProducts list={_ecommerceNewProducts} />
          </Grid>

          <Grid xs={12} md={4}>
            <EcommerceRewardPointsAttribute
              title="Total amount spent (USD)"
              percent={2.6}
              total={totalAmountInvoices}
              bgcolor='info.lighter'
              isMoney
              chart={{
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [22, 8, 35, 50, 82, 84, 77, 12],
              }}
            />
          </Grid>

          <Grid xs={12} md={4}>
            <EcommerceRewardPointsAttribute
              title="Total gained points"
              icon='fluent-color:reward-24'
              percent={-0.1}
              total={totalGainedPoints}
              bgcolor='success.lighter'
              chart={{
                colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [56, 47, 40, 62, 73, 30, 23, 54],
              }}
            />
          </Grid>

          <Grid xs={12} md={4}>
            <EcommerceRewardPointsAttribute
              title="Total spent points"
              percent={0.6}
              total={totalSpentPoints}
              bgcolor='error.lighter'
              chart={{
                colors: [theme.vars.palette.error.light, theme.vars.palette.error.main],
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [40, 70, 75, 70, 50, 28, 7, 64],
              }}
            />
          </Grid>

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
            <EcommerceInvoicesListItems
              title="Purchases History"
              tableData={sortedInvoices}
              headLabel={[
                { id: 'date', label: 'Date', align: 'left' },
                { id: 'order', label: 'Order' },
                { id: 'totalItems', label: 'Qty of Items', align: 'center' },
                { id: 'paymentMade', label: 'Payment', align: 'right' },
              ]}
            />
          </Grid>

          <Grid xs={12} md={6} lg={4}>
            {/* <EcommerceLatestProducts title="Latest products" list={_ecommerceLatestProducts} /> */}
            <EcommerceRewardPointsHistoryList
              title='Reward Points History'
              subheader='Latest reward points history'
              list={sortedRewardPointsHistory}
              loading={loadingRewardPointsHistory}
              error={errorRewardPointsHistory}
              refetch={refetchRewardPointsHistory}
            />
          </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}
