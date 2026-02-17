import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DealerportalOrderListView } from 'src/sections/dealerportal-order/view';

// ----------------------------------------------------------------------

const metadata = { title: `Order list | Dashboard - ${CONFIG.appName}` };

const userLogged = JSON.parse(sessionStorage.getItem('userLogged'));

const roleName = userLogged?.data?.user_role?.name || '';

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DealerportalOrderListView />

      {/* {roleName !== 'office staff' ? (
        <PurchaseListView />
      ) : (
        <PurchaseOfficeListView />
      )} */}
    </>
  );
}
