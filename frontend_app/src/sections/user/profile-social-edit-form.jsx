import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { InputAdornment } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { endpoints, axiosInstanceBackend } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';


// ----------------------------------------------------------------------

export const ProfileSocialEditSchema = zod.object({
  facebookLink: zod.string().optional(),
  instagramLink: zod.string().optional(),
  linkedinLink: zod.string().optional(),
  twitterLink: zod.string().optional(),
});

export const SOCIAL_BASES = {
  facebookLink: 'https://facebook.com/',
  instagramLink: 'https://instagram.com/',
  linkedinLink: 'https://www.linkedin.com/in/', // adjust if you use /company/
  twitterLink: 'https://x.com/',               // or https://twitter.com/
};

export const stripBase = (value, base) => {
  if (!value) return '';
  let v = value.trim();

  // normalize input (remove scheme/www, leading @ and leading slashes)
  v = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/^@/, '').replace(/^\/+/, '');
  if (base) {
    const b = base.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    if (v.startsWith(b)) v = v.slice(b.length).replace(/^\/+/, '');
  }
  return v;
};

export const buildUrl = (handle, base) =>
  handle ? `${base}${stripBase(handle)}` : '';

// ----------------------------------------------------------------------

export function ProfileSocialEditForm({ currentUser, open, onClose, refetchUserByUsername }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const defaultValues = useMemo(
    () => ({
      id: currentUser?.id || '',
      facebookLink: stripBase(currentUser?.facebookLink, SOCIAL_BASES.facebookLink),
      instagramLink: stripBase(currentUser?.instagramLink, SOCIAL_BASES.instagramLink),
      linkedinLink: stripBase(currentUser?.linkedinLink, SOCIAL_BASES.linkedinLink),
      twitterLink: stripBase(currentUser?.twitterLink, SOCIAL_BASES.twitterLink),
    }),
    [currentUser]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ProfileSocialEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    reset({
      id: currentUser?.id || '',
      facebookLink: stripBase(currentUser?.facebookLink, SOCIAL_BASES.facebookLink),
      instagramLink: stripBase(currentUser?.instagramLink, SOCIAL_BASES.instagramLink),
      linkedinLink: stripBase(currentUser?.linkedinLink, SOCIAL_BASES.linkedinLink),
      twitterLink: stripBase(currentUser?.twitterLink, SOCIAL_BASES.twitterLink),
    });
  }, [currentUser, reset]);

  const values = watch();

  const hasChanges = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(defaultValues),
    [values, defaultValues]
  );

  const onSubmit = handleSubmit(async (data) => {
    const { id } = currentUser;

    const payload = {
      id,
      facebookLink: buildUrl(data.facebookLink, SOCIAL_BASES.facebookLink),
      instagramLink: buildUrl(data.instagramLink, SOCIAL_BASES.instagramLink),
      linkedinLink: buildUrl(data.linkedinLink, SOCIAL_BASES.linkedinLink),
      twitterLink: buildUrl(data.twitterLink, SOCIAL_BASES.twitterLink),
      userReporter: JSON.stringify(userLogged?.data),
    };

    const promise = axiosInstanceBackend.post(endpoints.user.changeSocial.user(id), payload);

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
        <DialogTitle>Social information</DialogTitle>

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
            <Field.Text
              name="facebookLink"
              label="Facebook handle"
              placeholder="<<your.profile>>"
              rules={{ setValueAs: (v) => stripBase(v, SOCIAL_BASES.facebookLink) }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ pointerEvents: 'none', gap: 1 }}>
                    <Iconify icon="logos:facebook" />
                    <Box component="span" sx={{ color: 'text.disabled', whiteSpace: 'nowrap', mr: -1, opacity: 0.65 }}>
                      {SOCIAL_BASES.facebookLink}
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
            <Field.Text
              name="instagramLink"
              label="Instagram handle"
              placeholder="<<your.user>>"
              rules={{ setValueAs: (v) => stripBase(v, SOCIAL_BASES.instagramLink) }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ pointerEvents: 'none', gap: 1 }}>
                    <Iconify icon="skill-icons:instagram" />
                    <Box component="span" sx={{ color: 'text.disabled', whiteSpace: 'nowrap', mr: -1, opacity: 0.65 }}>
                      {SOCIAL_BASES.instagramLink}
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
            <Field.Text
              name="linkedinLink"
              label="LinkedIn handle"
              placeholder="<<your-user>>"
              rules={{ setValueAs: (v) => stripBase(v, SOCIAL_BASES.linkedinLink) }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ pointerEvents: 'none', gap: 1 }}>
                    <Iconify icon="skill-icons:linkedin" />
                    <Box component="span" sx={{ color: 'text.disabled', whiteSpace: 'nowrap', mr: -1, opacity: 0.65 }}>
                      {SOCIAL_BASES.linkedinLink}
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
            <Field.Text
              name="twitterLink"
              label="X (Twitter) handle"
              placeholder="<<youruser>>"
              rules={{ setValueAs: (v) => stripBase(v, SOCIAL_BASES.twitterLink) }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ pointerEvents: 'none', gap: 1 }}>
                    <Iconify icon="hugeicons:new-twitter-rectangle" />
                    <Box component="span" sx={{ color: 'text.disabled', whiteSpace: 'nowrap', mr: -1, opacity: 0.65 }}>
                      {SOCIAL_BASES.twitterLink}
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting} disabled={!hasChanges}>
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
