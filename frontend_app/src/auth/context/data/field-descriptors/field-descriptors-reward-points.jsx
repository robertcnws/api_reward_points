export const fieldsRewardPoints = [
    'id',
    'createdTime',
    'totalSpentPoints',
    'totalGainedPoints',
    'totalAmountInvoices',
    {
      name: 'invoices',
      fields: [
        'date',
        'invoiceNumber',
        'invoiceId',
        'paymentMade',
        {
          name: 'lineItems',
          fields: ['quantity', 'name', 'rate', 'sku', 'itemTotal'],
        },
        {
          name: 'taxes',
          fields: ['taxName', 'taxAmount'],
        },
      ],
    },
    {
      name: 'user',
      fields: ['id', 'companyName', 'firstName', 'email', 'lastName', 'phoneNumber'],
    },
  ];

  export const fieldsRewardPointsHistory = [
    'id',
    'action',
    'createdTime',
    'description',
    'gainedPoints',
    'spentPoints',
    'info',
    {
      name: 'rewardPoints',
      fields: ['id'],
    },
  ];