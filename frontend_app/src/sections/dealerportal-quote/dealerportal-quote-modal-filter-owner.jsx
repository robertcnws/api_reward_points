import { Button } from "@mui/material";
import { ConfirmDialog } from "src/components/custom-dialog";
import { DealerportalQuoteAutocompleteOwners } from "./component/dealerportal-quote-autocomplete-owners";

export function DealerportalQuoteModalFilterOwner({
    loadedUsers,
    filters,
    openOwnerFilter,
    setOpenOwnerFilter,
    selectedOwner,
    setSelectedOwner,
    filterFunc,
}) {

    const renderContentOwners = (
        <DealerportalQuoteAutocompleteOwners
            loadedUsers={loadedUsers}
            filters={filters}
            selectedOwner={selectedOwner}
            setSelectedOwner={setSelectedOwner}
            filterFunc={filterFunc}
            localStorageKey='dealerportaQuoteFilterOwner'
        />
    );

    const onClose = () => {
        setSelectedOwner(null);
        openOwnerFilter.onFalse();
    }

    return (
        <ConfirmDialog
            open={openOwnerFilter.value}
            onClose={onClose}
            title="Select Owner"
            content={renderContentOwners}
            maxWidth="sm"
            action={
                <Button
                    variant="contained"
                    onClick={() => {
                        // onCloseClientFilter();
                        filters.setState({ owner: { id: '', name: '' } });
                        localStorage.removeItem('dealerportaQuoteFilterOwner');
                        setSelectedOwner(null);
                    }}
                    color='warning'
                >
                    Clear
                </Button>
            }
        />
    )
}