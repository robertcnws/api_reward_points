import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { SalesOrderDetailsView } from 'src/sections/sales-order/view';

import { useDataContext } from 'src/auth/context/data/data-context';

// ----------------------------------------------------------------------

const metadata = { title: `Sales Orders list | Dashboard - ${CONFIG.appName}` };

export default function Page() {

    const {
        loadedRewardPoints,
    } = useDataContext();

    const { id } = useParams();

    const salesOrder = useMemo(() => {
        const salesOrders = loadedRewardPoints?.salesOrders ?? [];
        return [...salesOrders].find((so) => so.id === id)
    }, [loadedRewardPoints?.salesOrders, id]);

    const invoices = useMemo(() => {
        const invoicesAll = loadedRewardPoints?.invoices ?? [];
        return [...invoicesAll].filter((inv) => inv.salesorder?.id === id);
    }, [loadedRewardPoints?.invoices, id]);

    return (
        <>
            <Helmet>
                <title> {metadata.title}</title>
            </Helmet>

            <SalesOrderDetailsView
                salesOrder={salesOrder}
                invoices={invoices}
            />
        </>
    );
}
