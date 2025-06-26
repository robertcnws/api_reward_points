import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import CardHeader from '@mui/material/CardHeader';

import { fCurrency, fNumber } from 'src/utils/format-number';

import { Scrollbar } from 'src/components/scrollbar';
import { ColorPreview } from 'src/components/color-utils';
import { LinearProgress, Typography } from '@mui/material';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function EcommerceRewardPointsHistoryList({
  title,
  subheader,
  list,
  loading,
  error,
  refetch,
  ...other
}) {

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Scrollbar sx={{ minHeight: 384 }}>
        {loading ? (
          <Box
            sx={{
              width: 350,
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 'auto',
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              Loading reward points history...
            </Typography>
            <LinearProgress
              sx={{
                mb: 2,
                width: '100%',
                '& .MuiLinearProgress-bar': { backgroundColor: 'black' },
                backgroundColor: '#e0e0e0',
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              p: 3,
              gap: 3,
              minWidth: 360,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {list?.map((item) => (
              <Item key={item.id} item={item} />
            ))}
          </Box>
        )}
      </Scrollbar>
    </Card>
  );
}

function Item({ item, sx, ...other }) {
  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        ...sx,
      }}
      {...other}
    >
      {/* <Avatar
        variant="rounded"
        alt={item.name}
        src={item.coverUrl}
        sx={{ width: 48, height: 48, flexShrink: 0 }}
      /> */}

      <Iconify
        icon={item?.gainedPoints ? 'streamline-stickies-color:reward' : 'ic:round-remove-shopping-cart'}
        width={48}
        height={48}
        sx={{ flexShrink: 0 }}
      />

      <Box
        sx={{ gap: 0.5, minWidth: 0, display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}
      >
        <Link noWrap sx={{ color: 'text.primary', typography: 'subtitle2' }}>
          {item.description}
        </Link>

        <Box sx={{ gap: 0.5, display: 'flex', typography: 'body2', color: 'text.secondary' }}>
          {(!!item.spentPoints) && (
            <Box component="span" sx={{ textDecoration: 'line-through', color: 'error.main' }}>
              - {fNumber(item.spentPoints)} points
            </Box>
          )}
          {(!!item.gainedPoints) && (
            <Box component="span" sx={{ color: 'success.main' }}>
              + {fNumber(item.gainedPoints)} points
            </Box>
          )}

          {/* <Box component="span" sx={{ color: item.priceSale ? 'error.main' : 'inherit' }}>
            {fCurrency(item.price)}
          </Box> */}
        </Box>
      </Box>

      {/* <ColorPreview limit={3} colors={item.colors} /> */}
    </Box>
  );
}
