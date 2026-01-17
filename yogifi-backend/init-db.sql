-- Initialize PostgreSQL database for Yogifi
-- This script runs when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE yogifi_db TO postgres;

-- Note: JPA/Hibernate will create tables automatically based on entities
-- This file is for any additional database setup needed
