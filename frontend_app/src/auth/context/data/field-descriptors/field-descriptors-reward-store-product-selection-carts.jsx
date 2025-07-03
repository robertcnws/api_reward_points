import { fieldsRewardStoreProducts } from "./field-descriptors-reward-store-products"

const fieldDesctiptorsRewardStoreProductSelection = [
    'createdTime',
    'id',
    'lastModifiedTime',
    'quantity',
    {
        name: 'storeProduct',
        fields: fieldsRewardStoreProducts
    },
    {
        name: 'user',
        fields: [
            'id',
            'username',
            'firstName',
            'lastName'
        ]
    }
]

export const fieldsRewardStoreProductSelectionCarts = [
    'createdTime',
    'id',
    'isBought',
    'lastModifiedTime',
    {
        name: 'storeProductSelection',
        fields: fieldDesctiptorsRewardStoreProductSelection
    }
]