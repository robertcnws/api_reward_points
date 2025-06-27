import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import { Button, IconButton, InputAdornment } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { _mock } from 'src/_mock/_mock';
import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';
import { Iconify } from 'src/components/iconify';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function StoreProductNewEditForm({ currentStoreProduct }) {

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    loadedStoreProducts,
    refetchStoreProducts
  } = useDataContext();

  const [initialFiles, setInitialFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [fileToRemove, setFileToRemove] = useState(null);
  const confirm = useBoolean();
  const confirmAll = useBoolean();

  const NewSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    description: zod.string().optional(),
    assignedPoints: zod.number().min(1, { message: 'Assigned points must be greater than 0' }),
    attachments: schemaHelper.files({
      requireFiles: false,
    }),
  });

  useEffect(() => {

    const projectAttachments = currentStoreProduct?.attachments || [];

    console.log('projectAttachments', projectAttachments);

    const attachments = [...projectAttachments] || [];

    if (!attachments.length) {
      setInitialFiles([]);
      return;
    }
    const loadFiles = async () => {
      const loaded = await Promise.all(
        attachments.map(async (attachment) => {
          if (attachment instanceof File) {
            return {
              ...attachment,
              fileUrl: URL.createObjectURL(attachment),
              name: attachment.name,
              isNew: true,
            };
          }
          if (!attachment.file) {
            return attachment;
          }
          try {
            const response = await fetch(
              `${CONFIG.apiUrl}/reward-points/get-file-url/?key=${encodeURIComponent(attachment.file)}`
            );
            if (!response.ok) {
              console.error('Error fetching URL', response.statusText);
              return attachment;
            }
            const values = await response.json();
            return {
              ...attachment,
              fileUrl: values.url,
              isNew: false,
            };
          } catch (error) {
            console.error('Error al obtener la URL:', error);
            return attachment;
          }
        })
      );
      setInitialFiles(loaded);
    };
    loadFiles();
  }, [currentStoreProduct]);

  const displayFiles = useMemo(() => [...initialFiles, ...newFiles], [initialFiles, newFiles]);

  console.log('displayFiles', displayFiles);

  const defaultValues = useMemo(
    () => ({
      name: currentStoreProduct?.name || '',
      description: currentStoreProduct?.description || '',
      assignedPoints: currentStoreProduct?.assignedPoints || 1,
      attachments: displayFiles,
    }),
    [currentStoreProduct, displayFiles]
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

  useEffect(() => {
    if (displayFiles.length) {
      setValue('name', currentStoreProduct?.name || '');
      setValue('description', currentStoreProduct?.description || '');
      setValue('assignedPoints', currentStoreProduct?.assignedPoints || 1);
      setValue('attachments', displayFiles, { shouldValidate: true });
    }
  }, [displayFiles, setValue, currentStoreProduct]);

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
    formData.append('userReporter', JSON.stringify(userLogged?.data));
    currentAttachments().forEach((file) => {
      if (file instanceof File) {
        formData.append('attachments', file);
      }
    });


    const promise = axios.post(`${CONFIG.apiUrl}/reward-points/create/store-product/`, formData, {
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

  const handleClickRemoveFile = useCallback((file) => {
    setFileToRemove(file);
    confirm.onTrue();
  }, [confirm]);

  const handleClickRemoveAll = useCallback(() => {
    confirmAll.onTrue();
  }, [confirmAll]);

  const handleConfirmRemove = useCallback(async (file) => {
    if (!fileToRemove) return;
    let updatedInitial = initialFiles;
    let updatedNew = newFiles;
    const isLocalFile = fileToRemove instanceof File;
    if (!fileToRemove.isNew && !isLocalFile) {
      try {
        const url = `${CONFIG.apiUrl}/reward-points/delete/file/${currentStoreProduct?.id}/store-product/${file}/`;
        await axios.delete(url, {
          data: {
            userReporter: userLogged?.data,
          },
        });
        updatedInitial = initialFiles.filter((f) => f.file !== fileToRemove.file);
        toast.success('File deleted successfully');
      } catch (error) {
        console.error('Error deleting file', error);
        toast.error('Error deleting file');
        return;
      }
    } else {
      updatedNew = newFiles.filter((f) => f.name !== fileToRemove.name);
    }
    setInitialFiles(updatedInitial);
    setNewFiles(updatedNew);

    confirm.onFalse();
    setFileToRemove(null);
    refetchStoreProducts?.();
  }, [confirm, initialFiles, newFiles, userLogged, currentStoreProduct, fileToRemove, refetchStoreProducts]);

  const handleConfirmRemoveAll = useCallback(() => {
    currentAttachments().forEach((file) => {
      if (file instanceof File) {
        URL.revokeObjectURL(file.fileUrl); // Free up memory for local files
      }
      else if (file.fileUrl) {
        handleClickRemoveFile(file);
      }
    });
    setValue('attachments', [], { shouldValidate: true });
  }, [setValue, currentAttachments, handleClickRemoveFile]);

  const handleUploadFiles = useCallback(
    (files) => {
      const currentFiles = currentAttachments();
      const newfiles = Array.isArray(files) ? files : [files];
      const updatedFiles = [...currentFiles, ...newfiles];
      setValue('attachments', updatedFiles, { shouldValidate: true });
    },
    [setValue, currentAttachments]
  );

  const handleDownloadFile = (file) => {
    if (!file || !file.fileUrl) return;

    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.name;
    link.target = '_blank';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
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
                  onRemove={handleClickRemoveFile}
                  onRemoveAll={handleClickRemoveAll}
                  onUpload={handleUploadFiles}
                  onDownload={handleDownloadFile}
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
      <ConfirmDialog
        open={confirm.value}
        onClose={() => {
          confirm.onFalse();
          setFileToRemove(null);
        }}
        title="Remove File"
        content={
          <>
            {fileToRemove && (
              <>
                Are you sure you want to delete the file{' '}
                <strong>{fileToRemove.name}</strong> from{' '}
                <strong>
                  store product <em>{currentStoreProduct?.name}</em>
                </strong>
                ?
              </>
            )}
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={() => handleConfirmRemove(fileToRemove?.file)}>
            Remove
          </Button>
        }
      />
      <ConfirmDialog
        open={confirmAll.value}
        onClose={() => {
          confirmAll.onFalse();
        }}
        title="Remove All File"
        content={
          <>
            Are you sure you want to delete all files from{' '}
            <strong>
              store product <em>{currentStoreProduct?.name}</em>
            </strong>
            ?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmRemoveAll}>
            Remove
          </Button>
        }
      />
    </>
  );
}
