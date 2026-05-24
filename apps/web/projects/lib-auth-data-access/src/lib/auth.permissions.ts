export type Permission =
  | 'VIEW_ADMIN_DASHBOARD'
  | 'MANAGE_USERS'
  | 'MANAGE_INVITES'
  | 'MANAGE_EXERCISES'
  | 'TRACK_TRAINING'
  | 'TRACK_NUTRITION'
  | 'VIEW_PROGRESS';

export type UserRole = 'admin' | 'user';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'VIEW_ADMIN_DASHBOARD',
    'MANAGE_USERS',
    'MANAGE_INVITES',
    'MANAGE_EXERCISES',
    'TRACK_TRAINING',
    'TRACK_NUTRITION',
    'VIEW_PROGRESS',
  ],
  user: ['TRACK_TRAINING', 'TRACK_NUTRITION', 'VIEW_PROGRESS'],
};
