import Stack from '@mui/material/Stack';
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';


// ----------------------------------------------------------------------

export function SalesOrderDetailsToolbar({
  salesOrder,
  backLink,
  status,
  isMobile,
  loadedUsers,
}) {

  return (
    <>
      <Stack spacing={3} direction={{ xs: 'column', md: 'row' }} sx={{ mb: { xs: 3, md: 5 } }}>
        <Stack spacing={1} direction="row" alignItems="flex-start">
          <Tooltip title="Back">
            <IconButton component={RouterLink} href={backLink}>
              <Iconify icon="eva:arrow-ios-back-fill" />
            </IconButton>
          </Tooltip>

          <Stack spacing={0.5}>
            <Stack spacing={1} direction='row' alignItems="center">
              <Typography variant="h5"> Sales Order </Typography>
              <Label variant="soft" color="default">{salesOrder?.salesorderNumber}</Label>
              <Label
                variant="soft"
                color={
                  (status === 'confirmed' && 'warning') ||
                  (status === 'partially_shipped' && 'info') ||
                  (status === 'overdue' && 'error') ||
                  (status === 'fulfilled' && 'success') ||
                  'default'
                }
              >
                {status}
              </Label>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Last Modified: {fDateTime(salesOrder?.lastModifiedTime)}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          flexGrow={1}
          spacing={1.5}
          direction='row'
          alignItems="center"
          justifyContent="flex-end"
        >

          <Button
            component={RouterLink} 
            href={backLink}
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="lets-icons:close-ring" />}
          >
            Close
          </Button>

          {/* <Button color="inherit" variant="contained" startIcon={<Iconify icon="solar:pen-bold" />}>
            Edit
          </Button> */}
        </Stack>
      </Stack>

      {/* <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <MenuList>
          {statusOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === status}
              onClick={() => {
                popover.onClose();
                onChangeStatus(option.value);
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover> */}
    </>
  );
}
