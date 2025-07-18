import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';

import { DashboardContent } from 'src/layouts/dashboard';
import { _bookings, _bookingNew, _bookingReview, _bookingsOverview } from 'src/_mock';
import {
  BookingIllustration,
  CheckInIllustration,
  CheckoutIllustration,
  ServerErrorIllustration,
} from 'src/assets/illustrations';

import dayjs from 'dayjs';

import { PurchaseListView } from 'src/sections/purchase/view';
import { AdminBooked } from '../admin-booked';
import { AdminNewest } from '../admin-newest';
import { AdminDetails } from '../admin-details';
import { AdminAvailable } from '../admin-available';
import { AdminStatistics } from '../admin-statistics';
import { AdminTotalIncomes } from '../admin-total-incomes';
import { AdminWidgetSummary } from '../admin-widget-summary';
import { AdminCheckInWidgets } from '../admin-check-in-widgets';
import { AdminCustomerReviews } from '../admin-customer-reviews';



// ----------------------------------------------------------------------

export function OverviewAdminView({
  loadedRewardPoints,
  refetchRewardPoints,
  loadingRewardPoints,
  errorRewardPoints,
  loadedRewardPointsHistory,
  refetchRewardPointsHistory,
  loadingRewardPointsHistory,
  errorRewardPointsHistory,
  loadedUsers,
  loadedPendingUsers,
  refetchUsers,
  loadingUsers,
  errorUsers,
  loadedStoreProducts,
  refetchStoreProducts,
  loadingStoreProducts,
  errorStoreProducts,
}) {

  const totalApprovedClients = useMemo(
    () => loadedUsers?.filter((u) => u.userRole?.name === 'client')?.length || 0,
    [loadedUsers]
  );

  const totalPendingClients = useMemo(
    () => loadedPendingUsers?.filter((u) => u.userRole?.name === 'client')?.length || 0,
    [loadedPendingUsers]
  );

  const totalClients = totalApprovedClients + totalPendingClients;

  const spentRewardPoints = useMemo(
    () => loadedRewardPoints?.reduce((total, point) => total + point.totalSpentPoints, 0) || 0,
    [loadedRewardPoints]
  );

  const refundedRewardPoints = useMemo(
    () => loadedRewardPointsHistory?.reduce((total, point) => total + point.gainedPoints, 0) || 0,
    [loadedRewardPointsHistory]
  );

  const invoicesAmount = useMemo(
    () => loadedRewardPoints?.reduce((total, point) => total + point.totalAmountInvoices, 0) || 0,
    [loadedRewardPoints]
  );

  const invoicesSeriesByMonth = useMemo(
    () => accumulateByMonth(loadedRewardPoints || [], 'invoices', 'paymentMade', 'date'),
    [loadedRewardPoints]
  );

  const usersSeriesByMonth = useMemo(
    () => accumulateByMonth(loadedUsers || [], null, null, 'createdTime'),
    [loadedUsers]
  );

  const avgUsersTrendPercent = useMemo(() => {
    if (usersSeriesByMonth.length === 0) return 0;
    return usersSeriesByMonth.length > 0 ?
      avgStepTrendPercent(
        usersSeriesByMonth.slice(
          usersSeriesByMonth.length - 12, usersSeriesByMonth.length
        ).map((item) => item.total)
      ) : 0;
  }, [usersSeriesByMonth]);

  const pendingUsersSeriesByMonth = useMemo(
    () => accumulateByMonth(loadedPendingUsers || [], null, null, 'createdTime'),
    [loadedPendingUsers]
  );

  const avgPendingUsersTrendPercent = useMemo(() => {
    if (pendingUsersSeriesByMonth.length === 0) return 0;
    return pendingUsersSeriesByMonth.length > 0 ?
      avgStepTrendPercent(
        pendingUsersSeriesByMonth.slice(
          pendingUsersSeriesByMonth.length - 12, pendingUsersSeriesByMonth.length
        ).map((item) => item.total)
      ) : 0;
  }, [pendingUsersSeriesByMonth]);

  const spentSeriesByMonth = useMemo(
    () => accumulateByMonth(loadedRewardPoints || [], null, 'totalSpentPoints', 'createdTime'),
    [loadedRewardPoints]
  );

  const avgSpentTrendPercent = useMemo(() => {
    if (spentSeriesByMonth.length === 0) return 0;
    return spentSeriesByMonth.length > 0 ?
      avgStepTrendPercent(
        spentSeriesByMonth.slice(
          spentSeriesByMonth.length - 12, spentSeriesByMonth.length
        ).map((item) => item.total)
      ) : 0;
  }, [spentSeriesByMonth]);

  const refundSeriesByMonth = useMemo(
    () => accumulateByMonth(loadedRewardPointsHistory || [], null, 'gainedPoints', 'createdTime'),
    [loadedRewardPointsHistory]
  );

  const avgRefundTrendPercent = useMemo(() => {
    if (refundSeriesByMonth.length === 0) return 0;
    return refundSeriesByMonth.length > 0 ?
      avgStepTrendPercent(
        refundSeriesByMonth.slice(
          refundSeriesByMonth.length - 12, refundSeriesByMonth.length
        ).map((item) => item.total)
      ) : 0;
  }, [refundSeriesByMonth]);

  const seriesPoints = useMemo(
    () => {
      const quantitySpent = loadedRewardPoints?.reduce((acc, point) => acc + point.totalSpentPoints, 0) || 0;
      const quantityRefunded = loadedRewardPointsHistory?.reduce((acc, point) => acc + point.gainedPoints, 0) || 0;
      const quantityGained = loadedRewardPoints?.reduce((acc, point) => acc + point.totalGainedPoints, 0) || 0;
      const quantityAssigned = loadedRewardPoints?.reduce((acc, point) => acc + point.totalAssignedPoints, 0) || 0;
      const total = quantitySpent + quantityRefunded + quantityGained + quantityAssigned;
      return [
        {
          name: 'spent',
          fullName: 'Spent Reward Points',
          quantity: quantitySpent,
          value: total > 0 ? (quantitySpent / total) * 100 : 0,
        },
        {
          name: 'refunded',
          fullName: 'Refunded Reward Points',
          quantity: quantityRefunded,
          value: total > 0 ? (quantityRefunded / total) * 100 : 0,
        },
        {
          name: 'gained',
          fullName: 'Gained Reward Points',
          quantity: quantityGained,
          value: total > 0 ? (quantityGained / total) * 100 : 0,
        },
        {
          name: 'assigned',
          fullName: 'Assigned Reward Points',
          quantity: quantityAssigned,
          value: total > 0 ? (quantityAssigned / total) * 100 : 0,
        }
      ]
    }, [loadedRewardPoints, loadedRewardPointsHistory]
  );

  const reviews = useMemo(
    () => loadedStoreProducts?.flatMap((product) =>
      (product.reviews || []).map((review) => ({
        ...review,
        name: product.name,
        description: review.description || '',
      }))
    ) || [],
    [loadedStoreProducts]
  );

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3} disableEqualOverflow>
        <Grid xs={12} md={3}>
          <AdminWidgetSummary
            title="Total clients"
            percent={avgUsersTrendPercent}
            total={totalClients}
            icon={<BookingIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <AdminWidgetSummary
            title="Pending approval clients"
            percent={avgPendingUsersTrendPercent}
            total={totalPendingClients}
            icon={<ServerErrorIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <AdminWidgetSummary
            title="Spent reward points"
            percent={avgSpentTrendPercent}
            total={spentRewardPoints}
            icon={<CheckInIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <AdminWidgetSummary
            title="Refunded reward points"
            percent={avgRefundTrendPercent}
            total={refundedRewardPoints}
            icon={<CheckoutIllustration />}
          />
        </Grid>

        <Grid container xs={12}>
          <Grid xs={12} md={7} lg={8}>
            <Box
              sx={{
                mb: 3,
                p: { md: 1 },
                display: 'flex',
                gap: { xs: 3, md: 1 },
                borderRadius: { md: 2 },
                flexDirection: 'column',
                bgcolor: { md: 'background.neutral' },
              }}
            >
              <Box
                sx={{
                  p: { md: 1 },
                  display: 'grid',
                  gap: { xs: 3, md: 0 },
                  borderRadius: { md: 2 },
                  bgcolor: { md: 'background.paper' },
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
                }}
              >
                <AdminTotalIncomes
                  title="Total Invoices Amount"
                  total={invoicesAmount}
                  percent={avgStepTrendPercent(invoicesSeriesByMonth.map((item) => item.total))}
                  chart={{
                    categories: invoicesSeriesByMonth.slice(
                      invoicesSeriesByMonth.length - 12, invoicesSeriesByMonth.length
                    ).map((item) => item.period),
                    series: [{
                      data: invoicesSeriesByMonth.slice(
                        invoicesSeriesByMonth.length - 12, invoicesSeriesByMonth.length
                      ).map((item) => item.total)
                    }],
                  }}
                />

                <AdminBooked
                  title="Reward Points Overview"
                  data={seriesPoints || []}
                  sx={{ boxShadow: { md: 'none' } }}
                />
              </Box>

              <AdminCheckInWidgets
                chart={{
                  series: [
                    { label: 'Sold', percent: 73.9, total: 38566 },
                    { label: 'Pending for payment', percent: 45.6, total: 18472 },
                  ],
                }}
                sx={{ boxShadow: { md: 'none' } }}
              />
            </Box>

            <AdminStatistics
              title="Statistics"
              chart={{
                series: [
                  {
                    name: 'Weekly',
                    categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                    data: [
                      { name: 'Sold', data: [24, 41, 35, 151, 49] },
                      { name: 'Canceled', data: [20, 56, 77, 88, 99] },
                    ],
                  },
                  {
                    name: 'Monthly',
                    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                    data: [
                      { name: 'Sold', data: [83, 112, 119, 88, 103, 112, 114, 108, 93] },
                      { name: 'Canceled', data: [46, 46, 43, 58, 40, 59, 54, 42, 51] },
                    ],
                  },
                  {
                    name: 'Yearly',
                    categories: ['2018', '2019', '2020', '2021', '2022', '2023'],
                    data: [
                      { name: 'Sold', data: [76, 42, 29, 41, 27, 96] },
                      { name: 'Canceled', data: [46, 44, 24, 43, 44, 43] },
                    ],
                  },
                ],
              }}
            />
          </Grid>

          <Grid xs={12} md={5} lg={4}>
            <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
              <AdminAvailable
                title="Tours available"
                chart={{
                  series: [
                    { label: 'Sold out', value: 120 },
                    { label: 'Available', value: 66 },
                  ],
                }}
              />

              <AdminCustomerReviews
                title="Customer reviews"
                subheader={`${reviews?.length} Reviews`}
                list={reviews}
              />
            </Box>
          </Grid>
        </Grid>

        <Grid xs={12}>
          <AdminNewest
            title="Newest booking"
            subheader={`${_bookingNew.length} bookings`}
            list={_bookingNew}
          />
        </Grid>

        <Grid xs={12}>
          <AdminDetails
            title="Last purchases"
          />
          {/* <PurchaseListView lengthLimit={5} /> */}
        </Grid>
      </Grid>
    </DashboardContent>
  );
}


function accumulateByMonth(
  data,
  attribute = null,
  cumulateAttribute = null,
  joinAttribute = null
) {

  const allData = attribute ? data.flatMap(entry => entry[attribute]) : data;

  const byMonth = allData.reduce((acc, inv) => {
    const d = dayjs(inv[joinAttribute]);
    const key = `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + (cumulateAttribute ? inv[cumulateAttribute] : 1);
    return acc;
  }, {});

  return Object.entries(byMonth)
    .map(([period, total]) => ({ period, total }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function avgStepTrendPercent(arr) {
  if (!Array.isArray(arr) || arr.length < 1) return null;
  const first = arr[0];
  const last = arr[arr.length - 1];
  const n = arr.length - 1;
  if (first <= 0) return null;
  const factor = last / first;
  return factor !== 1 ? (factor ** (1 / n) - 1) * 100 : (factor) * 100;
}
