import { useEffect } from 'react';

import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import Drawer, { drawerClasses } from '@mui/material/Drawer';

import { usePathname } from 'src/routes/hooks';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';
import { NavSectionVertical } from 'src/components/nav-section';


// ----------------------------------------------------------------------

export function NavMobile({ data, open, onClose, slots, sx, ...other }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          overflow: 'unset',
          bgcolor: 'var(--layout-nav-bg)',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      {slots?.topArea ?? (
        <Box sx={{ pl: 3.5, pt: 1, pb: 0, mt: 0, mb: 0, ml: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', width: 1, justifyContent: 'flex-start' }}>
            <Logo isSingle />
              <Typography sx={{
                ml: -9,
                mt: 1.5,
                color: 'primary.dark',
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fontSize: 20
              }}>
                Customer Portal
              </Typography>
          </Box>
        </Box>
      )}

      <Scrollbar fillContent>
        <NavSectionVertical data={data} sx={{ px: 2, flex: '1 1 auto' }} {...other} />
        {/* <NavUpgrade /> */}
      </Scrollbar>

      {slots?.bottomArea}
    </Drawer>
  );
}
