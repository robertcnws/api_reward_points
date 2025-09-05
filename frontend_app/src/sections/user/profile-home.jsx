import { useRef, useState } from 'react';

import Fab from '@mui/material/Fab';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import InputBase from '@mui/material/InputBase';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import { Tooltip, IconButton, Typography } from '@mui/material';

import { fNumber } from 'src/utils/format-number';

import { _socials } from 'src/_mock';
import { varAlpha } from 'src/theme/styles';
import { TwitterIcon, FacebookIcon, LinkedinIcon, InstagramIcon } from 'src/assets/icons';

import { Iconify } from 'src/components/iconify';

import { ProfileAboutEditForm } from './profile-about-edit-form';
import { ProfileSchoolEditForm } from './profile-school-edit-form';
import { ProfileSocialEditForm } from './profile-social-edit-form';
import { ProfileAddressEditForm } from './profile-address-edit-form';


// ----------------------------------------------------------------------

export function ProfileHome({ info, posts, user, refetchUserByUsername }) {
  const fileRef = useRef(null);

  const handleAttach = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  const [openModal, setOpenModal] = useState({
    editAbout: false,
    editAddress: false,
    editSchool: false,
    editSocials: false
  });

  const renderFollows = (
    <Card sx={{ py: 3, textAlign: 'center', typography: 'h4' }}>
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
      >
        <Stack width={1}>
          {fNumber(0)}
          <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
            Follower(s)
          </Box>
        </Stack>

        <Stack width={1}>
          {fNumber(0)}
          <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
            Following
          </Box>
        </Stack>
      </Stack>
    </Card>
  );

  const renderAbout = (
    <Card>
      <CardHeader title="About" />

      <Stack spacing={2} sx={{ p: 3, typography: 'body2' }}>
        <Box display="flex" flexDirection="row" justifyContent="space-between">
          <Typography variant="body2" color={user?.about ? 'text.secondary' : 'error'}>
            {user?.about || 'No about information'}
          </Typography>
          <IconButton
            sx={{
              mt: -1,
              color: user?.about ? 'inherit' : 'error.main'
            }}
            onClick={() => setOpenModal({ ...openModal, editAbout: true })}
          >
            <Iconify icon="ic:round-edit" />
          </IconButton>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Box display='flex' flexDirection='row'>
            <Iconify
              width={24}
              icon="mingcute:location-fill"
              sx={{
                mr: 2,
              }}
            />
            Live at
            <Link variant="subtitle2" color={user?.country ? 'inherit' : 'error'}>
              &nbsp;{user?.country ? `${user?.city}, ${user?.state}, ${user?.country}` : 'Unknown'}
            </Link>
          </Box>
          <Tooltip title="Edit Address" arrow placement="top">
            <IconButton
              sx={{
                mt: -1,
                color: user?.country ? 'inherit' : 'error.main'
              }}
              onClick={() => setOpenModal({ ...openModal, editAddress: true })}
            >
              <Iconify icon="ic:round-edit" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box display="flex">
          <Iconify width={24} icon="fluent:mail-24-filled" sx={{ mr: 2 }} />
          {user?.email || 'Unknown'}
        </Box>

        <Box display="flex">
          <Iconify width={24} icon="ic:round-business-center" sx={{ mr: 2 }} />
          {user?.userRole?.name?.toUpperCase()} {'of '}
          <Link variant="subtitle2" color="inherit">
            &nbsp;{user?.companyName || 'NWS'}
          </Link>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Box display='flex' flexDirection='row'>
            <Iconify width={24} icon="ic:round-business-center" sx={{ mr: 2 }} />
            {`Studied at `}
            <Link variant="subtitle2" color={user?.school ? 'inherit' : 'error'}>
              &nbsp;{user?.school || 'Unknown'}
            </Link>
          </Box>
          <Tooltip title="Edit School" arrow placement="top">
            <IconButton
              sx={{
                mt: -1,
                color: user?.school ? 'inherit' : 'error.main'
              }}
              onClick={() => setOpenModal({ ...openModal, editSchool: true })}
            >
              <Iconify icon="ic:round-edit" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
    </Card>
  );

  const renderPostInput = (
    <Card sx={{ p: 3 }}>
      <InputBase
        multiline
        fullWidth
        rows={4}
        placeholder="Share what you are thinking here..."
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 1,
          border: (theme) => `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
        }}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
          <Fab size="small" color="inherit" variant="softExtended" onClick={handleAttach}>
            <Iconify icon="solar:gallery-wide-bold" width={24} sx={{ color: 'success.main' }} />
            Image/Video
          </Fab>

          <Fab size="small" color="inherit" variant="softExtended">
            <Iconify icon="solar:videocamera-record-bold" width={24} sx={{ color: 'error.main' }} />
            Streaming
          </Fab>
        </Stack>

        <Button variant="contained">Post</Button>
      </Stack>

      <input ref={fileRef} type="file" style={{ display: 'none' }} />
    </Card>
  );

  const renderSocials = (
    <Card>
      <CardHeader
        title="Social"
        action={
          <IconButton
            sx={{
              color: !user?.facebookLink || !user?.instagramLink || !user?.linkedinLink || !user?.twitterLink ?
                'error.main' : 'inherit'
            }}
            onClick={() => setOpenModal({ ...openModal, editSocials: true })}
          >
            <Iconify icon="ic:round-edit" />
          </IconButton>
        }
      />

      <Stack spacing={2} sx={{ p: 3 }}>
        {_socials.map((social) => (
          <Stack
            key={social.label}
            spacing={2}
            direction="row"
            sx={{ wordBreak: 'break-all', typography: 'body2' }}
          >
            {social.value === 'facebook' && <FacebookIcon />}
            {social.value === 'instagram' && <InstagramIcon />}
            {social.value === 'linkedin' && <LinkedinIcon />}
            {social.value === 'twitter' && <TwitterIcon />}

            <Link
              color={user?.[`${social.value}Link`] ? 'inherit' : 'error.main'}
              sx={{ cursor: 'pointer' }}
              href={user?.[`${social.value}Link`] ? user?.[`${social.value}Link`] : '#'}
            >
              {social.value === 'facebook' && (user?.facebookLink || 'Unknown')}
              {social.value === 'instagram' && (user?.instagramLink || 'Unknown')}
              {social.value === 'linkedin' && (user?.linkedinLink || 'Unknown')}
              {social.value === 'twitter' && (user?.twitterLink || 'Unknown')}
            </Link>
          </Stack>
        ))}
      </Stack>
    </Card>
  );

  // return (
  //   <Grid container spacing={3}>
  //     <Grid xs={12} md={4}>
  //       <Stack spacing={3}>
  //         {/* {renderFollows} */}
  //         {renderAbout}
  //         {renderSocials}
  //       </Stack>
  //     </Grid>

  //     <Grid xs={12} md={8}>
  //       <Stack spacing={3}>
  //         {renderPostInput}

  //         {posts.map((post) => (
  //           <ProfilePostItem key={post.id} post={post} />
  //         ))}
  //       </Stack>
  //     </Grid>
  //   </Grid>
  // );

  return (
    <>
      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Stack spacing={3} sx={{ height: 1 }}>
            {/* {renderFollows} */}
            {renderAbout}

          </Stack>
        </Grid>

        <Grid xs={12} md={6}>
          <Stack spacing={3} sx={{ height: 1 }}>
            {renderSocials}
          </Stack>
        </Grid>
      </Grid>
      <ProfileAboutEditForm
        currentUser={user}
        open={openModal.editAbout}
        onClose={() => setOpenModal({ ...openModal, editAbout: false })}
        refetchUserByUsername={refetchUserByUsername}
      />
      <ProfileSchoolEditForm
        currentUser={user}
        open={openModal.editSchool}
        onClose={() => setOpenModal({ ...openModal, editSchool: false })}
        refetchUserByUsername={refetchUserByUsername}
      />
      <ProfileAddressEditForm
        currentUser={user}
        open={openModal.editAddress}
        onClose={() => setOpenModal({ ...openModal, editAddress: false })}
        refetchUserByUsername={refetchUserByUsername}
      />
      <ProfileSocialEditForm
        currentUser={user}
        open={openModal.editSocials}
        onClose={() => setOpenModal({ ...openModal, editSocials: false })}
        refetchUserByUsername={refetchUserByUsername}
      />
    </>
  );
}
