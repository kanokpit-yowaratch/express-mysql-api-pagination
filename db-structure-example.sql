CREATE TABLE `users` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`username` VARCHAR(100) NOT NULL COLLATE 'utf8mb3_unicode_ci',
	`email` VARCHAR(200) NOT NULL COLLATE 'utf8mb3_unicode_ci',
	`first_name` VARCHAR(200) NULL DEFAULT NULL COLLATE 'utf8mb3_unicode_ci',
	`last_name` VARCHAR(200) NULL DEFAULT NULL COLLATE 'utf8mb3_unicode_ci',
	`avatar_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb3_unicode_ci',
	`password` VARCHAR(255) NOT NULL COLLATE 'utf8mb3_unicode_ci',
	`user_status` ENUM('0','1','2') NOT NULL DEFAULT '1' COLLATE 'utf8mb3_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE
)
COLLATE='utf8mb3_unicode_ci'
ENGINE=InnoDB;