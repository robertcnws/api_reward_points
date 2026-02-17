import React, { useMemo } from 'react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';

import { Chart, useChart } from 'src/components/chart';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';

// ----------------------------------------------------------------------

export function EcommerceWebsiteVisits({
  title,
  metricUnit,
  subheader,
  selectedYear,
  setSelectedYear,
  chart,
  ...other
}) {
  const theme = useTheme();

  const chartColors = chart.colors ?? [
    hexAlpha(theme.palette.primary.dark, 0.8),
    hexAlpha(theme.palette.primary.light, 0.8),
    hexAlpha(theme.palette.warning.main, 0.8),
  ];

  const seriesMax = useMemo(() => {
    const values = (chart.series ?? [])
      .flatMap(s => s?.data ?? [])
      .map(n => Number(n))
      .filter(Number.isFinite);

    const max = values.length ? Math.max(...values) : 0;
    return max > 0 ? Math.ceil(max) : undefined;
  }, [chart.series]);

  const chartOptions = useChart({
    colors: chartColors,
    stroke: {
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chart.categories,
    },
    yaxis: {
      min: 0,
      max: seriesMax || undefined,
      forceNiceScale: true,
      tickAmount: Math.min(seriesMax ?? 6, 6),
      labels: {
        formatter: (val) => Math.round(val).toString(),
      },
    },
    legend: {
      show: true,
    },
    tooltip: {
      y: {
        formatter: (value) => `${Math.round(value)} ${metricUnit}`,
      },
    },
    ...chart.options,
  });

  const currentYear = new Date().getFullYear();

  const arrayYears = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2">Year:</Typography>

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <Select
                value={selectedYear ?? currentYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {arrayYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        }
      />
      <Chart
        type="bar"
        series={chart.series}
        options={chartOptions}
        height={364}
        sx={{ py: 2.5, pl: 1, pr: 2.5 }}
      />
    </Card>
  );
}
