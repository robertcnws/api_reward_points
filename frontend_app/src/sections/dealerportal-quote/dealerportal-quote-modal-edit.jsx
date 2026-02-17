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

export function DealerportalQuoteModalEdit({
    openEditQuote,
    userLogged,
    quote,
    refetch,
}) {

    const onClose = useCallback(
        () => {
            openEditQuote.onFalse();
        }, [openEditQuote]);

    const [name, setName] = React.useState(quote?.name || '');
    const [markup, setMarkup] = React.useState(quote?.markup || 0);

    const isValid = name.trim() !== '' && markup > 0;

    const clearFields = useCallback(
        () => {
            setName('');
            setMarkup(0);
        }, [setName, setMarkup]);

    const handleEditQuote = useCallback(
        async () => {
            try {
                await axiosInstanceBackend.post(endpoints.dealerportal.quote.edit(quote?.id), {
                    name,
                    markup,
                    userReporter: JSON.stringify(userLogged?.data),
                });
                refetch();
                toast.success('Quote edited successfully');
            } catch (err) {
                console.error(err);
                toast.error('Failed to edit quote');
            }
        }, [quote?.id, userLogged, name, markup, refetch]);

    return (
        <ConfirmDialog
            open={openEditQuote.value}
            onClose={onClose}
            title="Edit Quote"
            content={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        type="text"
                        label="Name"
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={name.trim() === ''}
                        helperText={name.trim() === '' ? 'Name is required' : ''}
                    />
                    <Stack direction="row" spacing={2} alignItems="center">

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
                        onClick={
                            async() => {
                                await handleEditQuote();
                                onClose();
                            }
                        }
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
                        Edit
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