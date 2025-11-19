import { useMemo, useContext, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import { ListItemText } from '@mui/material';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

// ----------------------------------------------------------------------

export function FunctionalityTableToolbar({ filters, onResetPage }) {
  
  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );


  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >

      <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
        {/* {dataFiltered?.length > 0 && ( */}
        <TextField
          fullWidth
          value={filters.state.name}
          onChange={handleFilterName}
          placeholder="Search by functionality (NAME, DESCRIPTION)..."
          // disabled={dataFiltered?.length === 0}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        {/* )} */}

        {/* <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton> */}
      </Stack>
    </Stack>
  );
}
