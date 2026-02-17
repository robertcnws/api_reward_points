import { Iconify } from "src/components/iconify";
import { Label } from "src/components/label";
import { fNumber } from "src/utils/format-number";

export function ShowRewardPointsLabel({ totalAvailablePoints }) {

    if (totalAvailablePoints > 0) {
        return (
            <Label color="success" sx={{ alignItems: 'center' }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {fNumber(totalAvailablePoints || 0)}
            </Label>
        );
    }
    return <Label color="error">0</Label>;
}