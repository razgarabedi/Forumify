export type PermissionKey =
  | 'view_forum'
  | 'start_discussions'
  | 'reply_to_discussions'
  | 'pin_topics'
  | 'edit_posts'
  | 'like_posts'
  // Moderation
  | 'edit_discussions'
  | 'delete_posts'
  | 'hide_posts'
  | 'restore_posts'
  | 'suspend_users';

export const globalPermissions: PermissionKey[] = [
  'view_forum',
  'start_discussions',
  'reply_to_discussions',
  'pin_topics',
  'edit_posts',
  'like_posts',
];

export const moderationPermissions: PermissionKey[] = [
  'edit_discussions',
  'delete_posts',
  'hide_posts',
  'restore_posts',
  'suspend_users',
];

export const allPermissions: PermissionKey[] = [
  ...globalPermissions,
  ...moderationPermissions,
];

export type PermissionScopeType = 'global' | 'category' | 'tag';

export interface Group {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt: Date;
}

export interface GroupPermission {
  groupId: string;
  permission: PermissionKey;
  allowed: boolean;
  scopeType: PermissionScopeType; // 'global' for grid; 'category' or 'tag' when scoped
  scopeId?: string | null; // UUID for category; tag id/slug when tags are enabled
}


