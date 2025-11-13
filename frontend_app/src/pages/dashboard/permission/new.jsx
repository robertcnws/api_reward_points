import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { PermissionCreateView } from 'src/sections/permissions/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new permission | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PermissionCreateView />
    </>
  );
}
