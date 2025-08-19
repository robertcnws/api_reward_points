import { m } from 'framer-motion';

import Badge from '@mui/material/Badge';
import SvgIcon from '@mui/material/SvgIcon';
import IconButton from '@mui/material/IconButton';

import { useSettingsContext } from 'src/components/settings/context';
import { Box, Tooltip, Typography } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { useDataContext } from 'src/auth/context/data/data-context';
import { useRouter } from 'src/routes/hooks';

// ----------------------------------------------------------------------

export function GuideTourButton({ width, sx, ...other }) {
  const settings = useSettingsContext();

  const router = useRouter();

  const isAnalyticsUrl = router.currentUrl().includes('/analytics');

  const {
    runDashboard,
    setRunDashboard,
    runNavVertical,
    runNavTop,
  } = useDataContext();

  return (
    <Box hidden={runDashboard || runNavVertical || runNavTop || !isAnalyticsUrl} width='100%'>
      <Tooltip title="Guide Tour" arrow placement="bottom">
        <IconButton
          aria-label="settings"
          onClick={() => setRunDashboard(true)}
          sx={{
            p: 0,
            // width,
            height: width,
            color: 'primary.dark',
            fontWeight: 'bold',
            ...sx
          }}
          {...other}
        >
          <Box display="flex" alignItems="center" flexDirection="row" justifyContent="flex-start">
            <Iconify icon='line-md:compass-twotone-loop' sx={{ width, height: width }} />
            <Typography variant="caption" sx={{ ml: 0.3, width: '100%' }}>
              Guide Tour
            </Typography>
          </Box>
        </IconButton>
      </Tooltip>
    </Box>
  );
}
