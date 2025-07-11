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
import { fNumber } from 'src/utils/format-number';

// import { NotificationItem } from './cart-item';
import { useRewardStoreProductSelectionCartByUsername } from 'src/_mock/__reward-store-product-selection-carts';
import { fieldsRewardStoreProductSelectionCarts } from 'src/auth/context/data/field-descriptors/field-descriptors-reward-store-product-selection';
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

  const [selectedCart, setSelectedCart] = useState(null);

  const selectedQuantity = useMemo(() => {
    if (selectedCart) {
      return selectedCart?.storeProductSelection?.quantity || 0;
    }
    return 0;
  }, [selectedCart]);

  const selectedPoints = useMemo(() => {
    if (selectedCart) {
      const assignedPoints = selectedCart?.storeProductSelection?.storeProduct?.assignedPoints || 0;
      return assignedPoints * selectedQuantity || 0;
    }
    return 0;
  }, [selectedCart, selectedQuantity]);

  const totalGainedPoints = useMemo(() => loadedRewardPoints?.totalGainedPoints || 0, [loadedRewardPoints]);

  const totalAssignedPoints = useMemo(() => loadedRewardPoints?.totalAssignedPoints || 0, [loadedRewardPoints]);

  const totalAvailablePoints = useMemo(() => loadedRewardPoints?.totalAvailablePoints || 0, [loadedRewardPoints]);

  useEffect(() => {
    if (!loadingStoreProductSelectionCarts && !errorStoreProductSelectionCarts) {
      setCurrentStoreProductSelectionCart(
        storeProductSelectionCarts.filter(c => !c?.isBought)
      );
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

  const confirmBuy = useBoolean(false);

  const confirmCheckout = useBoolean(false);

  const confirmBuyAll = useBoolean(false);

  const confirmCheckoutAll = useBoolean(false);

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

  const onClickBuy = useCallback((cart) => {
    if (cart) {
      setSelectedCart(cart);
      confirmBuy.onTrue();
    }
  }, [confirmBuy]);

  const onAddBuy = useCallback(async (cart) => {
    if (cart) {
      try {
        const payload = {
          userReporter: JSON.stringify(userLogged?.data),
        };

        const url = `${CONFIG.apiUrl}/reward-points/create/store-product-selection-cart-buy/${cart?.id}/`;

        const promise = axios.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        toast.promise(promise, {
          loading: 'Loading...',
          success: `Store product purchased successfully!`,
          error: `Store product purchase error!`,
        });

        refetchStoreProductSelectionCarts?.().catch((err) => console.error('Error fetching product data:', err));

        refetchRewardPoints?.().catch((err) => console.error('Error fetching reward points:', err));

        await promise;


      } catch (err) {
        console.error('Error purchasing product:', err);
      }
    }
  }, [
    userLogged,
    refetchStoreProductSelectionCarts,
    refetchRewardPoints,
  ]);

  const onBuyAll = useCallback(async () => {
    if (currentStoreProductSelectionCart && currentStoreProductSelectionCart.length > 0) {
      try {
        const payload = {
          userReporter: JSON.stringify(userLogged?.data),
        };

        const url = `${CONFIG.apiUrl}/reward-points/create-all/store-product-selection-cart-buy/`;

        const promise = axios.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        toast.promise(promise, {
          loading: 'Loading...',
          success: `All store products purchased successfully!`,
          error: `All store products purchase error!`,
        });

        refetchStoreProductSelectionCarts?.().catch((err) => console.error('Error fetching product data:', err));

        refetchRewardPoints?.().catch((err) => console.error('Error fetching reward points:', err));

        await promise;

      } catch (err) {
        console.error('Error purchasing all products:', err);
      }
    }
  }, [
    userLogged,
    refetchStoreProductSelectionCarts,
    refetchRewardPoints,
    currentStoreProductSelectionCart
  ]);

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
          {totalAvailablePoints > 0 ? (
            <Label color="success" sx={{ alignItems: 'center' }}>
              <Iconify icon="streamline-cyber-color:bookmark-favorite-star" />
              {totalAvailablePoints}
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
              color: totalCartPoints <= totalAvailablePoints ? 'text.secondary' : 'error.main',
              mr: 1
            }}>
            Total Cart Points:
          </Typography>
          {totalCartPoints > 0 ? (
            <Label
              color={totalCartPoints <= totalAvailablePoints ? "success" : "error"}
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
            <CartItem
              cart={cart}
              drawer={drawer}
              onClickBuy={onClickBuy}
              totalAvailablePoints={totalAvailablePoints}
              storeProductSelectionCarts={currentStoreProductSelectionCart}
              refetchStoreProductSelectionCarts={refetchStoreProductSelectionCarts}
            />
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

        <Box sx={{ p: 1, display: 'flex', flexDirection: 'row', gap: 1 }}>
          <Button
            fullWidth
            size="large"
            color='primary'
            variant="outlined"
            onClick={confirmBuyAll.onTrue}
            disabled={currentStoreProductSelectionCart?.length === 0}
          >
            Buy all Carts
          </Button>
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
      <ConfirmDialog
        open={confirmBuy.value}
        onClose={confirmBuy.onFalse}
        title={`Buying Cart: ${selectedCart?.storeProductSelection?.storeProduct?.name}`}
        content={
          <>
            Are you sure want to buy <strong> {selectedCart?.storeProductSelection?.storeProduct?.name} </strong>,
            with quantity <strong> {selectedQuantity} </strong>
            spending <strong>{
              fNumber(selectedPoints)
            }</strong> point(s)?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              confirmBuy.onFalse();
              confirmCheckout.onTrue();
            }}
          >
            Buy
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmBuyAll.value}
        onClose={confirmBuyAll.onFalse}
        title='Buying All Carts'
        content={
          <>
            Are you sure want to buy all products in the cart: <br /><br />
            <ul>
              {currentStoreProductSelectionCart.map((item, index) => (
                <li key={item.id}>
                  # {index + 1} - {item.storeProductSelection.storeProduct.name} (Qty: x<strong>{item.storeProductSelection.quantity}</strong>)
                </li>
              ))}
            </ul>
            <br />
            with total points <strong>{fNumber(totalCartPoints)}</strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              confirmBuyAll.onFalse();
              confirmCheckoutAll.onTrue();
            }}
          >
            Buy All
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmCheckout.value}
        onClose={confirmCheckout.onFalse}
        title={`Checking out: ${selectedCart?.storeProductSelection?.storeProduct?.name}`}
        content={
          <>
            You are going to checkout a product <strong> {
              selectedCart?.storeProductSelection?.storeProduct?.name
            } </strong>,
            spending <strong>{
              fNumber(selectedPoints)}</strong> point(s) ... Are you sure?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              confirmCheckout.onFalse();
              onAddBuy(selectedCart);
            }}
          >
            Confirm Checkout
          </Button>
        }
      />
      
      <ConfirmDialog
        open={confirmCheckoutAll.value}
        onClose={confirmCheckoutAll.onFalse}
        title='Checking out All Carts'
        content={
          <>
            Are you sure want to checkout all products in the cart with total points <strong>
              {fNumber(totalCartPoints)}
            </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={async() => {
              await onBuyAll();
              confirmCheckoutAll.onFalse();
            }}
          >
            Confirm Checkout All
          </Button>
        }
      />
    </>
  );
}
