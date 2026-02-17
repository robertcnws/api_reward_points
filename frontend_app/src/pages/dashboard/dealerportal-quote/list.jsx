import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DealerportalQuoteListView } from 'src/sections/dealerportal-quote/view';

// ----------------------------------------------------------------------

const metadata = { title: `Quote list | Dashboard - ${CONFIG.appName}` };

const userLogged = JSON.parse(sessionStorage.getItem('userLogged'));

const roleName = userLogged?.data?.user_role?.name || '';

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DealerportalQuoteListView />

      {/* {roleName !== 'office staff' ? (
        <PurchaseListView />
      ) : (
        <PurchaseOfficeListView />
      )} */}
    </>
  );
}
