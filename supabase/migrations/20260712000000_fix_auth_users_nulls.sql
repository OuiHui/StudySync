-- Migration to fix "500: Database error querying schema" on manual seeded auth users.
-- GoTrue (Supabase Auth) throws this error when columns it expects to be strings/empty strings are NULL.
-- This script safely updates any NULL values in GoTrue columns to empty strings.

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE 
  confirmation_token IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL
  OR email_change IS NULL
  OR phone_change IS NULL
  OR reauthentication_token IS NULL
  OR email_change_token_current IS NULL
  OR phone_change_token IS NULL;
