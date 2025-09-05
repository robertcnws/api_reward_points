import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { useTabs } from 'src/hooks/use-tabs';

import { isClient } from 'src/utils/check-permissions';

import { DashboardContent } from 'src/layouts/dashboard';
import { _userAbout, _userFeeds, _userFriends, _userGallery, _userFollowers } from 'src/_mock';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useDataContext } from 'src/auth/context/data/data-context';

import { ProfileHome } from '../profile-home';
import { ProfileCover } from '../profile-cover';
import { ProfileFriends } from '../profile-friends';
import { ProfileGallery } from '../profile-gallery';
import { ProfileFollowers } from '../profile-followers';



// ----------------------------------------------------------------------

const TABS = [
  { 
    value: 'profile', 
    label: 'Profile', 
    icon: <Iconify icon="solar:user-id-bold" width={24} /> 
  },
  // { 
  //   value: 'followers', 
  //   label: 'Followers', 
  //   icon: <Iconify icon="solar:heart-bold" width={24} /> 
  // },
  // {
  //   value: 'friends',
  //   label: 'Friends',
  //   icon: <Iconify icon="solar:users-group-rounded-bold" width={24} />,
  // },
  // {
  //   value: 'gallery',
  //   label: 'Gallery',
  //   icon: <Iconify icon="solar:gallery-wide-bold" width={24} />,
  // },
];

// ----------------------------------------------------------------------

export function UserProfileView() {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const roleName = useMemo(() => userLogged?.data?.user_role?.name, [userLogged]);

  const {
    userByUsername, 
    refetchUserByUsername,
    loadingUserByUsername,
    errorUserByUsername
  } = useDataContext();

  // const { user } = useMockedUser();

  const [user, setUser] = useState(null);

  useEffect(() => {
    if (userByUsername) {
      setUser(userByUsername);
    }
  }, [userByUsername]);

  const [searchFriends, setSearchFriends] = useState('');

  const tabs = useTabs('profile');

  const handleSearchFriends = useCallback((event) => {
    setSearchFriends(event.target.value);
  }, []);

  // console.log('user:', user);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Profile"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          ...!isClient(roleName) ? [{ name: 'User', href: paths.dashboard.user.root }] : [],
          { name: `${user?.firstName} ${user?.lastName}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ mb: 3, height: 290 }}>
        <ProfileCover
          role={roleName}
          name={`${user?.firstName} ${user?.lastName}`}
          avatarUrl={user?.avatarUrl}
          keyAvatar={user?.keyAvatar}
          coverUrl={_userAbout.coverUrl}
          refetchUserByUsername={refetchUserByUsername}
        />

        <Box
          display="flex"
          justifyContent={{ xs: 'center', md: 'flex-end' }}
          sx={{
            width: 1,
            bottom: 0,
            zIndex: 9,
            px: { md: 3 },
            position: 'absolute',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs value={tabs.value} onChange={tabs.onChange}>
            {TABS.map((tab) => (
              <Tab key={tab.value} value={tab.value} icon={tab.icon} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      </Card>

      {tabs.value === 'profile' && (
        <ProfileHome 
          info={_userAbout} 
          posts={_userFeeds} 
          user={user} 
          refetchUserByUsername={refetchUserByUsername} 
        />
      )}

      {tabs.value === 'followers' && <ProfileFollowers followers={_userFollowers} />}

      {tabs.value === 'friends' && (
        <ProfileFriends
          friends={_userFriends}
          searchFriends={searchFriends}
          onSearchFriends={handleSearchFriends}
        />
      )}

      {tabs.value === 'gallery' && <ProfileGallery gallery={_userGallery} />}
    </DashboardContent>
  );
}
