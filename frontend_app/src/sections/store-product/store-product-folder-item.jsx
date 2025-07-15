import dayjs from 'dayjs';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { Chip, Rating, Tooltip, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { useBoolean } from 'src/hooks/use-boolean';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { fDate } from 'src/utils/format-time';
import { isClient, listRolesAndSubroles } from 'src/utils/check-permissions';
import { fNumber, fShortenNumber } from 'src/utils/format-number';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useRewardStoreProductSelectionCartByUsername } from 'src/_mock/__reward-store-product-selection-carts';
import { fieldsRewardStoreProductSelectionBuys, fieldsRewardStoreProductSelectionCarts } from 'src/auth/context/data/field-descriptors/field-descriptors-reward-store-product-selection';
import { fieldsRewardStoreProductDetails } from 'src/auth/context/data/field-descriptors/field-descriptors-reward-store-products';
import { useRewardStoreProductDetailsById } from 'src/_mock/__reward-store-products';
import { useRewardStoreProductSelectionBuyByUsername } from 'src/_mock/__reward-store-product-selection-buys';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { IncrementerButton } from './components/incrementer-button';
import { StoreProductFolderItemCarousel } from './store-product-folder-item-carousel';

// ----------------------------------------------------------------------

export function StoreProductFolderItem({
  sx,
  folder,
  selected,
  onSelect,
  onDelete,
  onViewRow,
  onEditRow,
  onManageActiveRow,
  setTableData,
  refetchStoreProducts,
  storeProductSelectionCarts,
  storeProductSelectionBuys,
  loadingStoreProductSelectionCarts,
  loadingStoreProductSelectionBuys,
  errorStoreProductSelectionCarts,
  errorStoreProductSelectionBuys,
  refetchStoreProductSelectionCarts,
  refetchStoreProductSelectionBuys,
  loadedRewardPoints,
  refetchRewardPoints,
  loadingRewardPoints,
  errorRewardPoints,
  ...other }) {

  const router = useRouter();

  const confirmBuy = useBoolean(false);

  const confirmCheckout = useBoolean(false);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);
  const roleName = useMemo(() => userLogged?.data?.user_role?.name, [userLogged]);
  const totalGainedPoints = useMemo(() => loadedRewardPoints?.totalGainedPoints || 0, [loadedRewardPoints]);
  const totalAssignedPoints = useMemo(() => loadedRewardPoints?.totalAssignedPoints || 0, [loadedRewardPoints]);
  const totalAvailablePoints = useMemo(() => loadedRewardPoints?.totalAvailablePoints || 0, [loadedRewardPoints]);

  const {
    loading: productLoading,
    error: productError,
    data: product,
    refetch: refetchProductDetails
  } = useRewardStoreProductDetailsById(folder?.id, fieldsRewardStoreProductDetails);

  const popover = usePopover();

  const confirm = useBoolean();

  const confirmActivation = useBoolean();

  const checkbox = useBoolean();

  const [favorite, setFavorite] = useState(false);

  const [currentProduct, setCurrentProduct] = useState(null);

  const folderPoints = useMemo(() => currentProduct?.assignedPoints || 0, [currentProduct]);

  const [folderName, setFolderName] = useState(currentProduct?.name);

  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setFolderName(product.name);
    }
  }, [product]);


  useEffect(() => {
    let socket;
    if (product && !productLoading && !productError) {
      socket = new WebSocket(
        `${CONFIG.wsProtocol}://${CONFIG.apiHost}/api/reward-points/ws/store-product/${product.id}/`
      );

      socket.onerror = (errorEvent) => {
        console.error('WebSocket error:', errorEvent);
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (
          message.type === 'created' ||
          message.type === 'updated' 
          // message.type === 'deleted'
        ) {
          refetchProductDetails().catch((err) => console.error('Error fetching product data:', err));
        }
      };
    }
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [product, productLoading, productError, refetchProductDetails]);

  const [values, setValue] = useState({
    quantity: 1,
    available: currentProduct?.stock_on_hand || 0,
  });

  const totalReviews = useMemo(
    () => currentProduct?.reviews?.length || 0,
    [currentProduct]
  );


  const totalRatings = useMemo(
    () => (currentProduct?.reviews?.reduce((total, review) => total + review.rating, 0) || 0) / (currentProduct?.reviews?.length || 1),
    [currentProduct]
  );

  useEffect(() => {
    if (currentProduct) {
      const isSelected = storeProductSelectionCarts?.some(
        (cart) => cart.storeProductSelection?.storeProduct?.id === currentProduct.id &&
          cart.storeProductSelection?.user?.username === userLogged?.data?.username &&
          !cart.isBought
      );
      setFavorite(isSelected || false);
      const isPurchased = storeProductSelectionBuys?.some(
        (buy) => buy.storeProductSelection?.storeProduct?.id === currentProduct.id &&
          buy.storeProductSelection?.user?.username === userLogged?.data?.username
      );
      setPurchased(isPurchased || false);
    }
  }, [currentProduct, storeProductSelectionCarts, userLogged?.data?.username, storeProductSelectionBuys]);


  const handleAddCart = useCallback(async () => {
    const quantity = 1;
    if (currentProduct) {
      try {
        const payload = {
          quantity,
          userReporter: JSON.stringify(userLogged?.data),
        };

        const url = `${CONFIG.apiUrl}/reward-points/create/store-product-selection-cart/${currentProduct?.id}/`;

        const promise = axios.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        toast.promise(promise, {
          loading: 'Loading...',
          success: `Store product added to cart successfully!`,
          error: `Store product added to cart error!`,
        });

        await promise;


      } catch (err) {
        console.error('Error adding product to cart:', err);
      }
    }
  }, [currentProduct, userLogged]);


  const handleDeleteCart = useCallback(async () => {
    if (currentProduct) {
      const cart = storeProductSelectionCarts?.find(
        (c) => c.storeProductSelection?.storeProduct?.id === currentProduct.id &&
          c.storeProductSelection?.user?.username === userLogged?.data?.username
      );
      if (cart) {
        try {
          const payload = {
            userReporter: JSON.stringify(userLogged?.data),
          };

          const url = `${CONFIG.apiUrl}/reward-points/delete/store-product-selection-cart/${cart?.id}/`;

          const promise = axios.delete(url, {
            data: payload
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          toast.promise(promise, {
            loading: 'Loading...',
            success: `Store product removed from cart successfully!`,
            error: `Store product removed from cart error!`,
          });

          await promise;


        } catch (err) {
          console.error('Error adding product to cart:', err);
        }
      }
    }
  }, [userLogged, currentProduct, storeProductSelectionCarts]);

  const onAddBuy = useCallback(async () => {
    if (currentProduct) {
      try {
        const payload = {
          quantity: 1,
          userReporter: JSON.stringify(userLogged?.data),
        };

        const url = `${CONFIG.apiUrl}/reward-points/create/store-product-selection-buy/${currentProduct?.id}/`;

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

        refetchProductDetails?.().catch((err) => console.error('Error fetching product data:', err));

        refetchStoreProductSelectionBuys?.().catch((err) => console.error('Error fetching store product selection buys:', err));

        refetchRewardPoints?.().catch((err) => console.error('Error fetching reward points:', err));

        refetchStoreProducts?.().catch((err) => console.error('Error fetching store products:', err));

        await promise;


      } catch (err) {
        console.error('Error purchasing product:', err);
      }
    }
  }, [
    currentProduct,
    userLogged,
    refetchProductDetails,
    refetchStoreProductSelectionBuys,
    refetchRewardPoints,
    refetchStoreProducts
  ]);

  const renderQuantity = (
    <Stack direction="row">
      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
        Quantity
      </Typography>

      <Stack spacing={1}>
        <IncrementerButton
          name="quantity"
          quantity={values.quantity}
          disabledDecrease={values.quantity <= 1}
          disabledIncrease={values.quantity >= values.available}
          onIncrease={() => setValue('quantity', values.quantity + 1)}
          onDecrease={() => setValue('quantity', values.quantity - 1)}
        />

        <Typography variant="caption" component="div" sx={{ textAlign: 'right' }}>
          Available: {values.available}
        </Typography>
      </Stack>
    </Stack>
  );




  const renderAction = (
    <Stack direction="row" alignItems="center" sx={{ top: 8, right: 8, position: 'absolute' }}>
      {roleName === 'client' && (
        <React.Fragment key='client'>
          <Tooltip
            title={favorite ?
              `Remove ${currentProduct?.name} from cart` :
              `Add ${currentProduct?.name} to cart with quantity 1`
            }
            arrow
            placement="top"
          >
            <Checkbox
              color="secondary"
              icon={<Iconify icon="solar:cart-check-bold-duotone" color="default" width={30} height={30} />}
              checkedIcon={<Iconify icon="solar:cart-check-bold-duotone" color="info" width={35} height={35} />}
              checked={favorite}
              onChange={() => {
                if (!favorite) {
                  handleAddCart();
                } else {
                  handleDeleteCart();
                }
              }}
              inputProps={{
                name: 'checkbox-favorite',
                'aria-label': 'Checkbox favorite',
              }}
            />
          </Tooltip>

          <Tooltip
            title={purchased ?
              ((totalAvailablePoints < folderPoints && isClient(roleName)) ?
                `You need ${folderPoints - totalAvailablePoints} more points to purchase ${currentProduct?.name}` :
                `${currentProduct?.name} already purchased`
              ) :
              ((totalAvailablePoints < folderPoints && isClient(roleName)) ?
                `You need ${folderPoints - totalAvailablePoints} more points to purchase ${currentProduct?.name}` :
                `Make new purchase of ${currentProduct?.name} with quantity 1`
              )
            }
            arrow
            placement="top"
          >
            <span>
              <IconButton
                color={!purchased ? 'default' : 'success'}
                disabled={totalAvailablePoints < folderPoints}
                sx={{
                  cursor: totalAvailablePoints < folderPoints ? 'not-allowed' : 'pointer',
                  '&.Mui-disabled': {
                    cursor: 'not-allowed !important',
                    pointerEvents: 'auto',
                  }
                }}
                onClick={() => {
                  if (!purchased) {
                    confirmBuy.onTrue();
                  } else {
                    toast.info(`${currentProduct?.name} already purchased`);
                  }
                }}
              >
                <Iconify
                  icon="bxs:purchase-tag"
                  color={!purchased ? "default" : "success"}
                  width={!purchased ? 25 : 30}
                  height={!purchased ? 25 : 30}
                />
              </IconButton>
            </span>
          </Tooltip>
        </React.Fragment>
      )}

      <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>
    </Stack>
  );

  const renderIcon = (
    <Box
      onMouseEnter={checkbox.onTrue}
      onMouseLeave={checkbox.onFalse}
      sx={{
        width: 100,
        height: 100
      }}
    >
      {/* {(checkbox.value || selected) && onSelect && !isClient(userLogged?.data?.user_role?.name) ? (
        <Checkbox
          checked={selected}
          onClick={onSelect}
          icon={<Iconify icon="eva:radio-button-off-fill" />}
          checkedIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
          sx={{ width: 1, height: 1 }}
        />
      ) : ( */}
      {/* // <Box
        //   component="img"
        //   src={`${CONFIG.assetsDir}/assets/icons/files/ic-folder.svg`}
        //   sx={{ width: 1, height: 1 }}
        //   onClick={
        //     () => {
        //       localStorage.removeItem('projectReminderTab');
        //       onViewRow();
        //     }
        //   }
        // /> */}
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 2 }}>
        <StoreProductFolderItemCarousel images={currentProduct?.attachments ?? []} />
        <Tooltip title={`Rating ${totalRatings.toFixed(2)}`} arrow placement="top">
          <Box sx={{ display: 'flex', flexDirection: 'column' }} onClick={onViewRow}>
            <Rating readOnly value={totalRatings} precision={0.1} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              ({fShortenNumber(totalReviews)} reviews)
            </Typography>
            {(totalAvailablePoints < folderPoints && isClient(roleName)) && (
              <Typography variant="caption" sx={{ color: 'error.main' }}>
                You need <b>{folderPoints - totalAvailablePoints}</b> more points to purchase
              </Typography>
            )}
          </Box>
        </Tooltip>
      </Box>
      {/* )
      } */}
    </Box >
  );

  const renderText = (
    <ListItemText
      // onClick={details.onTrue}
      onClick={() => {
        localStorage.removeItem('storeProductReminderTab');
        onViewRow();
      }}
      primary={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 'fontWeightBold',
              color: 'text.primary',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {currentProduct?.name}
          </Typography>
          {!currentProduct?.isActive && (
            <Chip label="Inactive" color="error" size="small" />
          )}
        </Box>
      }
      secondary={
        <>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tooltip title="Value in points">
              <Iconify icon="streamline-sharp-color:shopping-bag-hand-bag-price-tag" sx={{ color: 'error.main' }} />
            </Tooltip>
            <Box
              component="span"
              sx={{
                mx: 0.75,
                width: 2,
                height: 2,
                borderRadius: '50%',
                bgcolor: 'currentColor',
              }}
            />
            <b>{currentProduct?.assignedPoints}</b>{'  '}point(s)
          </Box>
        </>
      }
      primaryTypographyProps={{ noWrap: false, typography: 'subtitle1' }}
      secondaryTypographyProps={{
        mt: 0.5,
        component: 'span',
        alignItems: 'center',
        typography: 'caption',
        color: 'text.disabled',
        display: 'inline-flex',
      }}
    />
  );


  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          gap: 1,
          p: 2.5,
          maxWidth: 222,
          display: 'flex',
          borderRadius: 2,
          cursor: 'pointer',
          position: 'relative',
          bgcolor: !currentProduct?.isActive ? 'error.lighter' :
            purchased ? 'success.lighter' :
              !favorite ? 'transparent' : 'secondary.lighter',
          flexDirection: 'column',
          alignItems: 'flex-start',
          ...((checkbox.value || selected) && {
            bgcolor: purchased ? 'success.lighter' : !favorite ? 'transparent' : 'secondary.lighter',
            boxShadow: (theme) => theme.customShadows.z20,
          }),
          ...sx,
        }}
        {...other}
      >
        {renderIcon}

        {renderAction}

        {renderText}

        {/* {(!!currentProduct?.usersAssignees?.length && !isInstaller(userLogged?.data?.user_role?.name)) && renderAvatar} */}

      </Paper>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              // details.onTrue();
              localStorage.removeItem('storeProductReminderTab');
              onViewRow();
            }}
          >
            <Iconify icon="lsicon:view-filled" />
            View Store Product
          </MenuItem>

          {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.superadmin) ? [
            <Divider key="divider" sx={{ borderStyle: 'dashed' }} />,
            <MenuItem
              key="status"
              onClick={() => {
                confirmActivation.onTrue();
                popover.onClose();
              }}
              sx={{ color: folder?.isActive ? 'warning.main' : 'success.main' }}
            >
              <Iconify
                icon={folder?.isActive ? 'material-symbols:tab-close-inactive' : 'nrk:check-active'}
              />
              {folder?.isActive ? 'Deactivate' : 'Activate'} Store Product
            </MenuItem>,
            <MenuItem
              key="delete"
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete Store Product
            </MenuItem>
          ] : null}
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Store Product"
        content={`Are you sure want to delete store product ${folderName}?`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              await onDelete(folder?.id);
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmActivation.value}
        onClose={confirmActivation.onFalse}
        title={folder?.isActive ? 'Deactivate Store Product' : 'Activate Store Product'}
        content={`Are you sure want to ${folder?.isActive ? 'deactivate' : 'activate'} store product ${folder?.name}?`}
        action={
          <Button
            variant="contained"
            color={folder?.isActive ? 'warning' : 'success'}
            onClick={async () => {
              await onManageActiveRow(folder?.id)
              confirmActivation.onFalse();
            }}
          >
            {folder?.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmBuy.value}
        onClose={confirmBuy.onFalse}
        title={`Buying Cart: ${folderName}`}
        content={
          <>
            Are you sure want to buy <strong> {folderName} </strong>,
            with quantity <strong> 1 </strong>
            spending <strong>{fNumber(folderPoints)}</strong> point(s)?
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
        open={confirmCheckout.value}
        onClose={confirmCheckout.onFalse}
        title={`Checking out: ${product?.name}`}
        content={
          <>
            You are going to checkout a product <strong> {folderName} </strong>,
            spending <strong>{fNumber(folderPoints)}</strong> point(s) ... Are you sure?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              confirmCheckout.onFalse();
              onAddBuy();
            }}
          >
            Confirm Checkout
          </Button>
        }
      />
    </>
  );
}
