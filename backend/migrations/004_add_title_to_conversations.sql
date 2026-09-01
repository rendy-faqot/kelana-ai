-- Migration: 004_add_title_to_conversations
-- Adds a user-editable title to conversations

ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS title VARCHAR(100);
