import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useContext } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import { Card, Link, Typography } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints, axiosInstanceBackend } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';

import { useAuthContext } from '../../hooks';
import { FormHead } from '../../components/form-head';
import { CustomErrorComponent } from './custom-error-component';
import { signInWithUsernameAndPassword } from '../../context/jwt';



// ----------------------------------------------------------------------

export const SignInSchema = zod.object({
  // email: zod
  //   .string()
  //   .min(1, { message: 'Email is required!' })
  //   .email({ message: 'Email must be a valid email address!' }),
  username: zod
    .string()
    .min(1, { message: 'Username is required!' }),
  password: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(5, { message: 'Password must be at least 6 characters!' }),
  rememberMe: zod.boolean().optional(),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();

  const { isMobile } = useContext(LoadingContext);

  const { checkUserSession } = useAuthContext();

  const BoxEmpty = styled('span')(({ theme }) => ({
    width: 18,
    height: 18,
    display: 'inline-block',
    borderRadius: 4,
    border: `2px solid ${theme.palette.text.secondary}`,
  }));

  const BoxFilled = styled(BoxEmpty)(({ theme }) => ({
    borderColor: theme.palette.primary.dark,
    backgroundColor: theme.palette.primary.dark,
  }));

  // const {
  //   externalUser,
  //   refetchExternalUser,
  // } = useDataContext();

  // console.log('externalUser:', externalUser);

  // useEffect(() => {
  //   async function performTransferLogin() {
  //     if (externalUser && externalUser.isLoggedIn) {
  //       await signInWithTransferLogin({ username: externalUser.username, rememberMe: true });
  //       await checkUserSession?.();
  //       router.refresh();
  //     }
  //   }
  //   performTransferLogin();
  // }, [externalUser, checkUserSession, router]);

  const [errorMsg, setErrorMsg] = useState({
    message: '',
    name: '',
  });

  const password = useBoolean();

  const isSending = useBoolean(false);

  const [titleIsSending, setTitleIsSending] = useState('');

  const defaultValues = {
    // email: 'demo@minimals.cc',
    username: '',
    password: '',
    rememberMe: false,
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // await signInWithPassword({ email: data.email, password: data.password });
      await signInWithUsernameAndPassword({ username: data.username, password: data.password, rememberMe: data.rememberMe });
      await checkUserSession?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMsg({
        message: error.description || error.detail || 'An error occurred during sign in.',
        name: error.error_name || 'SignInError',
      });
      sessionStorage.setItem('userSignedInEmail', error.error_email);
      sessionStorage.setItem('userSignedInUsername', data.username);
    }
  });

  const handleResendCode = async () => {
    console.log('Resend verification code');
    setTitleIsSending('Resending verification code...');
    isSending.onTrue();
    try {
      const payload = {
        email: sessionStorage.getItem('userSignedInEmail'),
        username: sessionStorage.getItem('userSignedInUsername'),
      }
      const resp = await axiosInstanceBackend.post(endpoints.auth.sendVerificationCode, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      if (resp.status === 200) {
        router.push(paths.auth.jwt.verificationCode);
      } else {
        throw new Error('Failed to resend verification code');
      }
    }
    catch (error) {
      console.error('Error resending verification code:', error);
      setErrorMsg({
        message: typeof error === 'string' ? error : error.description,
        name: error.error_name || '',
        email: error.error_email || '',
      });
    }
    finally {
      setTitleIsSending('');
      isSending.onFalse();
    }
  }

  const formSlightGrow = {
    // Aumenta suavemente la altura del input (~+5px)
    '& .MuiOutlinedInput-input': {
      paddingTop: 1,
      paddingBottom: 4,
    },
    // Placeholder centrado también
    '& .MuiInputBase-input::placeholder': {
      // textAlign: 'center',
      opacity: 1,
    },

    // Tipografías un poco más grandes
    '& .MuiInputBase-root': { fontSize: 16 },
    '& .MuiInputLabel-root': { fontSize: 22, width: 'auto', marginTop: -0.5 },
    '& .MuiOutlinedInput-notchedOutline legend > span': { padding: '0 16px' },
    '& .MuiFormHelperText-root': { fontSize: 16, width: '100%' },
    '& .MuiFormControlLabel-label': { width: 'auto' },
  };

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column" sx={{ width: 1 }}>
      {/* <Field.Text name="email" label="Email address" InputLabelProps={{ shrink: true }} /> */}
      <Field.Text
        name="username"
        label="Username"
        InputLabelProps={{
          shrink: true,
          sx: { bgcolor: 'background.paper', px: 0.5, fontSize: 22 },
        }}
        InputProps={{
          notched: true,
          sx: { height: 61 },
          inputProps: { style: { paddingTop: 0, paddingBottom: 0, lineHeight: '61px' } },
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:user-bold" width={20} height={20} />
            </InputAdornment>
          ),
        }}
        sx={{
          minWidth: { xs: 1, sm: 1 },
        }}
      />

      <Box gap={1.5} display="flex" flexDirection="column">
        {/* <Link
          component={RouterLink}
          href="#"
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Forgot password?
        </Link> */}

        <Field.Text
          name="password"
          label="Password"
          placeholder="6+ characters"
          type={password.value ? 'text' : 'password'}
          // InputLabelProps={{ shrink: true }}
          InputProps={{
            notched: true,
            sx: { height: 61 },
            inputProps: { style: { paddingTop: 0, paddingBottom: 0, lineHeight: '61px' } },
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:lock-bold" width={20} height={20} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* <Field.Checkbox
          name="rememberMe"
          slotProps={{
            checkbox: {
              icon: <BoxEmpty />,
              checkedIcon: <BoxFilled />,
              disableRipple: true,
            },
          }}
          label={
            <span>
              Remember me
            </span>
          }
          sx={{ alignSelf: 'flex-start' }}
        /> */}

        <Field.Switch
          name="rememberMe"
          slotProps={{
            switch: {
              // icon: <BoxEmpty />,
              // checkedIcon: <BoxFilled />,
              disableRipple: true,
            },
          }}
          label={
            <span style={{ fontSize: 17 }}>
              Remember me
            </span>
          }
          sx={{ alignSelf: 'flex-start' }}
        />
      </Box>

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Sign in..."
        sx={{
          backgroundColor: 'primary.dark',
          '&:hover': {
            backgroundColor: 'primary.main',
          },
          fontSize: 17
        }}
      >
        Sign in
      </LoadingButton>
    </Box>
  );

  return (
    <Card sx={{
      mt: !isMobile ? 0 : 12,
      p: 3,
      width: 1,
      ml: 0,
      ...formSlightGrow,
    }}>
      <FormHead
        isCompound
        title={
          <Typography variant="h3" paragraph>
            Sign in to your account
          </Typography>
        }
        description={
          <Box
            display="flex"
            justifyContent={isMobile ? 'center' : 'flex-start'}
            alignItems="center"
            gap={1}
            mb={1}
            mt={-3}
          >
            <Typography variant="h5" component="div">
              Don’t have an account?
            </Typography>
            <Link
              component={RouterLink}
              href={paths.auth.jwt.signUp}
              variant="subtitle2"
              sx={{
                fontWeight: 'bold',
                fontSize: 20,
              }}>
              Sign up
            </Link>
          </Box>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {/* <Alert severity="info" sx={{ mb: 3 }}>
        Use <strong>{defaultValues.email}</strong>
        {' with password '}
        <strong>{defaultValues.password}</strong>
      </Alert> */}

      {!!errorMsg.message && (
        <CustomErrorComponent
          errorMsg={errorMsg}
          handleResendCode={handleResendCode}
          actionName="Send"
        />
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </Card>
  );
}
