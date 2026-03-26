export const Roles = {
  ADMIN: 'ADMIN',
  COMMAND_STAFF: 'COMMAND_STAFF',
  TRAINING_OFFICER: 'TRAINING_OFFICER',
  TRAINEE: 'TRAINEE'
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
