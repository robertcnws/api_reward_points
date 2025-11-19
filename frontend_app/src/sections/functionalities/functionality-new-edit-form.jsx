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
import { Chip } from '@mui/material';
import { maxHeight } from '@mui/system';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function FunctionalityNewEditForm({ currentFunctionalityId, onReturnList }) {

  const { loadedFunctionalities, loadedUserRoles } = useDataContext();

  const currentFunctionality = useMemo(() => {
    if (currentFunctionalityId && loadedFunctionalities) {
      return loadedFunctionalities.find((p) => p.id === currentFunctionalityId);
    }
    return null;
  }, [currentFunctionalityId, loadedFunctionalities]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [functionalities, setFunctionalities] = useState(null);

  useEffect(() => {
    if (loadedFunctionalities && loadedFunctionalities.length > 0) {
      setFunctionalities(loadedFunctionalities);
    }
  }, [loadedFunctionalities]);

  const NewFunctionalitySchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    link: zod.string().optional().nullable(),
    rolesAllowed: zod.array(zod.object({
      name: zod.string(),
      id: zod.string(),
    })).min(1, { message: 'At least one role must be selected!' }),
    isActive: zod.boolean().optional(),
    description: schemaHelper.editor().optional().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentFunctionality?.name || '',
      link: currentFunctionality?.link || '',
      rolesAllowed: currentFunctionality?.rolesAllowed || [],
      isActive: currentFunctionality?.isActive || true,
      description: currentFunctionality?.description || '',
    }),
    [currentFunctionality]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewFunctionalitySchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  const onSubmit = handleSubmit(async (data) => {

    const functionalityId = currentFunctionality ? currentFunctionality.id : null;
    const url = functionalityId ?
      endpoints.functionality.edit.functionality(functionalityId) :
      endpoints.functionality.create;

    try {
      await axiosInstanceBackend.post(url, {
        name: data.name,
        link: data.link,
        description: data.description,
        isActive: data.isActive,
        rolesAllowed: data.rolesAllowed.map((role) => role.id),
        userReporter: userLogged?.data,
      });
      reset();
      toast.success(functionalityId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.functionality.list);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>

      <Field.Text name="name" label="Name" placeholder="Name" />
      <Box sx={{ width: 1, color: 'text.secondary', mr: 2, mt: 2 }}>
        <Field.Text name="link" label="Link" placeholder="https://example.com" />
      </Box>
      <Box sx={{ width: 1, color: 'text.secondary', mr: 2, mt: 2 }}>
        <Field.Autocomplete
          name="rolesAllowed"
          label="Roles Allowed"
          placeholder="Select roles allowed"
          multiple
          options={loadedUserRoles ? loadedUserRoles.map((role) => ({ name: role.name, id: role.id })) : []}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.name}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={`${option.id}-${index}`}
                label={option.name}
                size="small"
                color='primary'
              />
            ))
          }
        />
      </Box>
      <Box sx={{ width: 1, color: 'text.secondary', mr: 2, mt: 2 }}>
        <Field.Switch name="isActive" label="Is Active" />
      </Box>
      <Box sx={{ width: 80, color: 'text.secondary', mr: 2, mt: 2 }}>
        Description
      </Box>
      <Field.Editor 
      name="description" 
      placeholder="Description..." 
      sx={{ 
        width: 1, 
        color: 'text.secondary', 
        mr: 2,
        mt: 2,
        maxHeight: 300, 
        '& .rdw-editor-main': { minHeight: 200, maxHeight: 200, overflowY: 'auto' }, 
      }} 
      />
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
          {!currentFunctionality ? 'Create functionality' : 'Update functionality'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
