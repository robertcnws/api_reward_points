import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { JwtResetPasswordView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

const metadata = { title: `Reset password | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <JwtResetPasswordView />
    </>
  );
}
