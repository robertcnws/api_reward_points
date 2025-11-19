import { LoadingButton } from "@mui/lab";
import { Autocomplete, Box, Button, Chip, ListItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDataContext } from "src/auth/context/data/data-context";
import { axiosInstanceBackend, endpoints } from "src/utils/axios";
import { ConfirmDialog } from "src/components/custom-dialog";
import { toast } from 'src/components/snackbar';
import { Iconify } from "src/components/iconify";
import { Label } from "src/components/label";
import { StoreProductFolderItemCarousel } from "../store-product/store-product-folder-item-carousel";
import { IncrementerButton } from "../items/components/incrementer-button";


export const PurchaseAddCartModalForm = ({
    openAddCart,
}) => {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [loading, setLoading] = useState(false);

    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedReward, setSelectedReward] = useState(null);
    const [quantity, setQuantity] = useState(0);

    const {
        loadedClients,
        refetchClients,
        loadedStoreProducts,
    } = useDataContext();

    useEffect(() => {
        if (openAddCart.value) {
            refetchClients();
        }
    }, [openAddCart.value, refetchClients]);

    const handleReset = () => {
        setSelectedClient(null);
        setSelectedReward(null);
        setQuantity(0);
    }

    const handleResetClient = () => {
        setSelectedClient(null);
        setQuantity(0);
    }

    const handleResetReward = () => {
        setSelectedReward(null);
        setQuantity(0);
    }

    const handleClose = () => {
        openAddCart.onFalse();
        handleReset();
    }

    const isValidForm = () => selectedClient && selectedReward && quantity > 0;

    const onAddCart = useCallback(async () => {
        if (selectedReward && selectedClient && quantity > 0) {
            setLoading(true);
            try {
                const payload = {
                    quantity,
                    userReporter: JSON.stringify(userLogged?.data),
                    clientId: selectedClient?.id,
                };

                const url = endpoints.rewardPoints.create.storeProductSelectionCart.item(selectedReward?.id);

                const promise = axiosInstanceBackend.post(url, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                toast.promise(promise, {
                    loading: 'Cart order is being processed...',
                    success: `Store product added to cart successfully!`,
                    error: `Store product add to cart error!`,
                });

                await promise;

                setLoading(false);

                handleReset();

                openAddCart.onFalse();

            } catch (err) {
                console.error('Error adding product to cart:', err);
            }
        }
    }, [selectedClient, selectedReward, quantity, userLogged?.data, openAddCart]);

    const renderQuantity = (
        <Stack direction="row">
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Quantity
            </Typography>

            <Stack spacing={1} sx={{ minWidth: 100, alignItems: 'flex-end' }}>
                <IncrementerButton
                    name="quantity"
                    quantity={quantity}
                    disabledDecrease={quantity < 1}
                    disabledIncrease={false}
                    onIncrease={() => setQuantity(quantity + 1)}
                    onDecrease={() => setQuantity(quantity - 1)}
                />

            </Stack>
        </Stack>
    );

    const renderContent = (
        <Box sx={{ mt: 1, mb: 2, gap: 2, display: 'flex', flexDirection: 'column' }}>
            <Autocomplete
                disablePortal={false}
                slotProps={{
                    popper: { container: typeof document !== 'undefined' ? document.body : undefined }
                }}
                options={loadedClients?.filter((client) => client.totalAvailablePoints > 0) || []}
                value={selectedClient}
                onChange={(_, value) => {
                    setSelectedClient(value);
                    setQuantity(0);
                }}
                getOptionLabel={(o) => `${o.firstName} ${o.lastName} (${o.username})`}
                renderOption={(props, option) => {
                    const { key, ...liProps } = props;
                    return (
                        <ListItem key={key} {...liProps} component="li">
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                                <Label color="success" sx={{ alignItems: 'center' }}>
                                    <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                                    {option?.totalAvailablePoints || 0}
                                </Label>
                                <Box sx={{ fontWeight: 500 }}>
                                    {option.firstName} {option.lastName}
                                </Box>
                                <Box sx={{ color: 'text.disabled', fontSize: 13 }}>
                                    {option.username}
                                </Box>
                            </Box>
                        </ListItem>
                    );
                }}
                renderInput={(params) => {
                    const { InputProps, ...rest } = params;
                    return (
                        <TextField
                            {...rest}
                            label="Client"
                            InputProps={{
                                ...InputProps,
                                sx: {
                                    '& input': { display: selectedClient ? 'none' : 'block' },
                                },
                                startAdornment: selectedClient ? (
                                    <Chip
                                        sx={{ mr: 1, maxWidth: '100%' }}
                                        variant="outlined"
                                        onDelete={() => handleResetClient()}
                                        label={
                                            <Box sx={{ display: 'flex', flexDirection: 'row', textAlign: 'left', gap: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                                    {selectedClient.firstName} {selectedClient.lastName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                                    Username: {selectedClient.username} • Pts: {selectedClient.totalAvailablePoints ?? 0}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                ) : null,
                            }}
                        />
                    );
                }}
                sx={{
                    width: '100%'
                }}
            />
            <Autocomplete
                disablePortal={false}
                slotProps={{
                    popper: { container: typeof document !== 'undefined' ? document.body : undefined }
                }}
                options={loadedStoreProducts}
                value={selectedReward}
                getOptionLabel={(option) => `${option.name} (${option.assignedPoints} points)`}
                onChange={(_, value) => {
                    setSelectedReward(value);
                    setQuantity(0);
                }}
                renderOption={(props, option) => {
                    const { key, ...liProps } = props;
                    return (
                        <ListItem key={key} {...liProps} component="li">
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                                <StoreProductFolderItemCarousel
                                    images={option?.attachments}
                                    maxWidth={45}
                                    maxHeight={45}
                                />
                                <Box sx={{ fontSize: 13 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 300 }}>
                                        {option.name}
                                    </Typography>
                                    <Label color="success" sx={{ alignItems: 'center' }}>
                                        <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                                        {option?.assignedPoints || 0}
                                    </Label>
                                </Box>
                            </Box>
                        </ListItem>
                    );
                }}
                renderInput={(params) => {
                    const { InputProps, ...rest } = params;
                    return (
                        <TextField
                            {...rest}
                            label="Reward"
                            InputProps={{
                                ...InputProps,
                                sx: {
                                    '& input': { display: selectedReward ? 'none' : 'block' },
                                },
                                startAdornment: selectedReward ? (
                                    <Chip
                                        sx={{ mr: 1, maxWidth: '100%' }}
                                        variant="outlined"
                                        onDelete={() => handleResetReward()}
                                        label={
                                            <Box sx={{ display: 'flex', flexDirection: 'row', textAlign: 'left', gap: 1 }}>
                                                <StoreProductFolderItemCarousel
                                                    images={selectedReward?.attachments}
                                                    maxWidth={30}
                                                    maxHeight={30}
                                                />
                                                <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1.2, mt: 1 }}>
                                                    {selectedReward.name} • Pts: {selectedReward.assignedPoints ?? 0}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                ) : null,
                            }}
                        />
                    );
                }}
                sx={{
                    width: '100%'
                }}
            />
            {selectedReward && selectedClient && (
                <Box sx={{ mt: 2, ml: 1 }}>
                    {renderQuantity}
                </Box>
            )}
        </Box>
    );

    return (
        <ConfirmDialog
            maxWidth="sm"
            open={openAddCart.value}
            onClose={!loading ? handleClose : undefined}
            title="Add reward to cart"
            content={renderContent}
            action={
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mr: 2 }}>
                    <LoadingButton
                        type="button"
                        variant="contained"
                        loading={loading}
                        disabled={!isValidForm()}
                        onClick={onAddCart}
                        sx={{
                            cursor: isValidForm() ? 'pointer' : 'not-allowed',
                            bgcolor: 'primary.dark',
                            '&:hover': {
                                bgcolor: 'primary.main',
                            },
                            '&.Mui-disabled': {
                                cursor: 'not-allowed !important',
                                pointerEvents: 'auto',
                                bgcolor: 'transparent !important',
                            }
                        }}
                    >
                        Add to cart
                    </LoadingButton>
                </Box>
            }
        />
    )
};