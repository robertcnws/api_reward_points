import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/config-global';
import { varAlpha, bgGradient } from 'src/theme/styles';

// ----------------------------------------------------------------------

export function Section({
  sx,
  method,
  layoutQuery,
  methods,
  title = 'Manage the job',
  imgUrl = `${CONFIG.assetsDir}/assets/illustrations/illustration-dashboard.webp`,
  subtitle = 'More effectively with optimized workflows.',
  ...other
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        // ...bgGradient({
        //   color: 'transparent',
        //   imgUrl: `${CONFIG.assetsDir}/assets/background/bgrewards1.png`,
        // }),
        // background: 'none !important',
        backgroundImage: `
          linear-gradient(transparent, transparent),
          url(${CONFIG.assetsDir}/assets/background/bgrewards1.png)
        `,
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundPosition: '0 0, center',
        backgroundSize: '100% 100%, cover',
        backgroundColor: 'transparent !important',
        px: 2,
        pb: 2,
        flex: '0 0 auto',

        // Tamaño: fijo por breakpoint + relación de aspecto estable
        width: { xs: '100%', md: 200, lg: 500, xl: 500 },
        maxWidth: { xs: '100%', md: 200, lg: 500, xl: 500 },
        aspectRatio: '16 / 9',
        display: 'none',
        position: 'relative',
        pt: 'var(--layout-header-desktop-height)',
        [theme.breakpoints.up(layoutQuery)]: {
          gap: 8,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
        },
        ...sx,
      }}
      {...other}
    >
      <div>
        {/* <Box sx={{ mb: -5 }} >
          <img src='/logo/logo.png' alt="img" style={{ width: '200px' }} />
        </Box> */}

        {/* <Typography variant="h4" sx={{ textAlign: 'center' }}>
          {title || ''}
        </Typography> */}

        {/* {subtitle && (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 2 }}>
            {subtitle}
          </Typography>
        )} */}
      </div>

      <Box
        // component="img"
        alt="Dashboard illustration"
        // src={imgUrl}
        sx={{ width: 1, aspectRatio: '4/3', objectFit: 'cover' }}
      />

      {!!methods?.length && method && (
        <Box component="ul" gap={2} display="flex">
          {methods.map((option) => {
            const selected = method === option.label.toLowerCase();

            return (
              <Box
                key={option.label}
                component="li"
                sx={{
                  ...(!selected && {
                    cursor: 'not-allowed',
                    filter: 'grayscale(1)',
                  }),
                }}
              >
                <Tooltip title={option.label} placement="top">
                  <Link
                    component={RouterLink}
                    href={option.path}
                    sx={{
                      ...(!selected && { pointerEvents: 'none' }),
                    }}
                  >
                    <Box
                      component="img"
                      alt={option.label}
                      src={option.icon}
                      sx={{ width: 32, height: 32 }}
                    />
                  </Link>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
