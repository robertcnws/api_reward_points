export const fieldsRewardStoreProducts = [
    'assignedPoints',
    'createdTime',
    'description',
    'id',
    'lastModifiedTime',
    'name',
    {
        name: 'attachments',
        fields: [
            'id',
            'file',
            'description',
            'name',
            {
                name: 'userUpload',
                fields: [
                    'id',
                    'email',
                    'firstName',
                    'lastName',
                    'username'
                ]
            }
        ]
    }
];