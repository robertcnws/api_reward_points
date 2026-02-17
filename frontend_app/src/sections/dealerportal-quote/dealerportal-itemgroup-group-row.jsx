import React, { useEffect, useMemo, useState, useRef } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableRow, { tableRowClasses } from '@mui/material/TableRow';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';

import { useBoolean } from 'src/hooks/use-boolean';

import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Box, Dialog, DialogActions, DialogContent } from '@mui/material';
import { Scrollbar } from 'src/components/scrollbar';
import { ItemgroupGroupItemDetails } from '../itemgroups/itemgroup-group-item-details';


// ----------------------------------------------------------------------

export function DealerportalItemgroupGroupRow({
  row,
  selectedItem,
  setSelectedItem,
  handleCloseSelectedItem,
  onManageProduct,
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const theme = useTheme();

  const rowDetails = useBoolean();

  const [openItems, setOpenItems] = useState(false);

  const listItems = useMemo(() => row?.listItems || [], [row]);

  const clickTimeout = useRef(null);

  useEffect(() => {
    if (!selectedItem) return;

    const belongsToThisGroup = row?.listItems?.some((i) => i.id === selectedItem.id);
    if (belongsToThisGroup) setOpenItems(true);
  }, [selectedItem, row?.listItems]);

  return (
    <>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation();
          setOpenItems((prev) => !prev);
        }}
        sx={{
          p: 0
        }}
      >
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          padding: 1,
          width: '100%',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Iconify
              icon={!openItems ? "fluent:folder-20-regular" : "hugeicons:folder-open"}
              sx={{ mr: 1, color: 'text.secondary', width: 45, height: 45 }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">
                {row?.groupName || 'No Name'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`${listItems.length} item(s)`}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            color={!openItems ? 'primary' : 'error'}
            onClick={(e) => {
              e.stopPropagation();
              setOpenItems((prev) => !prev);
            }}
          >
            <Iconify icon={!openItems ? "si:expand-more-alt-fill" : "si:expand-less-alt-fill"} />
          </IconButton>
        </Box>
      </MenuItem>

      {openItems && (
        <Scrollbar sx={{ maxHeight: 240, ml: 1, mb: 2 }}>
          <MenuList>
            {listItems.map((item) => (
              <MenuItem
                key={item.id}
                sx={{
                  backgroundColor: selectedItem?.id === item.id ? '#E8E8E8' : 'transparent',
                  '&:hover': {
                    backgroundColor: selectedItem?.id === item.id ? '#E8E8E8' : 'transparent',
                  },
                  p: 0
                }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  // borderRadius: 1,
                  p: 1,
                  ml: 2,
                  width: '100%',
                  backgroundColor: selectedItem?.id === item.id ? '#E8E8E8' : 'transparent',
                  // boxShadow: theme.customShadows.z20,
                  transition: theme.transitions.create(['background-color', 'box-shadow'], {
                    duration: theme.transitions.duration.shortest,
                  }),
                }}>
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      minWidth: 0,           
                    }}
                    onClick={() => {
                      if (clickTimeout.current) return;
                      clickTimeout.current = setTimeout(() => {
                        setSelectedItem(item);
                        rowDetails.onTrue();
                        clickTimeout.current = null;
                      }, 250); 
                    }}
                    onDoubleClick={async () => {
                      if (clickTimeout.current) {
                        clearTimeout(clickTimeout.current);
                        clickTimeout.current = null;
                      }

                      await onManageProduct(item.id, 'add');
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {item.sku || 'No SKU'}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onManageProduct(item.id, 'add');
                      }}
                    >
                      <Iconify icon="icon-park-outline:folder-plus" />
                    </IconButton>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </MenuList>
        </Scrollbar>
      )}

      <Dialog
        open={rowDetails.value}
        onClose={rowDetails.onFalse}
        fullWidth
        maxWidth="md"
      >
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <ItemgroupGroupItemDetails
              selectedItem={selectedItem}
              handleCloseSelectedItem={rowDetails.onFalse}
              isFromTable
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Stack
            justifyContent="center"
            alignItems="center"
            sx={{ width: '100%', p: 2, display: 'flex', flexDirection: 'row', gap: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                await onManageProduct(selectedItem?.id, 'add');
                rowDetails.onFalse();
              }}
            >
              Add to Quote
            </Button>
            <Button variant="outlined" onClick={rowDetails.onFalse}>
              Close
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

    </>
  );
}
