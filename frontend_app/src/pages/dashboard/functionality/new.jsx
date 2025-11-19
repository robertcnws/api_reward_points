import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { FunctionalityCreateView } from 'src/sections/functionalities/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new functionality | Dashboard - ${CONFIG.appName}` };
export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <FunctionalityCreateView />
    </>
  );
}
