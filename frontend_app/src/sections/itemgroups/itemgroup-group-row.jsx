import React, { useEffect, useMemo, useState } from 'react';

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
import { Box } from '@mui/material';
import { Scrollbar } from 'src/components/scrollbar';


// ----------------------------------------------------------------------

export function ItemgroupGroupRow({
  row,
  selectedItem,
  setSelectedItem,
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const theme = useTheme();

  const [openItems, setOpenItems] = useState(false);

  const listItems = useMemo(() => row?.listItems || [], [row]);

  useEffect(() => {
    if (selectedItem && row?.listItems?.some(i => i.id === selectedItem.id)) {
      setOpenItems(true);
    }
    else {
      setOpenItems(false);
    }
  }, [selectedItem, row]);

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
            <Iconify icon={!openItems ? "ph:plus-fill" : "ph:minus-fill"} />
          </IconButton>
        </Box>
      </MenuItem>

      {openItems && (
        <Scrollbar sx={{ maxHeight: 240, ml: 1, mb: 2 }}>
          <MenuList>
            {listItems.map((item) => (
              <MenuItem
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                }}
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
                  width: selectedItem ? '90%' : '100%',
                  backgroundColor: selectedItem?.id === item.id ? '#E8E8E8' : 'transparent',
                  // boxShadow: theme.customShadows.z20,
                  transition: theme.transitions.create(['background-color', 'box-shadow'], {
                    duration: theme.transitions.duration.shortest,
                  }),
                }}>
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Typography variant="body2">{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {item.sku || 'No SKU'}
                    </Typography>
                  </Box>

                </Box>
              </MenuItem>
            ))}
          </MenuList>
        </Scrollbar>
      )}
    </>
  );
}
