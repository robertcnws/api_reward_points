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

import { DealerportalOrderInfoCard } from "../dealerportal-order-info-card";
import { DealerportalOrderInfoProductsTable } from "../dealerportal-order-info-products-table";

export function DealerportalOrderDetailsView({
    order,
    loading,
    error,
    refetch,
    roleName,
}) {

    useEffect(() => {
        if (!order) {
            refetch();
        }
    }, [order, refetch]);

    const router = useRouter();

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const handleCloseDetails = useCallback(() => {
        router.push(paths.dashboard.order.root);
    }, [router]);


    const currentColor = useMemo(() => {
        if (!order) return 'default';
        switch (order?.status?.toLowerCase()) {
            case 'draft':
                return 'default';
            case 'pending':
                return 'info';
            case 'accepted':
                return 'success';
            case 'paid':
                return 'secondary';
            case 'ready to pickup':
                return 'error';
            case 'cancelled':
                return 'warning';
            case 'completed':
                return 'primary';
            default:
                return 'default';
        }
    }, [order]);

    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const openConfirmDelete = useBoolean();

    const openConfirmAccept = useBoolean();

    const openConfirmDecline = useBoolean();

    const openConfirmPending = useBoolean();


    const handleManageStatusOrder = useCallback(
        async (status, action) => {
            try {
                await axiosInstanceBackend.post(endpoints.dealerportal.order.manageStatus(order?.id), {
                    userReporter: JSON.stringify(userLogged?.data),
                    status,
                });
                // router.push(paths.dashboard.order.root);
                refetch();
                toast.success(`Order ${action} successfully`);
            } catch (err) {
                console.error(err);
            }
        }, [order?.id, userLogged, refetch]);


    const handleDeleteOrder = useCallback(
        async () => {
            try {
                await axiosInstanceBackend.delete(endpoints.dealerportal.order.delete(order?.id), {
                    data: {
                        userReporter: JSON.stringify(userLogged?.data),
                    }
                });
                router.push(paths.dashboard.order.root);
            } catch (err) {
                console.error(err);
            }
        }, [order?.id, userLogged, router]);


    const handlePrint = useCallback(
        async (route) => {
            try {
                const response = await axiosInstanceBackend.get(route(order?.quote?.id));
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } catch (err) {
                console.error(err);
            }
        }, [order?.quote?.id]);

    const popoverPrint = usePopover();


    if (error) {
        return (
            <DashboardContent>
                <Box display="flex" alignItems="center" mb={5}>
                    <Alert severity="error" sx={{ borderRadius: 0 }}>
                        <Typography>Error fetching order details: {error.message}</Typography>
                    </Alert>
                </Box>
            </DashboardContent>
        );
    }

    if (loading || !order) {
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
                        Loading order details...
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

    const customDialogToStatus = (status, action, buttonColor, open) => (
        <ConfirmDialog
            open={open.value}
            onClose={open.onFalse}
            title={`${action.charAt(0).toUpperCase() + action.slice(1)} Order`}
            content={
                <Typography>
                    Are you sure you want to {action} this order?
                </Typography>
            }
            action={
                <Button
                    variant="contained"
                    color={buttonColor}
                    onClick={
                        async () => {
                            await handleManageStatusOrder(status, action);
                            open.onFalse();
                        }
                    }
                >
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                </Button>
            }
        />
    )

    return (
        <>
            <DashboardContent>
                <CustomBreadcrumbs
                    // heading="List"
                    links={[
                        { name: 'Dashboard', href: paths.dashboard.general.analytics },
                        { name: 'Order List', href: paths.dashboard.order.root },
                        { name: 'Order Details' },
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
                                    title="Print Order"
                                    arrow
                                >
                                    <IconButton
                                        onClick={popoverPrint.onOpen}
                                        sx={{
                                            cursor: 'pointer'
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
                                </Tooltip>

                                {(order?.status?.toLowerCase() === 'pending' && roleName !== 'client') && (
                                    <>
                                        <Tooltip title="Accept Order" arrow>
                                            <IconButton onClick={openConfirmAccept.onTrue} color="primary" width={16}>
                                                <Iconify icon="hugeicons:credit-card-accept" width={25} />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Decline Order" arrow>
                                            <IconButton onClick={openConfirmDecline.onTrue} color="error" width={16}>
                                                <Iconify icon="hugeicons:credit-card-not-accept" width={25} />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                                {(order?.status?.toLowerCase() === 'cancelled' && roleName !== 'client') && (
                                    <Tooltip title="Restore to Pending" arrow>
                                        <IconButton onClick={openConfirmPending.onTrue} color="warning" width={16}>
                                            <Iconify icon="material-symbols:restore-page-outline-sharp" width={25} />
                                        </IconButton>
                                    </Tooltip>
                                )}

                                {(order?.status?.toLowerCase() !== 'accepted') && (

                                    <Tooltip title="Delete quote" arrow>
                                        <IconButton color="error" onClick={openConfirmDelete.onTrue}>
                                            <Iconify icon="icon-park-solid:delete-one" width={23} />
                                        </IconButton>
                                    </Tooltip>

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
                <Box sx={{ mt: !isMobile ? 2 : 1 }}>
                    {/* ========================= MOBILE ========================= */}
                    {isMobile ? (
                        <>
                            {/* Order info siempre visible */}
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
                                        <DealerportalOrderInfoCard
                                            order={order}
                                            currentColor={currentColor}
                                            isMobile={isMobile}
                                        />
                                        <DealerportalOrderInfoProductsTable
                                            order={order}
                                            refetch={refetch}
                                            isMobile={isMobile}
                                        />
                                    </Box>
                                </Box>
                            </Card>
                        </>
                    ) : (
                        /* ========================= DESKTOP ========================= */
                        <Grid container spacing={3}>

                            {/* 60 % */}
                            <Grid item md={12} lg={12}>
                                <Box sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    p: 2,
                                    bgcolor: '#fafafa',
                                    minHeight: 600,
                                }}>
                                    <DealerportalOrderInfoCard
                                        order={order}
                                        currentColor={currentColor}
                                        isMobile={isMobile}
                                    />
                                    <DealerportalOrderInfoProductsTable
                                        order={order}
                                        refetch={refetch}
                                        isMobile={isMobile}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </DashboardContent>
            <ConfirmDialog
                open={openConfirmDelete.value}
                onClose={openConfirmDelete.onFalse}
                title="Delete Order"
                content={
                    <Typography>
                        Are you sure you want to delete this order? This action cannot be undone.
                    </Typography>
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={
                            async () => {
                                await handleDeleteOrder();
                                openConfirmDelete.onFalse();
                            }
                        }
                    >
                        Delete
                    </Button>
                }
            />

            {customDialogToStatus('accepted', 'accept', 'success', openConfirmAccept)}

            {customDialogToStatus('cancelled', 'decline', 'error', openConfirmDecline)}

            {customDialogToStatus('pending', 'restore', 'warning', openConfirmPending)}

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