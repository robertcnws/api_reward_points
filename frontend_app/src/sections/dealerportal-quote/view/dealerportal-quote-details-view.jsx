import { Box, Card, IconButton, Tooltip, Typography, Grid, Drawer, useMediaQuery, Button, Stack, Alert, LinearProgress, MenuItem, MenuList } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSetState } from "src/hooks/use-set-state";
import { useRouter } from "src/routes/hooks";
import { useBoolean } from "src/hooks/use-boolean";
import { axiosInstanceBackend, endpoints } from "src/utils/axios";
import { useDataContext } from "src/auth/context/data/data-context";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { Iconify } from "src/components/iconify";
import { DashboardContent } from "src/layouts/dashboard";
import { paths } from "src/routes/paths";
import { Label } from "src/components/label";
import { ConfirmDialog } from "src/components/custom-dialog";
import { toast } from 'src/components/snackbar';
import { CustomPopover, usePopover } from "src/components/custom-popover";

import {
    itemClasses,
    itemColors,
    itemSeries,
    itemTypes,
} from 'src/sections/itemgroups/view/itemgroup-table-view';

import { DealerportalItemgroupGroupView } from "./dealerportal-itemgroup-group-view";
import { DealerportalItemgroupTableFilters } from "../dealerportal-itemgroup-table-filters";
import { DealerportalQuoteInfoCard } from "../dealerportal-quote-info-card";
import { DealerportalQuoteInfoProductsTable } from "../dealerportal-quote-info-products-table";
import { DealerportalQuoteModalEdit } from "../dealerportal-quote-modal-edit";



export function DealerportalQuoteDetailsView({
    quote,
    loading,
    error,
    refetch,
    roleName,
}) {

    useEffect(() => {
        if (!quote) {
            refetch();
        }
    }, [quote, refetch]);

    const router = useRouter();

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const handleCloseDetails = useCallback(() => {
        router.push(paths.dashboard.quote.root);
    }, [router]);

    const {
        loadedItemgroups,
        refetchItemgroups,
        loadingItemgroups,
    } = useDataContext();

    const currentItemgroups = useMemo(() => {
        const selectedIds = new Set(
            (quote?.getProducts ?? [])
                .map((qp) => qp?.product?.id)
                .filter(Boolean)
        );

        return (loadedItemgroups ?? []).map((group) => ({
            ...group,
            listItems: (group.listItems ?? []).filter((it) => !selectedIds.has(it.id)),
        }));
    }, [loadedItemgroups, quote?.getProducts]);


    const currentColor = useMemo(() => {
        if (!quote) return 'default';
        switch (quote?.status?.toLowerCase()) {
            case 'draft':
                return 'default';
            case 'active':
                return 'success';
            case 'inactive':
                return 'error';
            case 'ordered':
                return 'warning';
            default:
                return 'default';
        }
    }, [quote]);

    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [openDrawer, setOpenDrawer] = useState(false);

    const hasProducts = useMemo(() => quote?.getProducts?.length > 0, [quote?.getProducts]);

    const openEditQuote = useBoolean();

    const openConfirmDelete = useBoolean();

    const isOrdered = useMemo(() => quote?.status?.toLowerCase() === 'ordered', [quote]);

    const filters = useSetState({
        name: '',
        // option: 'allItems',
        type: [],
        color: [],
        series: [],
        class: [],
        configuration: [],
    });

    const options = useSetState({
        types: itemTypes,
        colors: itemColors,
        series: itemSeries,
        classes: itemClasses,
        configurations: [],
        // configurations: itemConfigurations,
    });

    const handleManageProduct = useCallback(
        async (productId, action, quantity) => {
            try {
                await axiosInstanceBackend.post(endpoints.dealerportal.quote.manageProduct(quote?.id), {
                    productId,
                    action,
                    quantity,
                    userReporter: JSON.stringify(userLogged?.data),
                });
                refetch();
                toast.success(`Product ${action === 'add' ? 'added to' : action === 'update' ? 'updated in' : 'removed from'} quote successfully!`);
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.error || `Error ${action === 'add' ? 'adding product to' : action === 'update' ? 'updating product in' : 'removing product from'} quote`);
            }
        }, [quote?.id, userLogged, refetch]);


    const handleManageAllProducts = useCallback(
        async (action) => {
            try {
                await axiosInstanceBackend.post(endpoints.dealerportal.quote.manageAllProducts(quote?.id), {
                    action,
                    userReporter: JSON.stringify(userLogged?.data),
                });
                refetch();
                toast.success(`Products ${action === 'add' ? 'added to' : action === 'remove' ? 'removed from' : 'updated in'} quote successfully!`);
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.error || `Error ${action === 'add' ? 'adding products to' : action === 'remove' ? 'removing products from' : 'updating products in'} quote`);
            }
        }, [quote?.id, userLogged, refetch]);


    const handleCloneQuote = useCallback(
        async () => {
            try {
                await axiosInstanceBackend.post(endpoints.dealerportal.quote.clone(quote?.id), {
                    userReporter: JSON.stringify(userLogged?.data),
                });
                router.push(paths.dashboard.quote.root);
            } catch (err) {
                console.error(err);
            }
        }, [quote?.id, userLogged, router]);


    const handleDeleteQuote = useCallback(
        async () => {
            try {
                await axiosInstanceBackend.delete(endpoints.dealerportal.quote.delete(quote?.id), {
                    data: {
                        userReporter: JSON.stringify(userLogged?.data),
                    }
                });
                router.push(paths.dashboard.quote.root);
            } catch (err) {
                console.error(err);
            }
        }, [quote?.id, userLogged, router]);


    const handlePrint = useCallback(
        async (route) => {
            try {
                const response = await axiosInstanceBackend.get(route(quote?.id));
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } catch (err) {
                console.error(err);
            }
        }, [quote?.id]);


    const handlePlaceOrderQuote = useCallback(
        async () => {
            try {
                await axiosInstanceBackend.post(endpoints.dealerportal.quote.placeOrder(quote?.id), {
                    userReporter: JSON.stringify(userLogged?.data),
                });
                router.push(paths.dashboard.quote.root);
            } catch (err) {
                console.error(err);
            }
        }, [quote?.id, userLogged, router]);


    const ItemgroupsFilters = (
        <Stack
            spacing={2.5}
            sx={{ my: { xs: 3, md: 3 } }}
            display='flex'
            flexDirection='row'
            alignItems='center'
            justifyContent='flex-start'
        >

            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                width: '100%'
            }}>
                <Box sx={{ mt: 2, width: '100%', display: 'flex', flexDirection: 'row' }}>
                    <DealerportalItemgroupTableFilters
                        filters={filters}
                        options={options}
                    />
                </Box>
                {/* </Box> */}
            </Box>


        </Stack>
    )

    const ItemgroupsView = (
        <DealerportalItemgroupGroupView
            loadedItemgroups={currentItemgroups}
            refetchItemgroups={refetchItemgroups}
            loadingItemgroups={loadingItemgroups}
            filters={filters}
            options={options}
            onManageProduct={handleManageProduct}
        />
    );

    const popoverPrint = usePopover();


    if (error) {
        return (
            <DashboardContent>
                <Box display="flex" alignItems="center" mb={5}>
                    <Alert severity="error" sx={{ borderRadius: 0 }}>
                        <Typography>Error fetching quote details: {error.message}</Typography>
                    </Alert>
                </Box>
            </DashboardContent>
        );
    }

    if (loading || !quote) {
        return (
            <DashboardContent>
                <Box
                    sx={{
                        width: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '80vh',
                        margin: 'auto'
                    }}
                >
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Loading quote details...
                    </Typography>
                    <LinearProgress
                        key="error"
                        sx={{
                            mb: 2,
                            width: '100%',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: 'black',
                            },
                            backgroundColor: '#e0e0e0',
                        }}
                    />
                </Box>
            </DashboardContent>
        );
    }

    return (
        <>
            <DashboardContent>
                <CustomBreadcrumbs
                    // heading="List"
                    links={[
                        { name: 'Dashboard', href: paths.dashboard.general.analytics },
                        { name: 'Quote List', href: paths.dashboard.quote.root },
                        { name: 'Quote Details' },
                    ]}
                    action={
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 1,
                                flexWrap: { xs: 'wrap', md: 'nowrap' },   // 👈 clave
                            }}
                        >
                            {/* Botones principales */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    justifyContent: 'flex-end',
                                    flexWrap: { xs: 'wrap', md: 'nowrap' }, 
                                    width: { xs: '100%', md: 'auto' },
                                }}
                            >
                                <Tooltip
                                    title={quote?.getProducts?.length === 0 ? "Cannot print now. Add products below" : "Print Quote"}
                                    arrow
                                >
                                    <span>
                                        <IconButton
                                            onClick={popoverPrint.onOpen}
                                            disabled={
                                                (quote?.getProducts?.length || 0) === 0
                                            }
                                            sx={{
                                                cursor: (
                                                    (quote?.getProducts?.length || 0) === 0
                                                ) ? 'not-allowed' : 'pointer',
                                                '&.Mui-disabled': {
                                                    cursor: 'not-allowed !important',
                                                    pointerEvents: 'auto',
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexDirection: 'row' }}>
                                                <Iconify icon="entypo:print" width={23} />
                                                <Iconify
                                                    icon={popoverPrint.open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                                                    width={20}
                                                />
                                            </Box>
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                {!isOrdered && (

                                    <Tooltip title="Edit quote" arrow>
                                        <IconButton onClick={openEditQuote.onTrue}>
                                            <Iconify icon="bx:edit" width={25} />
                                        </IconButton>
                                    </Tooltip>

                                )}

                                <Tooltip title="Clone quote" arrow>
                                    <IconButton onClick={handleCloneQuote}>
                                        <Iconify icon="fa6-solid:clone" />
                                    </IconButton>
                                </Tooltip>

                                {!isOrdered && (
                                    <>
                                        <Tooltip
                                            title={quote?.getProducts?.length === 0 ? "Cannot place order now. Add products below" : "Place Order"}
                                            arrow
                                        >
                                            <span>
                                                <IconButton
                                                    color="primary"
                                                    disabled={
                                                        isOrdered ||
                                                        (quote?.getProducts?.length || 0) === 0
                                                    }
                                                    sx={{
                                                        cursor: (
                                                            isOrdered ||
                                                            (quote?.getProducts?.length || 0) === 0
                                                        ) ? 'not-allowed' : 'pointer',
                                                        '&.Mui-disabled': {
                                                            cursor: 'not-allowed !important',
                                                            pointerEvents: 'auto',
                                                        }
                                                    }}
                                                    onClick={handlePlaceOrderQuote}
                                                >
                                                    <Iconify icon="bx:cart-add" width={28} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Delete quote" arrow>
                                            <IconButton color="error" onClick={openConfirmDelete.onTrue}>
                                                <Iconify icon="icon-park-solid:delete-one" width={23} />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                            </Box>

                            {/* Botón cerrar */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: { xs: 'flex-end', md: 'center' },
                                    width: { xs: '100%', md: 'auto' }, // 👈 fuerza segunda fila en mobile
                                }}
                            >
                                <Tooltip title="Close" arrow>
                                    <IconButton onClick={handleCloseDetails} color="default">
                                        <Iconify icon="streamline:delete-1-solid" width={16} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                    }
                    sx={{ mb: { xs: 0, md: 0 }, p: 0, gap: 0 }}
                />
                <Box sx={{ mt: !isOrdered ? (!isMobile ? -3 : 1) : 3 }}>
                    {(!isOrdered && !isMobile) && ItemgroupsFilters}
                    {/* ========================= MOBILE ========================= */}
                    {isMobile ? (
                        <>
                            {/* Si tiene productos → botón */}
                            {(hasProducts && !isOrdered) ? (
                                <>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => setOpenDrawer(true)}
                                    >
                                        Select Products
                                    </Button>

                                    <Drawer
                                        anchor="bottom"
                                        open={openDrawer}
                                        onClose={() => setOpenDrawer(false)}
                                        PaperProps={{
                                            sx: { height: '90vh', p: 1 }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: -5, p: 2 }}>
                                            <IconButton onClick={() => setOpenDrawer(false)}>
                                                <Iconify icon="streamline:delete-1-solid" width={16} />
                                            </IconButton>
                                        </Box>
                                        {ItemgroupsFilters}
                                        {ItemgroupsView}
                                    </Drawer>
                                </>
                            ) : !isOrdered && (
                                <Box sx={{ mb: 0, mt: -5, height: 'auto', p: 1 }}>
                                    {ItemgroupsFilters}
                                    {ItemgroupsView}
                                </Box>
                            )}

                            {/* Quote info siempre visible */}
                            <Card sx={{ mt: 0, p: 1 }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        minHeight: 120,
                                    }}
                                >
                                    <Box sx={{
                                        display: 'flex',
                                        // alignItems: 'center', 
                                        gap: 1,
                                        flexDirection: 'column'
                                    }}>
                                        <DealerportalQuoteInfoCard
                                            quote={quote}
                                            currentColor={currentColor}
                                            isOrdered={isOrdered}
                                            isMobile={isMobile}
                                        />
                                        <DealerportalQuoteInfoProductsTable
                                            quote={quote}
                                            refetch={refetch}
                                            onManageProduct={handleManageProduct}
                                            onManageAllProducts={handleManageAllProducts}
                                            isOrdered={isOrdered}
                                            isMobile={isMobile}
                                        />
                                    </Box>
                                </Box>
                            </Card>
                        </>
                    ) : (
                        /* ========================= DESKTOP ========================= */
                        <Grid container spacing={3}>
                            {/* 40 % */}
                            {!isOrdered && (
                                <Grid item md={5} lg={4}>
                                    {ItemgroupsView}
                                </Grid>
                            )}

                            {/* 60 % */}
                            <Grid item md={isOrdered ? 12 : 7} lg={isOrdered ? 12 : 8}>
                                <Box sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    p: 2,
                                    bgcolor: '#fafafa',
                                    minHeight: 600,
                                }}>
                                    <DealerportalQuoteInfoCard
                                        quote={quote}
                                        currentColor={currentColor}
                                        isOrdered={isOrdered}
                                        isMobile={isMobile}
                                    />
                                    <DealerportalQuoteInfoProductsTable
                                        quote={quote}
                                        refetch={refetch}
                                        onManageProduct={handleManageProduct}
                                        onManageAllProducts={handleManageAllProducts}
                                        isOrdered={isOrdered}
                                        isMobile={isMobile}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </DashboardContent>
            <DealerportalQuoteModalEdit
                openEditQuote={openEditQuote}
                userLogged={userLogged}
                quote={quote}
                refetch={refetch}
            />
            <ConfirmDialog
                open={openConfirmDelete.value}
                onClose={openConfirmDelete.onFalse}
                title="Delete Quote"
                content={
                    <Typography>
                        Are you sure you want to delete this quote? This action cannot be undone.
                    </Typography>
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={
                            async () => {
                                await handleDeleteQuote();
                                openConfirmDelete.onFalse();
                            }
                        }
                    >
                        Delete
                    </Button>
                }
            />
            <CustomPopover
                open={popoverPrint.open}
                anchorEl={popoverPrint.anchorEl}
                onClose={popoverPrint.onClose}
                slotProps={{ arrow: { placement: 'center-bottom' } }}
            >
                <MenuList>
                    <MenuItem
                        onClick={async () => {
                            popoverPrint.onClose();
                            await handlePrint(endpoints.dealerportal.quote.renderPdf);
                        }}
                    >
                        <Iconify icon="fluent:print-24-filled" />
                        Print Sell
                    </MenuItem>
                    <MenuItem
                        onClick={async () => {
                            popoverPrint.onClose();
                            await handlePrint(endpoints.dealerportal.quote.renderPdfCost);
                        }}
                    >
                        <Iconify icon="fluent:print-24-regular" />
                        Print Cost
                    </MenuItem>
                    <MenuItem
                        onClick={async () => {
                            popoverPrint.onClose();
                            await handlePrint(endpoints.dealerportal.quote.renderPdfTotal);
                        }}
                    >
                        <Iconify icon="gridicons:print" />
                        Print Total
                    </MenuItem>
                </MenuList>
            </CustomPopover>
        </>
    )
}