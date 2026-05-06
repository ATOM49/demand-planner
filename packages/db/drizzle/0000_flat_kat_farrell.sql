CREATE TABLE `actuals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sku` text NOT NULL,
	`date` text NOT NULL,
	`units_sold` real NOT NULL,
	`avg_unit_price` real NOT NULL,
	`cust_in_stock` real NOT NULL,
	`import_run_id` text NOT NULL,
	FOREIGN KEY (`import_run_id`) REFERENCES `import_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `actuals_natural_key` ON `actuals` (`sku`,`date`);--> statement-breakpoint
CREATE TABLE `alert_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sku` text NOT NULL,
	`latest_inference_date` text NOT NULL,
	`severity` text NOT NULL,
	`reasons_json` text NOT NULL,
	`metrics_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `alert_natural_key` ON `alert_snapshots` (`sku`,`latest_inference_date`);--> statement-breakpoint
CREATE TABLE `forecasts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sku` text NOT NULL,
	`date` text NOT NULL,
	`inference_date` text NOT NULL,
	`p05` real NOT NULL,
	`p50` real NOT NULL,
	`p95` real NOT NULL,
	`mean` real NOT NULL,
	`projected_price` real,
	`projected_in_stock` real,
	`model_id` text NOT NULL,
	`run_id` text NOT NULL,
	`client_id` text NOT NULL,
	`import_run_id` text NOT NULL,
	FOREIGN KEY (`import_run_id`) REFERENCES `import_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forecast_natural_key` ON `forecasts` (`sku`,`date`,`inference_date`);--> statement-breakpoint
CREATE TABLE `import_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`source_file_name` text NOT NULL,
	`source_path` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
