import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { JwtUpdatePasswordView } from 'src/auth/view/jwt';
import { useRewardLoginUserRecoveryCodeByEmail } from 'src/_mock/__reward-login-users-recovery-code';
import { useParams, useSearchParams } from 'src/routes/hooks';
import { fieldsUserRecoveryCode } from 'src/auth/context/data/field-descriptors/field-descriptors-login-users-recovery-code';
import { Alert, Box, LinearProgress, Typography } from '@mui/material';
import { b64urlDecode } from 'src/utils/obfuscate';
import { paths } from 'src/routes/paths';
import { FormReturnLink } from 'src/auth/components/form-return-link';
import { useEffect, useMemo } from 'react';

// ----------------------------------------------------------------------

const metadata = { title: `Update password | ${CONFIG.appName}` };

export default function Page() {

  const searchParams = useSearchParams();

  const email = searchParams.get('email');

  const decodeEmail = useMemo(() => email ? b64urlDecode(email) : null, [email]);

  const isValidEmail = /\S+@\S+\.\S+/.test(decodeEmail);

  const {
    loading: loadingRecoverPasswordData,
    error: errorRecoverPasswordData,
    data: recoverPasswordData,
    refetch: refetchRecoverPasswordData
  } = useRewardLoginUserRecoveryCodeByEmail(decodeEmail, fieldsUserRecoveryCode);

  useEffect(() => {
    if (refetchRecoverPasswordData) {
      refetchRecoverPasswordData?.().catch((error) => {
        console.error('Error refetching recovery password data:', error);
      });
    }
  }, [refetchRecoverPasswordData]);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {(loadingRecoverPasswordData) ? (
        <Box
          sx={{
            width: 350,
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 'auto',
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            Loading recovery info...
          </Typography>
          <LinearProgress
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiLinearProgress-bar': { backgroundColor: 'black' },
              backgroundColor: '#e0e0e0',
            }}
          />
        </Box>
      ) : !decodeEmail ? (
        <Box display='flex' flexDirection='column'>
          <Alert severity="error" sx={{ margin: 'auto', width: '100%', fontSize: 20 }}>
            Email address is required to update password.
          </Alert>
          <FormReturnLink href={paths.auth.jwt.signIn} />
        </Box>
      ) : !isValidEmail ? (
        <Box display='flex' flexDirection='column'>
          <Alert severity="error" sx={{ margin: 'auto', width: '100%', fontSize: 20 }}>
            Email address is invalid.
          </Alert>
          <FormReturnLink href={paths.auth.jwt.signIn} />
        </Box>
      ) : errorRecoverPasswordData ? (
        <Box display='flex' flexDirection='column'>
          <Alert severity="error" sx={{ margin: 'auto', width: '100%', fontSize: 20 }}>
            {errorRecoverPasswordData?.message}
          </Alert>
          <FormReturnLink href={paths.auth.jwt.signIn} />
        </Box>
      ) : !recoverPasswordData?.isExpired ? (
        <JwtUpdatePasswordView recoverData={recoverPasswordData} refetchRecoverData={refetchRecoverPasswordData} />
      ) : (
        <Box display='flex' flexDirection='column'>
          <Alert severity="error" sx={{ margin: 'auto', fontSize: 20 }}>
            Recovery code has expired
          </Alert>
          <FormReturnLink href={paths.auth.jwt.signIn} />
        </Box>
      )}
    </>
  );
}
