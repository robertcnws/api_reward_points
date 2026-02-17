import { fieldsLoginUsers } from "./field-descriptors-login-users";
import { fieldsRewardItems } from "./field-descriptors-reward-itemgroups";

export const fieldsDealerportalQuoteProducts = [
    'id',
    'quantity',
    'createdAt',
    'updatedAt',
    {
        name: 'product',
        fields: fieldsRewardItems
    }
]

export const fieldsDealerportalQuotes = [
    'id',
    'name',
    'number',
    'markup',
    'notes',
    'totalSell',
    'totalCost',
    'markupTotal',
    'status',
    'createdAt',
    'updatedAt',
    'isEmpty',
    'isProductInStock',
    // 'calculatePrice',
    {
        name: 'owner',
        fields: fieldsLoginUsers
    },
    {
        name: 'createdBy',
        fields: fieldsLoginUsers
    },
    {
        name: 'getProducts',
        fields: fieldsDealerportalQuoteProducts
    }
]