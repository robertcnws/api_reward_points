import AutoHeight from 'embla-carousel-auto-height';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Rating from '@mui/material/Rating';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDateTime } from 'src/utils/format-time';

import { Carousel, useCarousel, CarouselArrowBasicButtons } from 'src/components/carousel';
import { Tooltip } from '@mui/material';
import { useMemo } from 'react';

// ----------------------------------------------------------------------

export function AdminCustomerReviews({ title, subheader, list, ...other }) {
  const carousel = useCarousel({ align: 'start' }, [AutoHeight()]);

  const customerInfo = list.find((_, index) => index === carousel.dots.selectedIndex);

  console.log('list:', list);

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={<CarouselArrowBasicButtons {...carousel.arrows} />}
      />

      <Carousel carousel={carousel}>
        {list.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </Carousel>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ p: 3, gap: 2, display: 'flex' }}>
        <Button
          fullWidth
          color="error"
          variant="soft"
          onClick={() => console.info('ACCEPT', customerInfo?.id)}
        >
          Reject
        </Button>

        <Button
          fullWidth
          color="inherit"
          variant="contained"
          onClick={() => console.info('REJECT', customerInfo?.id)}
        >
          Accept
        </Button>
      </Box>
    </Card>
  );
}

function Item({ item, sx, ...other }) {

  const reactionsMapped = useMemo(
    () => {
      const reactionCounts = item.reactions.reduce((acc, { reactionType }) => {
        acc[reactionType] = (acc[reactionType] || 0) + 1;
        return acc;
      }, {});
      return {
        ...item,
        reactionCount: reactionCounts,
      };
    }, [item]);

  return (
    <Box
      sx={{
        p: 3,
        gap: 2,
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        ...sx,
      }}
      {...other}
    >
      <Box
        sx={{
          gap: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Avatar alt={item.user.firstName} src={item.user.avatarUrl} sx={{ width: 48, height: 48 }} />

        <ListItemText
          primary={item.name}
          secondary={
            <Box component="span" sx={{ display: 'flex', alignItems: 'left', gap: 1, flexDirection: 'column' }}>
              <Typography component="span" variant="caption" color="text.disabled">
                {`Posted by ${item.user.firstName} ${item.user.lastName}`}
              </Typography>
              <Typography component="span" variant="caption" color="text.disabled">
                {`Posted at ${fDateTime(item.createdTime)}`}
              </Typography>
            </Box>
          }
          secondaryTypographyProps={{
            mt: 0.5,
            component: 'span',
            typography: 'caption',
            color: 'text.disabled',
          }}
        />
      </Box>

      <Tooltip title={`Rating: ${item.rating}`} placement="top-start" arrow>
        <span>
          <Rating value={item.rating} size="small" readOnly precision={0.5} />
        </span>
      </Tooltip>

      <Typography variant="body2">{item.description}</Typography>

      <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>
        {reactionsMapped.map((tag) => (
          <Chip 
          size="small" 
          variant="soft" 
          key={tag.id} 
          label={
            <>
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexDirection: 'row' }}>
                <Typography variant="caption" sx={{ mr: 0.5 }}>
                  {tag.reactionType}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tag.reactionCount || 0}
                </Typography>
              </Box>
            </>
          } 
          />
        ))}
      </Box>
    </Box>
  );
}
