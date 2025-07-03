import { z as zod } from 'zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'src/components/snackbar';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Form, Field } from 'src/components/hook-form';
import { CONFIG } from 'src/config-global';
import axios from 'axios';

// ----------------------------------------------------------------------

export const ReviewSchema = zod.object({
  rating: zod.number().min(1, 'Rating must be greater than or equal to 1!'),
  review: zod.string().min(1, { message: 'Review is required!' }),
});

// ----------------------------------------------------------------------

export function StoreProductReviewNewForm({
  onClose,
  product,
  refetch,
  ...other
}) {

  const userLogged = JSON.parse(sessionStorage.getItem('userLogged') || '{}');

  const fullName = `${userLogged?.data?.first_name} ${userLogged?.data?.last_name}` || 'Anonymous';

  const defaultValues = {
    rating: 0,
    review: '',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ReviewSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const promise = axios.post(`${CONFIG.apiUrl}/reward-points/create/store-product-review/${product?.id}/`, {
        userReporter: JSON.stringify(userLogged?.data),
        rating: data.rating,
        comment: data.review,
      });
      await promise;
      reset();
      onClose();
      toast.success('Review created successfully!');
      refetch?.();
    } catch (error) {
      console.error(error);
    }
  });

  const onCancel = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  return (
    <Dialog onClose={onClose} {...other}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle> Add Review to {product?.name} </DialogTitle>

        <DialogContent>
          <div>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <b>{fullName}</b>, your review about this product will be public and visible to all users:
            </Typography>
            <Field.Rating name="rating" />
          </div>

          <Field.Text name="review" label="Review *" multiline rows={3} sx={{ mt: 3 }} />

        </DialogContent>

        <DialogActions>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Post
          </LoadingButton>
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
