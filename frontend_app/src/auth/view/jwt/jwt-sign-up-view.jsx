import { z as zod } from 'zod';
import { useState, useContext, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Card, TextField, Typography, LinearProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints, axiosInstanceBackend } from 'src/utils/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { FormHead } from '../../components/form-head';
import { CustomErrorComponent } from './custom-error-component';

// ----------------------------------------------------------------------

export const SignUpSchema = zod.object({
  username: zod
    .string()
    .min(1, { message: 'Username is required!' })
    .regex(/^[a-zA-Z][a-zA-Z0-9_.]*$/, {
      message: 'Username must start with a letter and contain only letters, numbers, underscores or points',
    })
    .min(6, { message: 'Username must be at least 6 characters' }),

  companyName: zod.string().min(1, { message: 'Company name is required!' }),
  firstName: zod.string().min(1, { message: 'First name is required!' }),
  lastName: zod.string().min(1, { message: 'Last name is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  password: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
  phoneNumber: zod.string().min(1, { message: 'Phone number is required!' }),
});

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const { checkUserSession } = useAuthContext();

  const { loadedAllUsers } = useDataContext();

  const existingEmails = useMemo(
    () =>
      new Set(
        (loadedAllUsers ?? [])
          // .filter((u) => u?.isVerified)
          .map((u) => String((u?.email) ?? '').trim().toLowerCase())
          .filter(Boolean)
      ),
    [loadedAllUsers]
  );

  const router = useRouter();

  const password = useBoolean();

  const [errorMsg, setErrorMsg] = useState({
    message: '',
    name: '',
    email: '',
  });

  const [currentUsername, setCurrentUsername] = useState('');

  const isSending = useBoolean(false);

  const [titleIsSending, setTitleIsSending] = useState('');

  const { isMobile } = useContext(LoadingContext);


  const defaultValues = {
    username: '',
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
  };

  const SignUpSchemaWithEmailUnique = useMemo(
    () =>
      SignUpSchema.superRefine((data, ctx) => {
        const emailNorm = String(data.email).trim().toLowerCase();
        if (existingEmails.has(emailNorm)) {
          ctx.addIssue({
            path: ['email'],
            code: zod.ZodIssueCode.custom,
            message: 'This email is already registered!',
          });
        }
      }),
    [existingEmails]
  );

  const methods = useForm({
    resolver: zodResolver(SignUpSchemaWithEmailUnique),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setTitleIsSending('Signing up...');
    isSending.onTrue();
    setCurrentUsername(data.username);
    sessionStorage.setItem('userSignedUp', JSON.stringify({
      data: {
        username: data.username,
        companyName: data.companyName,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      },
    }));
    try {
      await signUp({
        username: data.username,
        companyName: data.companyName,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      });
      await checkUserSession();
      sessionStorage.setItem('userSignedUpEmail', data.email);
      sessionStorage.setItem('isNewUserSignedUp', 'true');
      router.push(paths.auth.jwt.verificationCode);
    } catch (error) {
      console.error(error);
      setErrorMsg({
        message: typeof error === 'string' ? error : error.description,
        name: error.error_name || '',
        email: error.error_email || '',
      });
      sessionStorage.setItem('userSignedUpEmail', error.error_email || data.email);
      sessionStorage.setItem('isNewUserSignedUp', error.error_email ? 'false' : 'true');
    } finally {
      setTitleIsSending('');
      isSending.onFalse();
    }

  });

  const handleResendCode = async () => {
    console.log('Resend verification code');
    setTitleIsSending('Resending verification code...');
    isSending.onTrue();
    try {
      const payload = {
        email: sessionStorage.getItem('userSignedUpEmail'),
        username: currentUsername,
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
      textAlign: 'start',
      opacity: 1,
      fontSize: 17,
    },

    // Tipografías un poco más grandes
    '& .MuiInputBase-root': { fontSize: 16 },
    '& .MuiInputLabel-root': { fontSize: 16 },
    '& .MuiFormHelperText-root, & .MuiFormControlLabel-label': { fontSize: 14 },
  };

  const renderForm = (
    <Box gap={1} display="flex" flexDirection="column">

      <Box display='flex' flexDirection='column' gap={0} justifyContent='flex-start'>
        <Label
          variant='body2'
          sx={{
            justifyContent: 'flex-start',
            color: errors.username ? 'error.main' : 'text.secondary',
            fontSize: 15
          }}>
          Username
        </Label>

        <Controller
          name="username"
          control={methods.control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              // label="Username"
              placeholder='Username'
              error={!!error}
              helperText={error?.message || ''}
              // InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { height: 61 },
                inputProps: { style: { paddingTop: 0, paddingBottom: 0, lineHeight: '61px' } },
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:user-bold" width={20} height={20} sx={{ color: errors.username ? 'error.main' : 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              onChange={(e) => {
                field.onChange(e);
                if (errorMsg.message.length > 0) {
                  setErrorMsg({
                    name: '',
                    message: '',
                    email: '',
                  });
                }
              }}
            />
          )}
        />
      </Box>

      <Box display='flex' flexDirection='column' gap={0} justifyContent='flex-start'>
        <Label
          variant='body2'
          sx={{
            justifyContent: 'flex-start',
            color: errors.companyName ? 'error.main' : 'text.secondary',
            fontSize: 15
          }}>
          Company name
        </Label>

        <Field.Text
          name="companyName"
          placeholder="Company name"
          // InputLabelProps={{ shrink: true }} 
          InputProps={{
            sx: { height: 61 },
            inputProps: { style: { paddingTop: 0, paddingBottom: 0, lineHeight: '61px' } },
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="mdi:company" width={20} height={20} sx={{ color: errors.companyName ? 'error.main' : 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box display="flex" gap={{ xs: 3, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
        <Box display='flex' flexDirection='column' gap={0} justifyContent='flex-start' width='100%'>
          <Label
            variant='body2'
            sx={{
              justifyContent: 'flex-start',
              color: errors.firstName ? 'error.main' : 'text.secondary',
              fontSize: 15
            }}>
            First name
          </Label>
          <Field.Text
            name="firstName"
            placeholder="First name"
            // InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: { height: 61 },
              inputProps: { style: { paddingTop: 0, paddingBottom: 0, lineHeight: '61px' } },
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:rename" width={20} height={20} sx={{ color: errors.firstName ? 'error.main' : 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box display='flex' flexDirection='column' gap={0} justifyContent='flex-start' width='100%'>
          <Label
            variant='body2'
            sx={{
              justifyContent: 'flex-start',
              color: errors.lastName ? 'error.main' : 'text.secondary',
              fontSize: 15
            }}>
            Last name
          </Label>
          <Field.Text
            name="lastName"
            placeholder="Last name"
            // InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: { height: 61 },
              inputProps: { style: { paddingTop: 0, paddingBottom: 0, lineHeight: '61px' } },
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="qlementine-icons:rename-16" width={20} height={20} sx={{ color: errors.lastName ? 'error.main' : 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      <Box display='flex' flexDirection='column' gap={0} justifyContent='flex-start'>
        <Label
          variant='body2'
          sx={{
            justifyContent: 'flex-start',
            color: errors.email ? 'error.main' : 'text.secondary',
            fontSize: 15
          }}>
          Email address
        </Label>

        <Field.Text
          name="email"
          placeholder="Email address"
          // InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: { height: 61 },
            inputProps: { style: { paddingTop: 0, paddingBottom: 0, lineHeight: '61px' } },
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="entypo:email" width={20} height={20} sx={{ color: errors.email ? 'error.main' : 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box display='flex' flexDirection='column' gap={0} justifyContent='flex-start'>
        <Label
          variant='body2'
          sx={{
            justifyContent: 'flex-start',
            color: errors.phoneNumber ? 'error.main' : 'text.secondary',
            fontSize: 15
          }}>
          Phone or Mobile
        </Label>

        <Field.Phone
          name="phoneNumber"
          placeholder="Phone or Mobile"
          // InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: { height: 61 },
            inputProps: { style: { paddingTop: 0, paddingBottom: 0, lineHeight: '61px' } },
          }}
        />
      </Box>

      <Box display='flex' flexDirection='column' gap={0} justifyContent='flex-start'>
        <Label
          variant='body2'
          sx={{
            justifyContent: 'flex-start',
            color: errors.password ? 'error.main' : 'text.secondary',
            fontSize: 15
          }}>
          Password
        </Label>

        <Field.Text
          name="password"
          // label="Password"
          placeholder="6+ characters"
          type={password.value ? 'text' : 'password'}
          // InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: { height: 61 },
            inputProps: { style: { paddingTop: 0, paddingBottom: 0, lineHeight: '61px' } },
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:lock-bold" width={20} height={20} sx={{ color: errors.password ? 'error.main' : 'text.secondary' }} />
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

      </Box>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Create account..."
        sx={{
          backgroundColor: 'primary.dark',
          '&:hover': {
            backgroundColor: 'primary.main',
          },
          fontSize: 17
        }}
      >
        Create account
      </LoadingButton>
    </Box>
  );

  return (
    <>
      {isSending.value ? (
        <Box
          sx={{
            width: '350px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            margin: 'auto'
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            {titleIsSending || 'Please wait...'}
          </Typography>
          <LinearProgress
            key="error"
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'black',
              },
              backgroundColor: '#e0e0e0',
            }}
          />
        </Box>
      ) : (

        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: !isMobile ? '150%' : '100%',
          ml: !isMobile ? -10 : 0
        }}>
          <Card
            sx={{
              mt: !isMobile ? 0 : 22,
              p: 3,
              width: 1,
              ml: 0,
              alignItems: 'center',
              justifyContent: 'center',
              ...formSlightGrow,
            }}
          >
            <Scrollbar sx={{ height: 1 }}>
              <FormHead
                isCompound
                title={
                  <Typography variant="h3" paragraph>
                    Get started absolutely free
                  </Typography>
                }
                description={
                  <Box
                    display="flex"
                    justifyContent={isMobile ? 'center' : 'flex-start'}
                    alignItems="center"
                    gap={1}
                    mb={-2}
                    mt={-3}
                  >
                    <Typography variant="h5" component="div">
                      Already have an account?
                    </Typography>
                    <Link
                      component={RouterLink}
                      href={paths.auth.jwt.signIn}
                      variant="subtitle2"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: 20,
                      }}>
                      Sign in
                    </Link>
                  </Box>
                }
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              />

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

              {/* <SignUpTerms /> */}
            </Scrollbar>

          </Card>
        </Box>
      )}
    </>
  );
}
