import React, { useContext, useMemo } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { fieldsDealerportalQuotes } from 'src/auth/context/data/field-descriptors/field-descriptors-dealerportal-quotes';
import { useDealerportalQuoteById } from 'src/_mock/__dealerportal-quotes';

import { LoadingContext } from 'src/auth/context/loading-context';
import { fDate, fDateTime } from 'src/utils/format-time';
import { fCurrency, fNumber } from 'src/utils/format-number';
import { DealerportalQuoteModalEdit } from './dealerportal-quote-modal-edit';


// ----------------------------------------------------------------------

export function DealerportalQuoteTableRow({
  row,
  index,
  selected,
  onSelectRow,
  onDeleteRow,
  onViewRow,
  onCloneRow,
  onReturnList,
  isMobile,
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const confirm = useBoolean();

  const collapse = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  const {
    refetch: refetchQuote
  } = useDealerportalQuoteById(row?.id, fieldsDealerportalQuotes);

  const openEditQuote = useBoolean();

  const isOrdered = useMemo(() => row?.status?.toLowerCase() === 'ordered', [row?.status]);

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1} sx={{ cursor: 'pointer' }}>

        {/* <TableCell padding="checkbox">
          <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
        </TableCell> */}
        
        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
          {row?.number}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
          {!isMobile ? fDateTime(row?.createdAt) : fDate(row?.createdAt)}
        </TableCell>

        {!isMobile && (

          <TableCell onClick={() => onViewRow()}>
            <Label
              variant="soft"
              color={
                (row?.status?.toLowerCase() === 'active' && 'success') ||
                (row?.status?.toLowerCase() === 'inactive' && 'error') ||
                (row?.status?.toLowerCase() === 'ordered' && 'warning') ||
                'default'
              }
              sx={{ cursor: 'pointer' }}
            >
              {row?.status?.toUpperCase()}
            </Label>
          </TableCell>

        )}

        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexDirection: 'column' }}>
            {row?.name || 'N/A'}
            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'row' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Status:
                </Typography>
                <Label
                  variant="soft"
                  color={
                    (row?.status?.toLowerCase() === 'active' && 'success') ||
                    (row?.status?.toLowerCase() === 'inactive' && 'error') ||
                    (row?.status?.toLowerCase() === 'ordered' && 'warning') ||
                    'default'
                  }
                  sx={{ cursor: 'pointer' }}
                >
                  {row?.status?.toUpperCase()}
                </Label>
              </Box>
            )}
          </Box>
        </TableCell>

        {!isMobile && (
          <>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {row?.owner?.companyName || 'N/A'}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {`${row?.createdBy?.firstName} ${row?.createdBy?.lastName}` || 'N/A'}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {fCurrency(row?.totalSell || 0)}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {fCurrency(row?.totalCost || 0)}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {fDateTime(row?.updatedAt)}
            </TableCell>
          </>
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
              onViewRow();
              popover.onClose();
            }}
          >
            <Iconify icon="lets-icons:view" />
            View Quote
          </MenuItem>
          {!isOrdered && (
            <MenuItem
              onClick={() => {
                openEditQuote.onTrue();
                popover.onClose();
              }}
            >
              <Iconify icon="ph:pencil-line" />
              Edit Quote
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              onCloneRow();
              popover.onClose();
            }}
          >
            <Iconify icon="fa6-solid:clone" />
            Clone Quote
          </MenuItem>
          {!isOrdered && (
            <MenuItem
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete Quote
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete quote: (${row.name})?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />

      <DealerportalQuoteModalEdit
        openEditQuote={openEditQuote}
        userLogged={userLogged}
        quote={row}
        refetch={refetchQuote}
      />
    </>
  );
}
