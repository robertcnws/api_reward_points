import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { FAQTutorialListView } from 'src/sections/faq-tutorial/view';

// ----------------------------------------------------------------------

const metadata = { title: `FAQ & Tutorial | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <FAQTutorialListView />
    </>
  );
}
