import dayjs from 'dayjs';
import { useMemo, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { Rating, Tooltip, Typography } from '@mui/material';
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
import { fShortenNumber } from 'src/utils/format-number';

import { CONFIG } from 'src/config-global';
import { useRewardStoreProductSelectionCartByUsername } from 'src/_mock/__reward-store-product-selection-carts';
import { fieldsRewardStoreProductSelectionCarts } from 'src/auth/context/data/field-descriptors/field-descriptors-reward-store-product-selection-carts';

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
  setTableData,
  refetchStoreProducts,
  ...other }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    loading: loadingStoreProductSelectionCarts,
    error: errorStoreProductSelectionCarts,
    data: storeProductSelectionCarts,
    refetch: refetchStoreProductSelectionCarts
  } = useRewardStoreProductSelectionCartByUsername(
    userLogged?.data?.username,
    fieldsRewardStoreProductSelectionCarts
  );

  const popover = usePopover();

  const confirm = useBoolean();

  const checkbox = useBoolean();

  const [favorite, setFavorite] = useState(false);

  const [purchased, setPurchased] = useState(false);

  const [folderName, setFolderName] = useState(folder?.name);

  const [values, setValue] = useState({
    quantity: 1,
    available: folder?.stock_on_hand || 0,
  });

  const totalReviews = useMemo(
    () => folder?.reviews?.length || 0,
    [folder]
  );


  const totalRatings = useMemo(
    () => (folder?.reviews?.reduce((total, review) => total + review.rating, 0) || 0) / (folder?.reviews?.length || 1),
    [folder]
  );

  useEffect(() => {
    if (folder) {
      const isSelected = storeProductSelectionCarts?.some(
        (cart) => cart.storeProductSelection?.storeProduct?.id === folder.id &&
          cart.storeProductSelection?.user?.username === userLogged?.data?.username
      );
      setFavorite(isSelected || false);
    }
  }, [folder, storeProductSelectionCarts, userLogged?.data?.username]);


  const handleAddCart = useCallback(async () => {
    const quantity = 1;
    if (folder) {
      try {
        const payload = {
          quantity,
          userReporter: JSON.stringify(userLogged?.data),
        };

        const url = `${CONFIG.apiUrl}/reward-points/create/store-product-selection-cart/${folder?.id}/`;

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
  }, [folder, userLogged]);


  const handleDeleteCart = useCallback(async () => {
    if (folder) {
      const cart = storeProductSelectionCarts?.find(
        (c) => c.storeProductSelection?.storeProduct?.id === folder.id &&
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
  }, [userLogged, folder, storeProductSelectionCarts]);

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
      <Tooltip
        title={favorite ?
          `Remove ${folder?.name} from cart` :
          `Add ${folder?.name} to cart with quantity 1`
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
          `${folder?.name} already purchased` :
          `Make new purchase of ${folder?.name} with quantity 1`
        }
        arrow
        placement="top"
      >
        <IconButton color={!purchased ? 'default' : 'success'}>
          <Iconify
            icon="bxs:purchase-tag"
            color={!purchased ? "default" : "success"}
            width={!purchased ? 25 : 30}
            height={!purchased ? 25 : 30}
          />
        </IconButton>
      </Tooltip>

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
        <StoreProductFolderItemCarousel images={folder?.attachments ?? []} />
        <Tooltip title={`Rating ${totalRatings.toFixed(2)}`} arrow placement="top">
          <Box sx={{ display: 'flex', flexDirection: 'column' }} onClick={onViewRow}>
            <Rating readOnly value={totalRatings} precision={0.1} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              ({fShortenNumber(totalReviews)} reviews)
            </Typography>
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
      primary={folder?.name}
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
            <b>{folder.assignedPoints}</b>{'  '}point(s)
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
          bgcolor: purchased ? 'success.lighter' : !favorite ? 'transparent' : 'secondary.lighter',
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

        {/* {(!!folder?.usersAssignees?.length && !isInstaller(userLogged?.data?.user_role?.name)) && renderAvatar} */}

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
          <Button variant="contained" color="error" onClick={onDelete}>
            Delete
          </Button>
        }
      />
    </>
  );
}
