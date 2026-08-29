CREATE TABLE `agent_metrics` (
	`id` varchar(36) NOT NULL,
	`agentId` varchar(36) NOT NULL,
	`tasksCompleted` int DEFAULT 0,
	`tasksFailedCount` int DEFAULT 0,
	`averageExecutionTime` float,
	`lastExecutedAt` timestamp,
	CONSTRAINT `agent_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_outputs` (
	`id` varchar(36) NOT NULL,
	`taskId` varchar(36) NOT NULL,
	`content` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`isComplete` boolean DEFAULT false,
	CONSTRAINT `agent_outputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(50),
	`capabilities` json,
	`status` enum('idle','busy','error') DEFAULT 'idle',
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(36),
	`sender` enum('user','jarvis','agent') NOT NULL,
	`content` text NOT NULL,
	`type` enum('text','voice','system') DEFAULT 'text',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(36) NOT NULL,
	`agentId` varchar(36),
	`input` text NOT NULL,
	`status` enum('pending','running','completed','failed') DEFAULT 'pending',
	`output` text,
	`streamId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
