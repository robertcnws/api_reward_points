import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { stripHtmlUsingDOM } from 'src/utils/helper';
import { endpoints, axiosInstanceBackend } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function PermissionNewEditForm({ currentCustomerportalPermissionId, onReturnList }) {

  const { loadedCustomerportalPermissions } = useDataContext();

  const currentCustomerportalPermission = useMemo(() => {
    if (currentCustomerportalPermissionId && loadedCustomerportalPermissions) {
      return loadedCustomerportalPermissions.find((p) => p.id === currentCustomerportalPermissionId);
    }
    return null;
  }, [currentCustomerportalPermissionId, loadedCustomerportalPermissions]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [customerportalPermissions, setCustomerportalPermissions] = useState(null);

  useEffect(() => {
    if (loadedCustomerportalPermissions && loadedCustomerportalPermissions.length > 0) {
      setCustomerportalPermissions(loadedCustomerportalPermissions);
    }
  }, [loadedCustomerportalPermissions]);

  const NewCustomerportalPermissionSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    description: schemaHelper.editor().optional().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentCustomerportalPermission?.name || '',
      description: currentCustomerportalPermission?.description || '',
    }),
    [currentCustomerportalPermission]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewCustomerportalPermissionSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  const onSubmit = handleSubmit(async (data) => {

    const permissionId = currentCustomerportalPermission ? currentCustomerportalPermission.id : null;
    const url = permissionId ? 
    endpoints.user.edit.customerportalPermission(permissionId) : 
    endpoints.user.create.customerportalPermission;

    try {
      await axiosInstanceBackend.post(url, {
        name: data.name,
        description: stripHtmlUsingDOM(data.description),
        userReporter: userLogged?.data,
      });
      reset();
      toast.success(permissionId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.permission.list);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>

      <Field.Text name="name" label="Name" placeholder="Name" />
      <Box sx={{ width: 80, color: 'text.secondary', mr: 2, mt: 2 }}>
        Description
      </Box>
      <Field.Editor name="description" placeholder="Description..." />
      <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LoadingButton 
        type="submit" 
        variant="contained" 
        loading={isSubmitting} 
        sx={{ 
          mr: 2,
          bgcolor: 'primary.dark',
          '&:hover': {
            bgcolor: 'primary.main',
          },
        }}
        >
          {!currentCustomerportalPermission ? 'Create permission' : 'Update permission'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
