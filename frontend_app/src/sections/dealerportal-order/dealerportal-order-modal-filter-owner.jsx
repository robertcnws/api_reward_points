import { Button } from "@mui/material";
import { ConfirmDialog } from "src/components/custom-dialog";
import { DealerportalOrderAutocompleteOwners } from "./component/dealerportal-order-autocomplete-owners";

export function DealerportalOrderModalFilterOwner({
    loadedUsers,
    filters,
    openOwnerFilter,
    setOpenOwnerFilter,
    selectedOwner,
    setSelectedOwner,
    filterFunc,
}) {

    const renderContentOwners = (
        <DealerportalOrderAutocompleteOwners
            loadedUsers={loadedUsers}
            filters={filters}
            selectedOwner={selectedOwner}
            setSelectedOwner={setSelectedOwner}
            filterFunc={filterFunc}
            localStorageKey='dealerportaOrderFilterOwner'
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
                        localStorage.removeItem('dealerportaOrderFilterOwner');
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