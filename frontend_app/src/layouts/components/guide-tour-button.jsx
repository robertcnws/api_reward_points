import { m } from 'framer-motion';

import Badge from '@mui/material/Badge';
import SvgIcon from '@mui/material/SvgIcon';
import IconButton from '@mui/material/IconButton';

import { useSettingsContext } from 'src/components/settings/context';
import { Box, Tooltip } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { useDataContext } from 'src/auth/context/data/data-context';

// ----------------------------------------------------------------------

export function GuideTourButton({ sx, ...other }) {
  const settings = useSettingsContext();

  const {
    runDashboard,
    setRunDashboard,
    runNavVertical,
    runNavTop,
  } = useDataContext();

  return (
    <Box hidden={runDashboard || runNavVertical || runNavTop}>
      <Tooltip title="Guide Tour" arrow placement="bottom">
        <IconButton
          aria-label="settings"
          onClick={() => setRunDashboard(true)}
          sx={{
            p: 0,
            width: 30,
            height: 30,
            color: 'primary.dark',
            fontWeight: 'bold',
            ...sx
          }}
          {...other}
        >
          <Iconify icon='line-md:compass-twotone-loop' sx={{ width: 30, height: 30 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
