CREATE TABLE `comptes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nom` text NOT NULL,
	`banque` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `montants_depense_historique` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type_depense_niveau3_id` integer NOT NULL,
	`mois_effet` text NOT NULL,
	`montant` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`type_depense_niveau3_id`) REFERENCES `types_depense_niveau3`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `montants_depense_historique_type_id_idx` ON `montants_depense_historique` (`type_depense_niveau3_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `montants_depense_historique_type_mois_idx` ON `montants_depense_historique` (`type_depense_niveau3_id`,`mois_effet`);--> statement-breakpoint
CREATE TABLE `revenus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`compte_id` integer NOT NULL,
	`mois` text NOT NULL,
	`libelle` text NOT NULL,
	`montant` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`compte_id`) REFERENCES `comptes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `revenus_compte_id_mois_idx` ON `revenus` (`compte_id`,`mois`);--> statement-breakpoint
CREATE TABLE `types_depense_niveau2` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`compte_id` integer NOT NULL,
	`libelle` text NOT NULL,
	`niveau1` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`compte_id`) REFERENCES `comptes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `types_depense_niveau2_compte_id_idx` ON `types_depense_niveau2` (`compte_id`);--> statement-breakpoint
CREATE TABLE `types_depense_niveau3` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`niveau2_id` integer NOT NULL,
	`libelle` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`niveau2_id`) REFERENCES `types_depense_niveau2`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `types_depense_niveau3_niveau2_id_idx` ON `types_depense_niveau3` (`niveau2_id`);