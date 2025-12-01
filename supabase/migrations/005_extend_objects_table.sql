-- Add new columns to objects table for enhanced functionality
-- These columns support the enhanced objects management modal

-- Add max_hours column (maximum planned hours for the object)
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS max_hours INTEGER DEFAULT 160;

-- Add address column (physical location of the object)
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add manager_id column (responsible manager for the object)
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add start_date column (project start date)
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add end_date column (project end/deadline date)
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add created_at timestamp if not exists
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at timestamp if not exists
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on manager_id for faster queries
CREATE INDEX IF NOT EXISTS idx_objects_manager_id ON objects(manager_id);

-- Create index on dates for faster filtering
CREATE INDEX IF NOT EXISTS idx_objects_dates ON objects(start_date, end_date);

-- Add comment explaining the table structure
COMMENT ON TABLE objects IS 'Stores project objects/sites with metadata including location, timeline, and responsible manager';
COMMENT ON COLUMN objects.max_hours IS 'Maximum planned hours for this object/project';
COMMENT ON COLUMN objects.address IS 'Physical address or location of the object';
COMMENT ON COLUMN objects.manager_id IS 'ID of the manager responsible for this object';
COMMENT ON COLUMN objects.start_date IS 'Project start date';
COMMENT ON COLUMN objects.end_date IS 'Project deadline/completion date';
