CREATE DATABASE IF NOT EXISTS mesob_wellness
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE mesob_wellness;

-- Roles
CREATE TABLE roles (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB;

-- Users
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_users_email (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Health Records
CREATE TABLE health_records (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    emergency_contact VARCHAR(150) NULL,
    notes TEXT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_health_records_user_id (user_id),
    CONSTRAINT fk_health_records_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Vitals
CREATE TABLE vitals (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    bp VARCHAR(20) NULL,
    heart_rate INT NULL,
    weight FLOAT NULL,
    height FLOAT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_vitals_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Appointments
CREATE TABLE appointments (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    token_number INT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_appointments_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Wellness Plans
CREATE TABLE wellness_plans (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_wellness_plans_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Feedback
CREATE TABLE feedback (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Requested indexes
CREATE INDEX idx_vitals_user_id ON vitals(user_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
