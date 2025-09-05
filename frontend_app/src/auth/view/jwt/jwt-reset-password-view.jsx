import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { b64urlEncode } from 'src/utils/obfuscate';
import { endpoints, axiosInstanceBackend } from 'src/utils/axios';

import { PasswordIcon } from 'src/assets/icons';

import { Label } from 'src/components/label';
import { Form, Field } from 'src/components/hook-form';

import { FormHead } from '../../components/form-head';
import { FormReturnLink } from '../../components/form-return-link';

// ----------------------------------------------------------------------

export const JwtResetPasswordSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
});

// ----------------------------------------------------------------------

export function JwtResetPasswordView() {
  const router = useRouter();

  const defaultValues = {
    email: '',
  };

  const methods = useForm({
    resolver: zodResolver(JwtResetPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await axiosInstanceBackend.post(endpoints.auth.resetPassword, {
        email: data.email
      });

      const {email} = response.data.data;

      const encodedEmail = b64urlEncode(email);

      const searchParams = new URLSearchParams({ email: encodedEmail }).toString();

      const href = `${paths.auth.jwt.updatePassword}?${searchParams}`;

      router.push(href);

    } catch (error) {
      console.error(error);
    }
  });

  const formSlightGrow = {
    '& .MuiInputBase-input::placeholder': {
      opacity: 1,
      fontSize: 17,
    },
    '& .MuiInputBase-root': { fontSize: 16 },
    '& .MuiInputLabel-root': { fontSize: 16 },
    '& .MuiFormHelperText-root, & .MuiFormControlLabel-label': { fontSize: 14 },
  };

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column" sx={formSlightGrow}>
      <Box display='flex' flexDirection='column' gap={0} justifyContent='flex-start'>
        <Label
          variant='body2'
          sx={{
            justifyContent: 'flex-start',
            color: errors.email ? 'error.main' : 'text.secondary',
            fontSize: 18
          }}>
          Email Address
        </Label>
        <Field.Text
          autoFocus
          name="email"
          // label="Email address"
          placeholder="example@gmail.com"
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Send request..."
        sx={{
          backgroundColor: 'primary.dark',
          '&:hover': {
            backgroundColor: 'primary.main',
          },
          fontSize: 19
        }}
      >
        Send request
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        icon={<PasswordIcon />}
        title="Forgot your password?"
        description={`Please enter the email address associated with your account and we'll email you a link to reset your password.`}
      />

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      <FormReturnLink href={paths.auth.jwt.signIn} />
    </>
  );
}
