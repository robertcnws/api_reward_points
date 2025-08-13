import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { InvoicesList } from 'src/sections/invoice/view';

import { useDataContext } from 'src/auth/context/data/data-context';

// ----------------------------------------------------------------------

const metadata = { title: `Invoices list | Dashboard - ${CONFIG.appName}` };

export default function Page() {

    const {
        loadedRewardPoints,
        refetchRewardPoints,
        loadingRewardPoints,
        errorRewardPoints,
    } = useDataContext();

    const sortedInvoices = useMemo(() => {
        const invoices = loadedRewardPoints?.invoices ?? [];
        return [...invoices].sort((a, b) => {
            if (a.date && b.date) return dayjs(b.date).diff(dayjs(a.date));
            if (!a.date && b.date) return 1;
            if (a.date && !b.date) return -1;
            return 0;
        });
    }, [loadedRewardPoints?.invoices]);

    return (
        <>
            <Helmet>
                <title> {metadata.title}</title>
            </Helmet>

            <InvoicesList
                title="Invoices History"
                tableData={sortedInvoices}
                headLabel={[
                    { id: 'date', label: 'Date', align: 'left' },
                    { id: 'order', label: 'Sales Order' },
                    // { id: 'order', label: 'INV #' },
                    { id: 'totalItems', label: 'Qty of Items', align: 'center' },
                    { id: 'status', label: 'Status', align: 'center' },
                    { id: 'paymentMade', label: 'Total Payment', align: 'right' },
                    { id: 'taxTotal', label: 'Total Tax', align: 'right' },
                    { id: 'balance', label: 'Balance', align: 'right' },
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
