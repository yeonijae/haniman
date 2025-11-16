-- Add consultation_room column to medical_staff table
-- Migration: add_consultation_room_to_medical_staff
-- Date: 2025-01-17

ALTER TABLE medical_staff
ADD COLUMN IF NOT EXISTS consultation_room VARCHAR(20);

-- Add comment
COMMENT ON COLUMN medical_staff.consultation_room IS '진료실 (1진료실, 2진료실, 3진료실, 4진료실)';
