import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { FunctionalityListView } from 'src/sections/functionalities/view';

// ----------------------------------------------------------------------

const metadata = { title: `Functionalities list | Dashboard - ${CONFIG.appName}` };
export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <FunctionalityListView />
    </>
  );
}
