import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import ListItemText from '@mui/material/ListItemText';
import { axiosInstanceBackend, endpoints } from 'src/utils/axios';

import { varAlpha, bgGradient } from 'src/theme/styles';
import AvatarWithUpdate from './avatar-with-update';

// ----------------------------------------------------------------------

export function ProfileCover({
  name,
  avatarUrl,
  keyAvatar,
  role,
  coverUrl,
  refetchUserByUsername
}) {
  const theme = useTheme();

  const userLogged = JSON.parse(sessionStorage.getItem('userLogged'));

  const onSelectFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userReporter', JSON.stringify(userLogged?.data));
      await axiosInstanceBackend.post(endpoints.user.uploadAvatar(userLogged?.data.id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      refetchUserByUsername?.().catch((error) => {
        console.error('Failed to refetch user:', error);
      });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  return (
    <Box
      sx={{
        ...bgGradient({
          color: `0deg, ${varAlpha(theme.vars.palette.primary.darkerChannel, 0.8)}, ${varAlpha(theme.vars.palette.primary.darkerChannel, 0.8)}`,
          imgUrl: coverUrl,
        }),
        height: 1,
        color: 'common.white',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          left: { md: 24 },
          bottom: { md: 24 },
          zIndex: { md: 10 },
          pt: { xs: 6, md: 0 },
          position: { md: 'absolute' },
        }}
      >
        
          <AvatarWithUpdate
            name={name}
            avatarUrl={avatarUrl}
            keyAvatar={keyAvatar}
            onSelectFile={onSelectFile}
          />

        <ListItemText
          sx={{ mt: 3, ml: { md: 3 }, textAlign: { xs: 'center', md: 'unset' } }}
          primary={name}
          secondary={role}
          primaryTypographyProps={{ typography: 'h4' }}
          secondaryTypographyProps={{
            mt: 0.5,
            color: 'inherit',
            component: 'span',
            typography: 'body2',
            sx: { opacity: 0.48 },
          }}
        />
      </Stack>
    </Box>
  );
}
