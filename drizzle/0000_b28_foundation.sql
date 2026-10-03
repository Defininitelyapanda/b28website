CREATE TABLE `content_items` (`id` text PRIMARY KEY NOT NULL,`type` text NOT NULL,`slug` text NOT NULL,`title` text NOT NULL,`status` text DEFAULT 'draft' NOT NULL,`excerpt` text DEFAULT '' NOT NULL,`body` text DEFAULT '' NOT NULL,`cover_image` text,`data` text DEFAULT '{}' NOT NULL,`featured` integer DEFAULT false NOT NULL,`sort_order` integer DEFAULT 0 NOT NULL,`published_at` text,`scheduled_at` text,`created_at` text NOT NULL,`updated_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_items_slug_unique` ON `content_items` (`slug`);
--> statement-breakpoint
CREATE INDEX `idx_content_type_status_published` ON `content_items` (`type`,`status`,`published_at`);
--> statement-breakpoint
CREATE TABLE `content_versions` (`id` text PRIMARY KEY NOT NULL,`content_id` text NOT NULL,`version` integer NOT NULL,`snapshot` text NOT NULL,`author_id` text NOT NULL,`summary` text DEFAULT 'Saved changes' NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_versions_content_version` ON `content_versions` (`content_id`,`version`);
--> statement-breakpoint
CREATE TABLE `users` (`id` text PRIMARY KEY NOT NULL,`email` text NOT NULL,`name` text NOT NULL,`role` text DEFAULT 'editor' NOT NULL,`active` integer DEFAULT true NOT NULL,`created_at` text NOT NULL,`updated_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `media_items` (`id` text PRIMARY KEY NOT NULL,`storage_key` text NOT NULL,`filename` text NOT NULL,`title` text NOT NULL,`description` text DEFAULT '' NOT NULL,`alt_text` text DEFAULT '' NOT NULL,`mime_type` text NOT NULL,`size` integer NOT NULL,`width` integer,`height` integer,`tags` text DEFAULT '[]' NOT NULL,`uploader_id` text NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_items_storage_key_unique` ON `media_items` (`storage_key`);
--> statement-breakpoint
CREATE INDEX `idx_media_created` ON `media_items` (`created_at`);
--> statement-breakpoint
CREATE TABLE `navigation_items` (`id` text PRIMARY KEY NOT NULL,`menu` text DEFAULT 'main' NOT NULL,`label` text NOT NULL,`href` text NOT NULL,`parent_id` text,`sort_order` integer DEFAULT 0 NOT NULL,`external` integer DEFAULT false NOT NULL,`created_at` text NOT NULL,`updated_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `idx_navigation_menu_order` ON `navigation_items` (`menu`,`sort_order`);
--> statement-breakpoint
CREATE TABLE `contacts` (`id` text PRIMARY KEY NOT NULL,`name` text NOT NULL,`email` text NOT NULL,`phone` text DEFAULT '' NOT NULL,`company` text DEFAULT '' NOT NULL,`project_type` text NOT NULL,`budget` text DEFAULT '' NOT NULL,`timeline` text DEFAULT '' NOT NULL,`message` text NOT NULL,`status` text DEFAULT 'new' NOT NULL,`notes` text DEFAULT '' NOT NULL,`assigned_to` text,`created_at` text NOT NULL,`updated_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `idx_contacts_status_created` ON `contacts` (`status`,`created_at`);
--> statement-breakpoint
CREATE TABLE `settings` (`key` text PRIMARY KEY NOT NULL,`value` text NOT NULL,`updated_by` text NOT NULL,`updated_at` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `activity_logs` (`id` text PRIMARY KEY NOT NULL,`user_id` text NOT NULL,`action` text NOT NULL,`object_type` text NOT NULL,`object_id` text NOT NULL,`detail` text DEFAULT '' NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `idx_activity_created` ON `activity_logs` (`created_at`);
--> statement-breakpoint
CREATE TABLE `backups` (`id` text PRIMARY KEY NOT NULL,`status` text NOT NULL,`size` integer DEFAULT 0 NOT NULL,`checksum` text DEFAULT '' NOT NULL,`created_by` text NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
PRAGMA optimize;
