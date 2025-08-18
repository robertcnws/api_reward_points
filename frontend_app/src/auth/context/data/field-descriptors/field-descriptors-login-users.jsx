export const fieldsLoginUsers = [
  'avatarUrl',
  'companyName',
  'createdTime',
  'dateJoined',
  'email',
  'firstName',
  'id',
  'isActive',
  'isStaff',
  'isVerified',
  'isApproved',
  'lastLogin',
  'lastModifiedTime',
  'lastName',
  'phoneNumber',
  'username',
  'approvedTime',
  'showTourGuideModal',
  'disapprovalCount',
  {
    name: 'userRole',
    fields: ['id', 'name'],
  },
];

export const fieldsExternalUsers = [
  'id',
  'createdTime',
  'lastModifiedTime',
  'lastLogin',
  'isLoggedIn',
  {
    name: 'user',
    fields: fieldsLoginUsers,
  },
];