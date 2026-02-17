import React, { useCallback, useEffect } from "react";
import { Box, Button, TextField } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { axiosInstanceBackend, endpoints } from "src/utils/axios";
import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from "src/components/custom-dialog";
import { Label } from "src/components/label";
import { DealerportalQuoteAutocompleteOwners } from "./component/dealerportal-quote-autocomplete-owners";

export function DealerportalQuoteModalAddNew({
    loadedUsers,
    openOwnerFilter,
    setOpenOwnerFilter,
    selectedOwner,
    setSelectedOwner,
    filterFunc,
    roleName,
    userLogged,
    refetchQuotes,
}) {

    useEffect(() => {
        if (!openOwnerFilter.value) {
            setSelectedOwner(null);
        }
        else if (roleName === 'client') {
            setSelectedOwner(userLogged?.data || userLogged?.data || null);
        }
        else {
            setSelectedOwner(selectedOwner);
        }
    }, [openOwnerFilter.value, setSelectedOwner, roleName, userLogged, selectedOwner]);

    const renderContentOwners = (
        <DealerportalQuoteAutocompleteOwners
            loadedUsers={loadedUsers}
            selectedOwner={selectedOwner}
            setSelectedOwner={setSelectedOwner}
            filterFunc={filterFunc}
            hasLabel
        />
    );

    const onClose = useCallback(
        () => {
            setSelectedOwner(null);
            openOwnerFilter.onFalse();
        }, [setSelectedOwner, openOwnerFilter]);

    const fullName = `${userLogged?.data?.firstName || userLogged?.data?.first_name} ${userLogged?.data?.lastName || userLogged?.data?.last_name}`;

    const companyName = userLogged?.data?.companyName || userLogged?.data?.company_name;



    const [name, setName] = React.useState('');
    const [markup, setMarkup] = React.useState(0);

    const isValid = name.trim() !== '' && markup > 0 && selectedOwner !== null;

    const clearFields = useCallback(
        () => {
            setName('');
            setMarkup(0);
            setSelectedOwner(null);
        }, [setSelectedOwner, setName, setMarkup]);

    const handleAddQuote = useCallback(
        async () => {
            try {
                await axiosInstanceBackend.post(endpoints.dealerportal.quote.create, {
                    name,
                    markup,
                    ownerId: selectedOwner?.id,
                    userReporter: JSON.stringify(userLogged?.data),
                });
                clearFields();
                toast.success('Quote Create success!');
                onClose();
                refetchQuotes();
            } catch (err) {
                console.error(err);
                toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
            }
        }, [name, markup, selectedOwner, userLogged, clearFields, refetchQuotes, onClose]);

    return (
        <ConfirmDialog
            open={openOwnerFilter.value}
            onClose={onClose}
            title="Add New Quote"
            content={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {roleName === 'client' ? (
                        <Label color="info">Owner: {fullName} (Company: {companyName})</Label>
                    ) : renderContentOwners}
                    <TextField
                        type="text"
                        label="Name"
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={name.trim() === ''}
                        helperText={name.trim() === '' ? 'Name is required' : ''}
                    />
                    <Stack direction="row" spacing={1} alignItems="center">

                        <TextField
                            type="number"
                            label="Markup"
                            variant="outlined"
                            value={markup}
                            onChange={(e) => {
                                const val = e.target.value;
                                setMarkup(val === '' ? 0 : Number(val));
                            }}
                            InputProps={{
                                inputProps: {
                                    step: 1,
                                    min: 0,
                                },
                            }}
                            sx={{ width: 1 }}
                            error={markup <= 0}
                            helperText={markup <= 0 ? 'Markup must be greater than 0' : ''}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0 }}>
                            <IconButton
                                onClick={() => setMarkup((prev) => Math.max(0, prev - 1))}
                            >
                                <RemoveIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => setMarkup((prev) => prev + 1)}
                            >
                                <AddIcon />
                            </IconButton>
                        </Box>
                    </Stack>
                </Box>
            }
            maxWidth="sm"
            action={
                <>
                    <Button
                        variant="contained"
                        onClick={handleAddQuote}
                        color='primary'
                        disabled={!isValid}
                        sx={{
                            cursor: (!isValid) ? 'not-allowed' : 'pointer',
                            '&.Mui-disabled': {
                                cursor: 'not-allowed !important',
                                pointerEvents: 'auto',
                            }
                        }}
                    >
                        Create
                    </Button>
                    <Button
                        variant="contained"
                        onClick={clearFields}
                        color='warning'
                    >
                        Clear
                    </Button>
                </>
            }
        />
    )
}