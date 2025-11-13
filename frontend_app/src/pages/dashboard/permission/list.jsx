import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { PermissionListView } from 'src/sections/permissions/view';

// ----------------------------------------------------------------------

const metadata = { title: `Permissions list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PermissionListView />
    </>
  );
}
