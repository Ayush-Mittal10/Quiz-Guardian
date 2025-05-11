-- Add monitoring_available column to quiz_attempts table
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS monitoring_available BOOLEAN DEFAULT FALSE;

-- Update existing records to have monitoring_available as false
UPDATE quiz_attempts SET monitoring_available = FALSE WHERE monitoring_available IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_monitoring ON quiz_attempts (quiz_id, student_id, monitoring_available); 