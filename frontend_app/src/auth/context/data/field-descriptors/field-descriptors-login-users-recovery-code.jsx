import { fieldsLoginUsers } from "./field-descriptors-login-users";

export const fieldsUserRecoveryCode = [
  'code',
  'createdAt',
  'id',
  'expiresAt',
  'isExpired',
  {
    name: 'user',
    fields: fieldsLoginUsers
  }
];