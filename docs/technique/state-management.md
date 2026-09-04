# State management — myBudget

> Doc technique. Stores Zustand partagés entre écrans (voir `docs/WORKFLOW.md` pour la convention `zustand-agent`).

## `useCompteActifStore` — retiré (audit #47)

Store construit sur le ticket #2 pour retenir l'`id` du compte actuellement sélectionné/consulté entre écrans, sans avoir à le faire transiter via les paramètres de route. Jamais câblé dans un écran (`comptes/[id]/edit.tsx` reçoit son `compteId` par les paramètres de route) : retiré lors de l'audit technique #47 (`docs/technique/audit-47.md` §3.3) faute de consommateur. À recréer si un besoin de compte actif partagé entre écrans apparaît.
