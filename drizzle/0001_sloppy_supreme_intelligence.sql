CREATE TABLE `channel_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`lastReadAt` timestamp NOT NULL DEFAULT (now()),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `channel_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type` enum('public','private') NOT NULL DEFAULT 'public',
	`createdBy` int NOT NULL,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`lastReadAt` timestamp NOT NULL DEFAULT (now()),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('dm','group') NOT NULL DEFAULT 'dm',
	`name` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int,
	`conversationId` int,
	`userId` int NOT NULL,
	`parentId` int,
	`content` text NOT NULL,
	`type` enum('text','system','file') NOT NULL DEFAULT 'text',
	`isEdited` boolean NOT NULL DEFAULT false,
	`replyCount` int NOT NULL DEFAULT 0,
	`fileUrl` text,
	`fileName` varchar(255),
	`fileMimeType` varchar(128),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `status` varchar(255) DEFAULT '';--> statement-breakpoint
ALTER TABLE `users` ADD `statusEmoji` varchar(32) DEFAULT '';--> statement-breakpoint
ALTER TABLE `users` ADD `presence` enum('online','away','offline') DEFAULT 'offline' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastSeen` timestamp DEFAULT (now()) NOT NULL;