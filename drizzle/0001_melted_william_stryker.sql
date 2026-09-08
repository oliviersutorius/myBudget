CREATE TABLE `montants_depense_variable` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type_depense_niveau3_id` integer NOT NULL,
	`mois` text NOT NULL,
	`montant` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`type_depense_niveau3_id`) REFERENCES `types_depense_niveau3`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `montants_depense_variable_type_id_idx` ON `montants_depense_variable` (`type_depense_niveau3_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `montants_depense_variable_type_mois_idx` ON `montants_depense_variable` (`type_depense_niveau3_id`,`mois`);