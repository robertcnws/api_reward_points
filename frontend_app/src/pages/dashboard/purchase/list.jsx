import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { PurchaseListView } from 'src/sections/purchase/view';

// ----------------------------------------------------------------------

const metadata = { title: `Purchases list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PurchaseListView />
    </>
  );
}
