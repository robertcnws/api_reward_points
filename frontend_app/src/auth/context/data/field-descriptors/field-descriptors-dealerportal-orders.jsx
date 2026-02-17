import { fieldsLoginUsers } from "./field-descriptors-login-users";
import { fieldsDealerportalQuotes } from "./field-descriptors-dealerportal-quotes";

export const fieldsDealerportalOrders = [
    'id',
    'number',
    'createdAt',
    'updatedAt',
    'status',
    {
        name: 'owner',
        fields: fieldsLoginUsers
    },
    {
        name: 'createdBy',
        fields: fieldsLoginUsers
    },
    {
        name: 'quote',
        fields: fieldsDealerportalQuotes
    }
]