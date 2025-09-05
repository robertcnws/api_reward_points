import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useCountdownSeconds } from 'src/hooks/use-countdown';

import { b64urlDecode } from 'src/utils/obfuscate';
import { endpoints, axiosInstanceBackend } from 'src/utils/axios';

import { SentIcon } from 'src/assets/icons';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { FormHead } from '../../components/form-head';
import { CustomErrorComponent } from './custom-error-component';
import { FormReturnLink } from '../../components/form-return-link';
import { FormResendCode } from '../../components/form-resend-code';


// ----------------------------------------------------------------------

export const JwtUpdatePasswordSchema = zod
  .object({
    code: zod
      .string()
      .min(1, { message: 'Code is required!' })
      .min(6, { message: 'Code must be at least 6 characters!' }),
    email: zod
      .string()
      .min(1, { message: 'Email is required!' })
      .email({ message: 'Email must be a valid email address!' }),
    password: zod
      .string()
      .min(1, { message: 'Password is required!' })
      .min(6, { message: 'Password must be at least 6 characters!' }),
    confirmPassword: zod.string().min(1, { message: 'Confirm password is required!' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match!',
    path: ['confirmPassword'],
  });

// ----------------------------------------------------------------------

export function JwtUpdatePasswordView({ recoverData, refetchRecoverData }) {

  useEffect(() => {
    if (refetchRecoverData) {
      refetchRecoverData?.().catch((error) => {
        console.error('Error refetching recovery password data:', error);
      });
    }
  }, [refetchRecoverData]);

  useEffect(() => {
    let timerId = null;
    if (refetchRecoverData) {
      timerId = setInterval(() => {
        refetchRecoverData().catch((e) => {
          console.error('Error refetching recovery password data (interval):', e);
        });
      }, 10 * 60 * 1000);
    }
    return () => {
      if (timerId !== null) clearInterval(timerId);
    };
  }, [refetchRecoverData]);

  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState({
    message: '',
    name: '',
    email: '',
  });

  const searchParams = useSearchParams();

  const encodedEmail = searchParams.get('email');

  const email = b64urlDecode(encodedEmail);

  const password = useBoolean();

  const countdown = useCountdownSeconds(60);

  const defaultValues = {
    code: '',
    email: email || '',
    password: '',
    confirmPassword: '',
  };

  const methods = useForm({
    resolver: zodResolver(JwtUpdatePasswordSchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstanceBackend.post(endpoints.auth.updatePassword, {
        email: data.email,
        confirmationCode: data.code,
        newPassword: data.password,
      });

      router.push(paths.auth.jwt.signIn);
    } catch (error) {
      console.error(error);
      setErrorMsg({
        message: typeof error === 'string' ? error : error?.description,
        name: error?.error_name || '',
        email: error?.error_email || '',
      });
    }
  });

  const handleResendCode = useCallback(async () => {
    if (!countdown.isCounting) {
      try {
        countdown.reset();
        countdown.start();

        await axiosInstanceBackend.post(endpoints.auth.resetPassword, {
          email: values.email
        });

        refetchRecoverData?.().catch((error) => {
          console.error('Error refetching recovery password data:', error);
        });

      } catch (error) {
        console.error(error);
      }
    }
  }, [countdown, values.email, refetchRecoverData]);

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      <Field.Text
        name="email"
        label="Email address"
        placeholder="example@gmail.com"
        InputLabelProps={{ shrink: true }}
        disabled
      />

      <Field.Code name="code" />

      {(watch('code') === recoverData?.code) && (
        <>
          <Field.Text
            name="password"
            label="Password"
            placeholder="6+ characters"
            type={password.value ? 'text' : 'password'}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={password.onToggle} edge="end">
                    <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Field.Text
            name="confirmPassword"
            label="Confirm new password"
            type={password.value ? 'text' : 'password'}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={password.onToggle} edge="end">
                    <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Update password..."
            sx={{
              backgroundColor: 'primary.dark',
              '&:hover': {
                backgroundColor: 'primary.main',
              },
              fontSize: 19
            }}
          >
            Update password
          </LoadingButton>
        </>
      )}
    </Box>
  );

  return (
    <>
      <FormHead
        icon={<SentIcon />}
        title="Request sent successfully!"
        description={`We've sent a 6-digit confirmation email to your email. \nPlease enter the code in below box to verify your email.`}
      />

      {!!errorMsg.message && (
        <CustomErrorComponent
          errorMsg={errorMsg}
          actionName="Send"
        />
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      <FormResendCode
        onResendCode={handleResendCode}
        value={countdown.value}
        disabled={countdown.isCounting}
      />

      <FormReturnLink href={paths.auth.jwt.signIn} />
    </>
  );
}
