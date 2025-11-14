import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ItemgroupView } from 'src/sections/itemgroups/view';

// ----------------------------------------------------------------------

const metadata = { title: `Items in Stock | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>                           
      <ItemgroupView />
    </>
  );
}
