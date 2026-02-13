/**
 * Development configuration
 * These values are only used during development until authentication is implemented
 */

export const DEV_CONFIG = {
  /**
   * Development user ID - easy to identify with all zeros
   * This UUID corresponds to the dev user created in Supabase
   * See: supabase/create_dev_user.sql
   */
  DEV_USER_ID: "00000000-0000-0000-0000-000000000000",

  /**
   * Development user email
   */
  DEV_USER_EMAIL: "dev@budgetbuddy.local",
} as const;

