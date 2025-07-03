import axios from 'axios';
import { m } from 'framer-motion';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { toast } from 'src/components/snackbar';

import { useBoolean } from 'src/hooks/use-boolean';

import { isClient } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';

import { useDataContext } from 'src/auth/context/data/data-context';

// import { NotificationItem } from './cart-item';
import { useRewardStoreProductSelectionCartByUsername } from 'src/_mock/__reward-store-product-selection-carts';
import { fieldsRewardStoreProductSelectionCarts } from 'src/auth/context/data/field-descriptors/field-descriptors-reward-store-product-selection-carts';
import { CartItem } from './cart-item';

// ----------------------------------------------------------------------

export function CartsDrawer({ sx, ...other }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    loadedRewardPoints,
    refetchRewardPoints,
    loadingRewardPoints,
    errorRewardPoints
  } = useDataContext();

  const {
    loading: loadingStoreProductSelectionCarts,
    error: errorStoreProductSelectionCarts,
    data: storeProductSelectionCarts,
    refetch: refetchStoreProductSelectionCarts
  } = useRewardStoreProductSelectionCartByUsername(
    userLogged?.data?.username,
    fieldsRewardStoreProductSelectionCarts
  );

  const [currentStoreProductSelectionCart, setCurrentStoreProductSelectionCart] = useState([]);

  const totalGainedPoints = useMemo(() => loadedRewardPoints?.totalGainedPoints || 0, [loadedRewardPoints]);

  useEffect(() => {
    if (!loadingStoreProductSelectionCarts && !errorStoreProductSelectionCarts) {
      setCurrentStoreProductSelectionCart(storeProductSelectionCarts);
    }
  }, [storeProductSelectionCarts, loadingStoreProductSelectionCarts, errorStoreProductSelectionCarts]);

  useEffect(() => {
    const url = `${CONFIG.wsProtocol}://${CONFIG.apiHost}/api/reward-points/ws/store-product-selection-cart/${userLogged?.data?.username}/`;
    const socket = new WebSocket(url);
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (['created', 'updated', 'deleted'].includes(message.type)) {
        refetchStoreProductSelectionCarts?.()
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [userLogged?.data?.username, refetchStoreProductSelectionCarts]);

  const drawer = useBoolean();

  const confirmDeleteAll = useBoolean();

  const totalCartPoints = useMemo(() =>
    currentStoreProductSelectionCart?.reduce((total, cart) => {
      const points = cart?.storeProductSelection?.storeProduct?.assignedPoints || 0;
      const quantity = cart?.storeProductSelection?.quantity || 0;
      return total + (points * quantity);
    }, 0) || 0,
    [currentStoreProductSelectionCart]
  );

  const handleDeleteAllCarts = useCallback(async () => {
    if (currentStoreProductSelectionCart && currentStoreProductSelectionCart.length > 0) {
      try {
        const payload = {
          userReporter: JSON.stringify(userLogged?.data),
        };

        const url = `${CONFIG.apiUrl}/reward-points/delete/list/store-product-selection-carts/`;

        const promise = axios.delete(url, {
          data: payload
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        toast.promise(promise, {
          loading: 'Loading...',
          success: `Store product selection carts deleted successfully!`,
          error: `Store product selection carts deleted error!`,
        });

        await promise;


      } catch (err) {
        console.error('Error adding product to cart:', err);
      }
    }
  }, [userLogged, currentStoreProductSelectionCart]);

  const renderHead = (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        py: 2,
        pl: 2.5,
        pr: 1,
        minHeight: 50,
        mb: 2,
        mt: 1,
      }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Current Carts
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5, mr: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mr: 2, mb: 0.2 }}>
          {currentStoreProductSelectionCart?.length} Cart(s)
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', mb: 0.2 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mr: 1 }}>
            Available Points:
          </Typography>
          {totalGainedPoints > 0 ? (
            <Label color="success" sx={{ alignItems: 'center' }}>
              <Iconify icon="streamline-cyber-color:bookmark-favorite-star" />
              {totalGainedPoints}
            </Label>
          ) : (
            <Label color="error">
              0
            </Label>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: totalCartPoints <= totalGainedPoints ? 'text.secondary' : 'error.main',
              mr: 1
            }}>
            Total Cart Points:
          </Typography>
          {totalCartPoints > 0 ? (
            <Label
              color={totalCartPoints <= totalGainedPoints ? "success" : "error"}
              sx={{ alignItems: 'center' }}
            >
              <Iconify icon="streamline-cyber-color:bookmark-favorite-star" />
              {totalCartPoints}
            </Label>
          ) : (
            <Label color="error">
              0
            </Label>
          )}
        </Box>
      </Box>
    </Stack>
  );

  const renderList = (
    <Scrollbar>
      <Box component="ul">
        {currentStoreProductSelectionCart?.map((cart) => (
          <Box component="li" key={cart.id} sx={{ display: 'flex' }}>
            <CartItem cart={cart} drawer={drawer} />
            {/* {cart?.storeProductSelection?.storeProduct?.name} */}
          </Box>
        ))}
      </Box>
    </Scrollbar>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={drawer.onTrue}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={currentStoreProductSelectionCart?.length} color="error">
          <SvgIcon sx={{ width: 33, height: 33, mt: -0.7 }}>
            <Iconify icon="solar:cart-check-bold-duotone" width={33} height={33} />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 1, maxWidth: 470, maxHeight: '96%' } }}
      >
        {renderHead}

        {currentStoreProductSelectionCart?.length > 0 && renderList}

        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            size="large"
            color='error'
            variant="outlined"
            onClick={confirmDeleteAll.onTrue}
            disabled={currentStoreProductSelectionCart?.length === 0}
          >
            Delete Current Carts
          </Button>
        </Box>
      </Drawer>
      <ConfirmDialog
        open={confirmDeleteAll.value}
        onClose={confirmDeleteAll.onFalse}
        title={`Delete Carts (${currentStoreProductSelectionCart?.length})`}
        content={
          <>
            Are you sure want to delete a list of <strong> {currentStoreProductSelectionCart?.length} </strong>,
            with total points <strong> {totalCartPoints} </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteAllCarts();
              confirmDeleteAll.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}
