export const fieldsRewardItems = [
    'id',
    'itemId',
    'name',
    'sku',
    'groupId',
    'groupName',
    'dealerportalImage',
    'createdTime',
    'lastModifiedTime',
    'actualAvailableStock',
    'availableStock',
    'description',
    'itemType',
    'rate',
    'stockOnHand',
    'zohoOrgId'
]


export const fieldsRewardItemGroups = [
    'id',
    'groupId',
    'groupName',
    'createdTime',
    'lastModifiedTime',
    'description',
    'manufacturer',
    'zohoOrgId',
    {
        name: 'listItems',
        fields: fieldsRewardItems
    }
]