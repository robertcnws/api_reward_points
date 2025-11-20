import React, { useContext } from 'react';

import { Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';
import { stripHtmlUsingDOM } from 'src/utils/helper';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';
import { fDateTime } from 'src/utils/format-time';
import { Box } from '@mui/system';

// ----------------------------------------------------------------------

export function FunctionalityTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {

  const { isMobile } = useContext(LoadingContext);

  const confirm = useBoolean();

  const popover = usePopover();

  const openDescription = useBoolean();

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1} sx={{ cursor: 'pointer' }}>

        <TableCell padding="checkbox">
          <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
        </TableCell>

        {!isMobile ? (
          <>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>{row.name}</TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }}>
              <Box sx={{ display: 'inline-flex', px: 1 }} onClick={() => onEditRow()}>
                <Typography variant="body2" noWrap>
                  {row.description
                    ? `${stripHtmlUsingDOM(row.description).slice(0, 40)}${row.description.length > 20 ? '...' : ''}`
                    : 'No description'}
                </Typography>
              </Box>

              <Box sx={{ display: 'inline-flex', px: 1 }}>
                <Label
                  variant="soft"
                  color="default"
                  sx={{ cursor: 'pointer' }}
                  onClick={openDescription.onTrue}
                >
                  See full description
                </Label>
              </Box>
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              <Stack direction="row" spacing={1}>
                {row.rolesAllowed && row.rolesAllowed.length > 0 ? (
                  row.rolesAllowed.map((role) => (
                    <Label
                      key={role.id}
                      variant="filled"
                      color="primary"
                      sx={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
                    >
                      {role.name}
                    </Label>
                  ))
                ) : (
                  <Label
                    variant="filled"
                    color="default"
                    sx={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
                  >
                    No roles assigned
                  </Label>
                )}
              </Stack>
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              {fDateTime(row.lastModifiedTime)}
            </TableCell>

            <TableCell onClick={() => onEditRow()}>
              <Label
                variant="soft"
                color={
                  (row.isActive && 'success') ||
                  (!row.isActive && 'warning') ||
                  'default'
                }
                sx={{ cursor: 'pointer' }}
              >
                {row.isActive ? 'Active' : 'Inactive'}
              </Label>
            </TableCell>

          </>
        ) : (
          <TableCell >
            <Label
              variant="soft"
              color='default'
              sx={{ cursor: 'pointer' }}
              onClick={() => onEditRow()}
            >
              <u>{row.name}</u>
            </Label><br />
            <Box sx={{ display: 'inline-flex' }}>
              <Label
                variant="soft"
                color="warning"
                sx={{ cursor: 'pointer' }}
                onClick={openDescription.onTrue}
              >
                See full description
              </Label>
            </Box><br />
            Modified at: {fDateTime(row.lastModifiedTime)}

          </TableCell>
        )}
        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Stack direction="row" alignItems="center">
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>


      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="ph:pencil-line" />
            Edit Functionality
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete Functionality
          </MenuItem>

        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete functionality: (${row.name})?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        sx={{ '& .MuiDialog-paper': { maxWidth: 600, maxHeight: 400 } }}
        open={openDescription.value}
        onClose={openDescription.onFalse}
        title="Full Description"
        content={
          row.description ? (
            <Box sx={{ mt: 1 }} dangerouslySetInnerHTML={{ __html: row.description }} />
          ) : 'No description'
        }
      />
    </>
  );
}
