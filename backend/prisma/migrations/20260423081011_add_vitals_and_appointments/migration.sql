-- CreateTable
CREATE TABLE `vital_records` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `recordedBy` VARCHAR(191) NOT NULL,
    `weightKg` DOUBLE NULL,
    `heightCm` DOUBLE NULL,
    `bmi` DOUBLE NULL,
    `bmiCategory` ENUM('UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESITY') NULL,
    `systolic` INTEGER NULL,
    `diastolic` INTEGER NULL,
    `bpCategory` ENUM('NORMAL', 'ELEVATED', 'HYPERTENSION_STAGE_1', 'HYPERTENSION_STAGE_2', 'HYPERTENSIVE_CRISIS') NULL,
    `heartRate` INTEGER NULL,
    `temperature` DOUBLE NULL,
    `oxygenSaturation` INTEGER NULL,
    `notes` TEXT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vital_records_userId_idx`(`userId`),
    INDEX `vital_records_recordedBy_idx`(`recordedBy`),
    INDEX `vital_records_recordedAt_idx`(`recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `diagnosis` TEXT NULL,
    `prescription` TEXT NULL,
    `confirmedAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancellationReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `appointments_userId_idx`(`userId`),
    INDEX `appointments_scheduledAt_idx`(`scheduledAt`),
    INDEX `appointments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vital_records` ADD CONSTRAINT `vital_records_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vital_records` ADD CONSTRAINT `vital_records_recordedBy_fkey` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
