-- AlterTable
ALTER TABLE `users` ADD COLUMN `centerId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `centers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    `capacity` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `centers_code_key`(`code`),
    INDEX `centers_region_idx`(`region`),
    INDEX `centers_status_idx`(`status`),
    INDEX `centers_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `users_centerId_idx` ON `users`(`centerId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `centers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
