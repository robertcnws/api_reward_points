import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import { Button, IconButton, InputAdornment, MenuItem, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { _mock } from 'src/_mock/_mock';
import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function StoreProductNewEditForm({ currentStoreProduct }) {

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { loadedStoreProducts, refetchStoreProducts } = useDataContext();

  const NewSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    description: zod.string().optional(),
    assignedPoints: zod.number().min(1, { message: 'Assigned points must be greater than 0' }),
    attachments: schemaHelper.files({
      requireFiles: false,
    }),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentStoreProduct?.name || '',
      description: currentStoreProduct?.description || '',
      assignedPoints: currentStoreProduct?.assignedPoints || 1,
      attachments: currentStoreProduct?.attachments || [],
    }),
    [currentStoreProduct]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;

  const currentPoints = watch('assignedPoints') || 0;
  const increment = () => setValue('assignedPoints', currentPoints + 1);
  const decrement = () => setValue('assignedPoints', Math.max(1, currentPoints - 1));

  const currentAttachments = useCallback(() => {
    const attachments = watch('attachments');
    return Array.isArray(attachments) ? attachments : [];
  }, [watch]);


  const onSubmit = handleSubmit(async (data) => {

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('assignedPoints', data.assignedPoints.toString());
    currentAttachments().forEach((file) => {
      if (file instanceof File) {
        formData.append('attachments', file);
      }
    });

    const promise = axios.post(`${CONFIG.apiUrl}/store-products/create/store-product/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    try {

      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Store product created successfully!',
        error: 'Store product creation error!',
      });

      await promise;

      router.push(paths.dashboard.storeProduct.list);

      reset();

    } catch (error) {
      console.error(error);
    }
  });

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = currentAttachments() && currentAttachments()?.filter((file) => file !== inputFile);
      setValue('attachments', filtered, { shouldValidate: true });
    },
    [setValue, currentAttachments]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('attachments', [], { shouldValidate: true });
  }, [setValue]);

  const handleUploadFiles = useCallback(
    (files) => {
      const currentFiles = currentAttachments();
      const newFiles = Array.isArray(files) ? files : [files];
      const updatedFiles = [...currentFiles, ...newFiles];
      setValue('attachments', updatedFiles, { shouldValidate: true });
    },
    [setValue, currentAttachments]
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>

        <Grid xs={12} md={12}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(1, 1fr)',
              }}
              sx={{
                mb: 3,
                '& .MuiTextField-root': { width: '100%' },
              }}
            >
              <Field.Text name="name" label="Name" />
              <Field.Text
                name="assignedPoints"
                label="Assigned Points"
                type="number"
                min={1}
                max={1000000}
                step={1}
                InputProps={{
                  inputProps: {
                    min: 1,
                    max: 1000000,
                    step: 1,
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={decrement} width={30} height={30}>
                        <Iconify icon="memory:minus-box" fontSize="small" sx={{ width: 30, height: 30 }} />
                      </IconButton>
                      <IconButton size="small" onClick={increment} width={30} height={30}>
                        <Iconify icon="memory:plus-box" fontSize="small" sx={{ width: 30, height: 30 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Field.Text name="description" label="Description" multiline rows={3} />
              <Field.Upload
                multiple
                thumbnail
                name="attachments"
                label="Attachments"
                maxSize={3145728}
                onRemove={handleRemoveFile}
                onRemoveAll={handleRemoveAllFiles}
                onUpload={handleUploadFiles}
              />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentStoreProduct ? 'Create store product' : 'Save changes'}
              </LoadingButton>
              <Button type="button" variant="outlined" onClick={() => router.push(paths.dashboard.storeProduct.list)}>
                Cancel
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
