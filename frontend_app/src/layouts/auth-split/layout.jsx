import { useContext } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { CONFIG } from 'src/config-global';
import { varAlpha, bgGradient } from 'src/theme/styles';

import { Logo } from 'src/components/logo';

import { LoadingContext } from 'src/auth/context/loading-context';

import { Section } from './section';
import { Main, Content } from './main';
import { CustomFooter } from '../main/footer';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';




// ----------------------------------------------------------------------

export function AuthSplitLayout({ sx, section, children, header }) {
  const layoutQuery = 'md';

  const { isMobile } = useContext(LoadingContext);

  const theme = useTheme();

  return (
    <LayoutSection
      headerSection={
        /** **************************************
         * Header
         *************************************** */
        <HeaderSection
          disableElevation
          layoutQuery={layoutQuery}
          slotProps={{ container: { maxWidth: false } }}
          sx={{
            position:
              { [layoutQuery]: 'fixed' },
            ...header?.sx
          }}
          slots={{
            topArea: (
              <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                This is an info Alert.
              </Alert>
            ),
            leftArea: (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: !isMobile ? 'center' : 'flex-start',
                justifyContent: !isMobile ? 'center' : 'flex-start',
                // minHeight: '100dvh',
                width: 850,
                px: 2,
                // mt: !isMobile ? 150 : 120,
                // ml: !isMobile ? 1 : 0,
                // mb: !isMobile ? 0 : 10,
                mt: !isMobile ? 100 : 10,
                // ml: !isMobile ? 25 : '15%',
                mb: 0
              }}>
                <Logo
                  isSingle={false}
                  sx={{
                    width: !isMobile ? 450 : 100,
                    height: 'auto',
                  }}
                />
                {!isMobile &&
                  <Typography
                    variant="h2"
                    sx={{
                      ml: 0,
                      mt: -8,
                      alignItems: 'center',
                      textAlign: 'center',
                      fontFamily: 'Poppins',
                    }}>
                    Manage and Track<br />Reward Points<br />Effortlessly
                  </Typography>
                }
              </Box>
            ),
            // rightArea: (
            //   <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 1.5 }}>
            //     <Link
            //       href={paths.faqs}
            //       component={RouterLink}
            //       color="inherit"
            //       sx={{ typography: 'subtitle2' }}
            //     >
            //       Need help?
            //     </Link>
            //     <SettingsButton />
            //   </Box>
            // ),
          }}
        />
      }
      /** **************************************
       * Footer
       *************************************** */
      // footerSection={null}
      // footerSection={homePage ? <HomeFooter /> : <Footer layoutQuery={layoutQuery} />}
      // footerSection={<Footer layoutQuery={layoutQuery} />}
      footerSection={<CustomFooter />}
      /** **************************************
       * Style
       *************************************** */
      cssVars={{ '--layout-auth-content-width': '420px' }}
      sx={{
        ...(isMobile ? bgGradient({
          color: `1deg, ${varAlpha(theme.vars.palette.background.neutralChannel, 0.1)},
                    ${varAlpha(theme.vars.palette.background.neutralChannel, 0.1)}`,
          imgUrl: `${CONFIG.assetsDir}/assets/background/bgrewards1.png`,
        }) : {}),
        ...sx
      }}
    >
      <Main layoutQuery={layoutQuery}>
        <Section
          title={section?.title}
          layoutQuery={layoutQuery}
          imgUrl={section?.imgUrl}
          // imgUrl='/logo/logo.png'
          method={CONFIG.auth.method}
          subtitle={section?.subtitle}
          sx={{ bgcolor: 'error.main' }}
        // methods={[
        //   {
        //     label: 'Jwt',
        //     path: paths.auth.jwt.signIn,
        //     icon: `${CONFIG.assetsDir}/assets/icons/platforms/ic-jwt.svg`,
        //   },
        //   {
        //     label: 'Firebase',
        //     path: paths.auth.firebase.signIn,
        //     icon: `${CONFIG.assetsDir}/assets/icons/platforms/ic-firebase.svg`,
        //   },
        //   {
        //     label: 'Amplify',
        //     path: paths.auth.amplify.signIn,
        //     icon: `${CONFIG.assetsDir}/assets/icons/platforms/ic-amplify.svg`,
        //   },
        //   {
        //     label: 'Auth0',
        //     path: paths.auth.auth0.signIn,
        //     icon: `${CONFIG.assetsDir}/assets/icons/platforms/ic-auth0.svg`,
        //   },
        //   {
        //     label: 'Supabase',
        //     path: paths.auth.supabase.signIn,
        //     icon: `${CONFIG.assetsDir}/assets/icons/platforms/ic-supabase.svg`,
        //   },
        // ]}
        />

        <Content layoutQuery={layoutQuery}>{children}</Content>
      </Main>
    </LayoutSection >
  );
}
