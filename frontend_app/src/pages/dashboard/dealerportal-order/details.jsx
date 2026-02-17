import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useDealerportalOrderById } from 'src/_mock/__dealerportal-orders';

import { DealerportalOrderDetailsView } from 'src/sections/dealerportal-order/view';

import { fieldsDealerportalOrders } from 'src/auth/context/data/field-descriptors/field-descriptors-dealerportal-orders';

// ----------------------------------------------------------------------

const metadata = { title: `Order details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const userLogged = JSON.parse(sessionStorage.getItem('userLogged') || '{}');

  const roleName = userLogged?.data?.user_role?.name || 'client';

  const {
    loading: orderLoading,
    error: orderError,
    data: order,
    refetch: refetchOrder
  } = useDealerportalOrderById(id, fieldsDealerportalOrders);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DealerportalOrderDetailsView
        order={order}
        loading={orderLoading}
        error={orderError}
        refetch={refetchOrder}
        roleName={roleName}
      />
    </>
  );
}
