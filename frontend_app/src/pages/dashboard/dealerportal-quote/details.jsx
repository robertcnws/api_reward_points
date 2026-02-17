import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useDealerportalQuoteById } from 'src/_mock/__dealerportal-quotes';

import { DealerportalQuoteDetailsView } from 'src/sections/dealerportal-quote/view';

import { fieldsDealerportalQuotes } from 'src/auth/context/data/field-descriptors/field-descriptors-dealerportal-quotes';

// ----------------------------------------------------------------------

const metadata = { title: `Quote details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const userLogged = JSON.parse(sessionStorage.getItem('userLogged') || '{}');

  const roleName = userLogged?.data?.user_role?.name || 'client';

  const {
    loading: quoteLoading,
    error: quoteError,
    data: quote,
    refetch: refetchQuote
  } = useDealerportalQuoteById(id, fieldsDealerportalQuotes);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DealerportalQuoteDetailsView
        quote={quote}
        loading={quoteLoading}
        error={quoteError}
        refetch={refetchQuote}
        roleName={roleName}
      />
    </>
  );
}
