import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fCurrency, fNumber, fPercent } from 'src/utils/format-number';

import { varAlpha, stylesMode } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';
import { Typography } from '@mui/material';

// ----------------------------------------------------------------------

export function EcommerceRewardPointsAttribute({
  title,
  icon = null,
  percent,
  total,
  chart,
  bgcolor = 'background.paper',
  sx,
  isMoney = false,
  ...other
}) {
  const theme = useTheme();

  const chartColors = chart.colors ?? [theme.palette.primary.light, theme.palette.primary.main];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: [chartColors[1]],
    xaxis: { categories: chart.categories },
    grid: {
      padding: {
        top: 6,
        left: 6,
        right: 6,
        bottom: 6,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        colorStops: [
          { offset: 0, color: chartColors[0], opacity: 1 },
          { offset: 100, color: chartColors[1], opacity: 1 },
        ],
      },
    },
    tooltip: {
      y: { formatter: (value) => fNumber(value), title: { formatter: () => '' } },
    },
    ...chart.options,
  });

  const renderTrending = (
    <Box sx={{ gap: 0.5, display: 'flex', alignItems: 'center' }}>
      <Box
        component="span"
        sx={{
          width: 24,
          height: 24,
          display: 'flex',
          borderRadius: '50%',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: varAlpha(theme.vars.palette.success.mainChannel, 0.16),
          color: 'success.dark',
          [stylesMode.dark]: { color: 'success.light' },
          ...(percent < 0 && {
            bgcolor: varAlpha(theme.vars.palette.error.mainChannel, 0.16),
            color: 'error.dark',
            [stylesMode.dark]: { color: 'error.light' },
          }),
        }}
      >
        <Iconify
          width={16}
          icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'}
        />
      </Box>

      <Box component="span" sx={{ typography: 'subtitle2', display: 'inline-flex', flexDirection: 'row' }}>

        <Typography>
          {percent > 0 && '+'}
          {fPercent(percent)}
        </Typography>
      </Box>
      <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
        last week
      </Box>
    </Box>
  );

  return (
    <Card
      sx={{
        bgcolor,
        p: 3,
        display: 'flex',
        alignItems: 'center',
        ...sx,
      }}
      {...other}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ typography: 'subtitle2' }}>{title}</Box>
        <Box sx={{ my: 1.5, typography: 'h3', flexDirection: 'row', display: 'flex' }}>
          {icon && (
            <Box
              component="span"
              sx={{
                width: 20,
                height: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 0.5,
              }}
            >
              <Iconify icon={icon} width={20} />
            </Box>
          )}
          <Typography>
            {isMoney ? fCurrency(total) : fNumber(total)}
          </Typography>
        </Box>
        {renderTrending}
      </Box>

      <Chart
        type="line"
        series={[{ data: chart.series }]}
        options={chartOptions}
        width={100}
        height={66}
      />
    </Card>
  );
}
