import React, { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function EcommerceWebsiteVisits({ title, metricUnit, subheader, chart, ...other }) {
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
    return max > 0 ? Math.floor(max) : undefined; // Añadir un margen del 0.5% si hay datos
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
      max: seriesMax || undefined,  // undefined si está vacío
      // forceNiceScale: true,
    },
    legend: {
      show: true,
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} ${metricUnit}`,
      },
    },
    ...chart.options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
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
