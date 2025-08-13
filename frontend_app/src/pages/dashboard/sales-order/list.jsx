import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDataContext } from 'src/auth/context/data/data-context';

import { CONFIG } from 'src/config-global';

import { SalesOrdersList } from 'src/sections/sales-order/view';

// ----------------------------------------------------------------------

const metadata = { title: `Sales Orders list | Dashboard - ${CONFIG.appName}` };

export default function Page() {

    const {
        loadedRewardPoints,
        refetchRewardPoints,
        loadingRewardPoints,
        errorRewardPoints,
    } = useDataContext();

    const sortedSalesOrders = useMemo(() => {
        const salesOrders = loadedRewardPoints?.salesOrders ?? [];
        return [...salesOrders].sort((a, b) => {
            if (a.date && b.date) return dayjs(b.date).diff(dayjs(a.date));
            if (!a.date && b.date) return 1;
            if (a.date && !b.date) return -1;
            return 0;
        });
    }, [loadedRewardPoints?.salesOrders]);

    return (
        <>
            <Helmet>
                <title> {metadata.title}</title>
            </Helmet>

            <SalesOrdersList
                title="Sales Orders History"
                tableData={sortedSalesOrders}
                headLabel={[
                    { id: 'date', label: 'Date', align: 'left' },
                    { id: 'order', label: 'Sales Order' },
                    // { id: 'order', label: 'INV #' },
                    { id: 'totalItems', label: 'Qty of Items', align: 'center' },
                    { id: 'status', label: 'Status', align: 'center' },
                    { id: 'paymentMade', label: 'Total', align: 'right' },
                    { id: 'taxTotal', label: 'Total Tax', align: 'right' },
                    { id: 'salespersonName', label: 'Salesperson', align: 'center' },
                ]}
            />

            {/* {roleName !== 'office staff' ? (
        <PurchaseListView />
      ) : (
        <PurchaseOfficeListView />
      )} */}
        </>
    );
}
