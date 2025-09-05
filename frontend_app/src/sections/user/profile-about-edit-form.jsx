import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { endpoints, axiosInstanceBackend } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';


// ----------------------------------------------------------------------

export const ProfileAboutEditSchema = zod.object({
  about: zod.string().min(1, { message: 'About is required!' }),
});

// ----------------------------------------------------------------------

export function ProfileAboutEditForm({ currentUser, open, onClose, refetchUserByUsername }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const defaultValues = useMemo(
    () => ({
      id: currentUser?.id || '',
      about: currentUser?.about || '',
    }),
    [currentUser]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ProfileAboutEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  useEffect(() => {
    reset({
      id: currentUser?.id || '',
      about: currentUser?.about || '',
    });
  }, [currentUser, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const { id } = currentUser;
    data = {
      ...data,
      userReporter: JSON.stringify(userLogged?.data)
    };

    const promise = axiosInstanceBackend.post(endpoints.user.changeAbout.user(id), data);

    try {
      reset();
      onClose();

      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Update success!',
        error: 'Update error!',
      });

      await promise;

      refetchUserByUsername?.();

    } catch (error) {
      console.error(error);
    }
  });

  const onCloseAndReset = async () => {
    await onClose();
    reset();
  };

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={onCloseAndReset}
      PaperProps={{ sx: { maxWidth: 920 } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>About information</DialogTitle>

        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            USER: <b>{`${currentUser?.firstName} ${currentUser?.lastName}`}</b>
          </Alert>

          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(1, 1fr)'
            }}
            sx={{
              mb: 3,
              '& .MuiTextField-root': { width: '100%' }
            }}
          >
            <Field.Text name="about" label="About this user..." multiline rows={4} />
          </Box>
        </DialogContent>

        <DialogActions>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Update
          </LoadingButton>
          <Button variant="outlined" onClick={onCloseAndReset}>
            Cancel
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
