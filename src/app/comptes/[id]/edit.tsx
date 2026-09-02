import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronIcon, KebabIcon, PlusIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { getCompteQuery } from '@/db/queries/get-compte';
import { createRevenu } from '@/db/queries/create-revenu';
import { createTypeDepenseNiveau2 } from '@/db/queries/create-type-depense-niveau2';
import { createTypeDepenseNiveau3 } from '@/db/queries/create-type-depense-niveau3';
import { deleteRevenu } from '@/db/queries/delete-revenu';
import { deleteTypeDepenseNiveau2 } from '@/db/queries/delete-type-depense-niveau2';
import { deleteTypeDepenseNiveau3 } from '@/db/queries/delete-type-depense-niveau3';
import { getMontantsHistoriqueCompteQuery } from '@/db/queries/get-montants-historique-compte';
import { getRevenusQuery } from '@/db/queries/get-revenus';
import { getTypesDepenseNiveau2Query } from '@/db/queries/get-types-depense-niveau2';
import { getTypesDepenseNiveau3Query } from '@/db/queries/get-types-depense-niveau3';
import { resolveMontantsNiveau3Compte } from '@/db/queries/resolve-montants-niveau3-compte';
import { setMontantDepenseNiveau3 } from '@/db/queries/set-montant-depense-niveau3';
import { updateCompte } from '@/db/queries/update-compte';
import { updateRevenu } from '@/db/queries/update-revenu';
import { updateTypeDepenseNiveau2 } from '@/db/queries/update-type-depense-niveau2';
import { updateTypeDepenseNiveau3 } from '@/db/queries/update-type-depense-niveau3';
import { validateCompteForm, type CompteFormErrors } from '@/forms/validate-compte-form';
import { validateRevenuForm, type RevenuFormErrors } from '@/forms/validate-revenu-form';
import {
  validateTypeDepenseNiveau2Form,
  type TypeDepenseNiveau2FormErrors,
} from '@/forms/validate-type-depense-niveau2-form';
import {
  validateTypeDepenseNiveau3Form,
  type TypeDepenseNiveau3FormErrors,
} from '@/forms/validate-type-depense-niveau3-form';
import { useTheme } from '@/hooks/use-theme';
import { decalerMois } from '@/utils/mois';
import { centimesEnSaisie, formatCentimesEnEuros, parseMontantEnCentimes } from '@/utils/montant';

type Niveau1 = 'fixe' | 'variable';
type Onglet = 'infos' | 'depenses' | 'revenus' | 'budget';

type TypeDepenseNiveau2 = Awaited<ReturnType<typeof getTypesDepenseNiveau2Query>>[number];
type TypeDepenseNiveau3 = Awaited<ReturnType<typeof getTypesDepenseNiveau3Query>>[number];
type Revenu = Awaited<ReturnType<typeof getRevenusQuery>>[number];
type RevenuFormulaireEtat = { mode: 'ajout' } | { mode: 'edition'; revenu: Revenu } | null;
// Montant résolu (mois courant) par type de dépense niveau 3 — voir
// resolveMontantsNiveau3Compte. `undefined` (clé absente) et `null`
// (dépense absente ce mois) se traitent de façon identique à l'affichage.
type MontantsParType3 = Map<number, number | null>;

const LIBELLE_NIVEAU1: Record<Niveau1, string> = {
  fixe: 'Fixe',
  variable: 'Variable',
};

const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: 'infos', libelle: 'Infos' },
  { cle: 'depenses', libelle: 'Dépenses' },
  { cle: 'revenus', libelle: 'Revenus' },
  { cle: 'budget', libelle: 'Budget' },
];

const MOIS_LIBELLES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

// Mois calendaire courant au format 'YYYY-MM' (voir src/db/schema.ts).
// Le choix du mois courant comme mois par défaut de l'onglet Revenus (plutôt
// que le dernier mois consulté sur l'onglet Budget) a été tranché à la
// demande du développeur — point laissé ouvert par le ticket #34.
function moisCourant(): string {
  const maintenant = new Date();
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;
}

export default function EditionCompteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const compteId = Number(id);
  const theme = useTheme();

  const [chargement, setChargement] = useState(true);
  const [introuvable, setIntrouvable] = useState(false);
  const [nom, setNom] = useState('');
  const [banque, setBanque] = useState('');
  const [errors, setErrors] = useState<CompteFormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null);
  const [succesEnregistrement, setSuccesEnregistrement] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>('budget');
  // Onglets Dépenses/Revenus/Budget déjà visités : une fois visité, un onglet
  // reste monté (masqué avec `display: 'none'` plutôt que démonté) pour ne
  // pas perdre son état (lignes dépliées, année/mois sélectionné, live
  // queries) à chaque va-et-vient entre onglets.
  const [ongletsVisites, setOngletsVisites] = useState<ReadonlySet<Onglet>>(
    () => new Set(['budget']),
  );

  const changerOnglet = (nouvelOnglet: Onglet) => {
    setOnglet(nouvelOnglet);
    setOngletsVisites((precedent) =>
      precedent.has(nouvelOnglet) ? precedent : new Set(precedent).add(nouvelOnglet),
    );
  };

  useEffect(() => {
    let annule = false;

    getCompteQuery(compteId)
      .then(([compte]) => {
        if (annule) {
          return;
        }
        if (compte) {
          setNom(compte.nom);
          setBanque(compte.banque);
        } else {
          setIntrouvable(true);
        }
        setChargement(false);
      })
      .catch(() => {
        if (annule) {
          return;
        }
        setIntrouvable(true);
        setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [compteId]);

  const handleValider = async () => {
    const erreursValidation = validateCompteForm({ nom, banque });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0) {
      return;
    }

    setErreurEnregistrement(null);
    setSuccesEnregistrement(false);
    setEnregistrement(true);
    try {
      await updateCompte(compteId, nom.trim(), banque.trim());
      setSuccesEnregistrement(true);
    } catch {
      setErreurEnregistrement('La sauvegarde a échoué, réessayez.');
    } finally {
      setEnregistrement(false);
    }
  };

  if (chargement) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title">Édition du compte</ThemedText>
          <ThemedText themeColor="textSecondary">Chargement…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (introuvable) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title">Édition du compte</ThemedText>
          <ThemedText themeColor="textSecondary">Compte introuvable.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title">{nom}</ThemedText>

          <BarreOnglets actif={onglet} onChanger={changerOnglet} />

          {onglet === 'infos' ? (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.field}>
                <ThemedText type="smallBold">Nom</ThemedText>
                <TextInput
                  value={nom}
                  onChangeText={(valeur) => {
                    setNom(valeur);
                    setSuccesEnregistrement(false);
                  }}
                  placeholder="Ex. Compte courant"
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel="Nom du compte"
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
                {errors.nom ? (
                  <ThemedText type="small" themeColor="danger">
                    {errors.nom}
                  </ThemedText>
                ) : null}
              </ThemedView>

              <ThemedView style={styles.field}>
                <ThemedText type="smallBold">Banque</ThemedText>
                <TextInput
                  value={banque}
                  onChangeText={(valeur) => {
                    setBanque(valeur);
                    setSuccesEnregistrement(false);
                  }}
                  placeholder="Ex. BNP Paribas"
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel="Banque"
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
                {errors.banque ? (
                  <ThemedText type="small" themeColor="danger">
                    {errors.banque}
                  </ThemedText>
                ) : null}
              </ThemedView>

              {erreurEnregistrement ? (
                <ThemedText type="small" themeColor="danger">
                  {erreurEnregistrement}
                </ThemedText>
              ) : null}

              {succesEnregistrement ? (
                <ThemedText type="small" themeColor="textSecondary">
                  ✓ Modifications enregistrées.
                </ThemedText>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enregistrer les modifications du compte"
                disabled={enregistrement}
                onPress={handleValider}
              >
                <ThemedView type="backgroundElement" style={styles.submitButton}>
                  <ThemedText type="smallBold">
                    {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </ThemedView>
          ) : null}

          {ongletsVisites.has('depenses') ? (
            <ThemedView style={onglet === 'depenses' ? undefined : styles.masqueDisplayNone}>
              <DepensesTab compteId={compteId} />
            </ThemedView>
          ) : null}
          {ongletsVisites.has('revenus') ? (
            <ThemedView style={onglet === 'revenus' ? undefined : styles.masqueDisplayNone}>
              <RevenusTab compteId={compteId} />
            </ThemedView>
          ) : null}
          {ongletsVisites.has('budget') ? (
            <ThemedView style={onglet === 'budget' ? undefined : styles.masqueDisplayNone}>
              <BudgetTab />
            </ThemedView>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// Onglets internes à la page compte, implémentés en JS : NativeTabs ne
// supporte pas l'imbrication de tabs natifs (voir docs/technique/navigation.md).
function BarreOnglets({
  actif,
  onChanger,
}: {
  actif: Onglet;
  onChanger: (onglet: Onglet) => void;
}) {
  return (
    <ThemedView style={styles.tabBar}>
      {ONGLETS.map((item) => (
        <Pressable
          key={item.cle}
          accessibilityRole="tab"
          accessibilityState={{ selected: actif === item.cle }}
          accessibilityLabel={`Onglet ${item.libelle}`}
          onPress={() => onChanger(item.cle)}
          style={styles.tabWrapper}
        >
          <ThemedView
            type={actif === item.cle ? 'backgroundSelected' : 'backgroundElement'}
            style={styles.tab}
          >
            <ThemedText type={actif === item.cle ? 'smallBold' : 'small'}>
              {item.libelle}
            </ThemedText>
          </ThemedView>
        </Pressable>
      ))}
    </ThemedView>
  );
}

function Niveau1Selector({
  valeur,
  onChanger,
  accessibilityLabelPrefix,
}: {
  valeur: Niveau1 | null;
  onChanger: (niveau1: Niveau1) => void;
  accessibilityLabelPrefix: string;
}) {
  return (
    <ThemedView style={styles.niveau1Row}>
      {(['fixe', 'variable'] as const).map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityLabelPrefix} — ${LIBELLE_NIVEAU1[option]}`}
          onPress={() => onChanger(option)}
          style={styles.niveau1ChipWrapper}
        >
          <ThemedView
            type={valeur === option ? 'backgroundSelected' : 'backgroundElement'}
            style={styles.niveau1Chip}
          >
            <ThemedText type="small">{LIBELLE_NIVEAU1[option]}</ThemedText>
          </ThemedView>
        </Pressable>
      ))}
    </ThemedView>
  );
}

// Overlay des popups d'ajout (ticket #41) : dérivé du token `text` (light) à
// 50% d'opacité plutôt qu'une couleur en dur — reste volontairement le même
// quel que soit le thème actif (assombrit aussi bien un fond clair qu'un
// fond sombre), voir docs/design/charte-graphique.md § Popups d'ajout.
const POPUP_OVERLAY_COLOR = `${Colors.light.text}80`;

// Popup d'ajout générique (ticket #41, maquette « A — Compact »), partagée
// par l'ajout d'un type niveau 2 (Niveau1Pave, 1 champ) et d'une ligne
// niveau 3 (Niveau2Ligne, 2 champs) : traitement neutre, cohérent avec le
// reste de la maquette (pas de `primary`). Reste locale à cet écran (non
// exportée) pour la même raison que les autres composants ci-dessous — voir
// le commentaire au-dessus de `ActionMenuItem`.
function AjoutPopup({
  visible,
  titre,
  sousTitre,
  labelValider,
  enregistrement,
  erreur,
  onFermer,
  onValider,
  children,
}: {
  visible: boolean;
  titre: string;
  sousTitre?: string;
  labelValider: string;
  enregistrement: boolean;
  erreur: string | null;
  onFermer: () => void;
  onValider: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer la popup"
        style={[styles.popupOverlay, { backgroundColor: POPUP_OVERLAY_COLOR }]}
        onPress={onFermer}
      >
        {/* onPress no-op : absorbe le tap pour ne pas fermer la popup quand on
            touche la carte elle-même (les zones tactiles des Pressable
            enfants — champs, boutons — ne remontent pas jusqu'ici). */}
        <Pressable
          style={[styles.popupCard, { backgroundColor: theme.background }]}
          onPress={() => {}}
        >
          <ThemedText type="smallBold">{titre}</ThemedText>
          {sousTitre ? (
            <ThemedText type="small" themeColor="textSecondary">
              {sousTitre}
            </ThemedText>
          ) : null}

          {children}

          {erreur ? (
            <ThemedText type="small" themeColor="danger">
              {erreur}
            </ThemedText>
          ) : null}

          <ThemedView style={styles.popupFooter}>
            <Pressable accessibilityRole="button" accessibilityLabel="Annuler" onPress={onFermer}>
              <ThemedText type="link">Annuler</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labelValider}
              disabled={enregistrement}
              onPress={onValider}
            >
              <ThemedView type="backgroundSelected" style={styles.popupValiderButton}>
                <ThemedText type="smallBold">{enregistrement ? 'Ajout…' : labelValider}</ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Reste local à cet écran (non exporté) plutôt que déplacé dans
// src/components/ : `src/app/**` est exclu de la couverture Jest (couvert
// par l'e2e Maestro à la place, voir jest.config.js), un composant partagé
// dans src/components/ ne le serait pas et exigerait ses propres tests. À
// extraire quand un deuxième écran de liste en aura vraiment besoin (voir
// docs/design/charte-graphique.md), pas avant.
type ActionMenuItem = { label: string; onPress: () => void; destructive?: boolean };

// Popup de confirmation partagée par les suppressions de cet écran (type de
// dépense niveau 2, niveau 3, revenu) : même forme Annuler/Supprimer
// partout, déclenchée depuis l'entrée « Supprimer » d'un ActionsMenu.
// Composant maison (ticket #45) — remplace l'ancien `Alert.alert` natif,
// pour rester cohérent avec le style des autres popups de l'écran (voile,
// carte, tokens Sauge, voir AjoutPopup). Chaque appelant porte son propre
// état `visible` (une popup React ne peut pas s'ouvrir de façon impérative
// comme l'ancien `Alert.alert`).
function ConfirmationSuppression({
  visible,
  titre,
  message,
  onFermer,
  onConfirmer,
}: {
  visible: boolean;
  titre: string;
  message: string;
  onFermer: () => void;
  onConfirmer: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer la popup"
        style={[styles.popupOverlay, { backgroundColor: POPUP_OVERLAY_COLOR }]}
        onPress={onFermer}
      >
        {/* onPress no-op : absorbe le tap pour ne pas fermer la popup quand on
            touche la carte elle-même — même pattern que AjoutPopup. */}
        <Pressable
          style={[styles.popupCard, { backgroundColor: theme.background }]}
          onPress={() => {}}
        >
          <ThemedText type="smallBold">{titre}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {message}
          </ThemedText>

          <ThemedView style={styles.popupFooter}>
            <Pressable accessibilityRole="button" accessibilityLabel="Annuler" onPress={onFermer}>
              <ThemedText type="link">Annuler</ThemedText>
            </Pressable>
            {/* Même traitement « lien texte » qu'Annuler (pas de bouton plein
                comme le « Ajouter »/« Enregistrer » d'AjoutPopup) : seule la
                couleur danger le distingue — un fond backgroundSelected
                (même vert sauge que les actions positives) sous un libellé
                rouge aurait brouillé le signal destructif de ce bouton. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Supprimer"
              onPress={() => {
                onFermer();
                onConfirmer();
              }}
            >
              <ThemedText type="link" themeColor="danger">
                Supprimer
              </ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Popup listant les actions d'une ligne (Modifier/Supprimer, etc.) — composant
// maison (ticket #45) remplaçant l'ancien menu `Alert.alert` natif, pour
// rester cohérent avec le style des autres popups de l'écran. Utilisée par
// ActionsMenuButton ci-dessous, qui porte l'état d'ouverture.
function ActionsMenu({
  visible,
  titre,
  sousTitre,
  onFermer,
  actions,
}: {
  visible: boolean;
  titre: string;
  sousTitre?: string;
  onFermer: () => void;
  actions: ActionMenuItem[];
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer le menu"
        style={[styles.popupOverlay, { backgroundColor: POPUP_OVERLAY_COLOR }]}
        onPress={onFermer}
      >
        <Pressable
          style={[styles.popupCard, { backgroundColor: theme.background }]}
          onPress={() => {}}
        >
          <ThemedText type="smallBold">{titre}</ThemedText>
          {sousTitre ? (
            <ThemedText type="small" themeColor="textSecondary">
              {sousTitre}
            </ThemedText>
          ) : null}

          <ThemedView style={styles.actionsMenuList}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={() => {
                  onFermer();
                  action.onPress();
                }}
              >
                {/* Fond backgroundElement, comme toutes les autres lignes/cards
                    de l'écran (pavés, lignes niveau 2/3, onglets…) — pas de
                    texte nu sans support visuel, pour rester cohérent avec le
                    reste de la charte. */}
                <ThemedView type="backgroundElement" style={styles.actionsMenuItem}>
                  <ThemedText type="small" themeColor={action.destructive ? 'danger' : 'text'}>
                    {action.label}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          <ThemedView style={styles.popupFooter}>
            <Pressable accessibilityRole="button" accessibilityLabel="Annuler" onPress={onFermer}>
              <ThemedText type="link">Annuler</ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Bouton « ⋮ » ouvrant le menu d'actions (Modifier/Supprimer, etc.) —
// pattern établi par RevenuRow (ticket #12), généralisé à toutes les listes
// de l'onglet Dépenses par la charte graphique (ticket #26), et migré du
// menu `Alert.alert` natif vers une popup maison (ActionsMenu ci-dessus)
// par le ticket #45.
function ActionsMenuButton({
  accessibilityLabel,
  title,
  message,
  disabled,
  actions,
}: {
  accessibilityLabel: string;
  title: string;
  message?: string;
  disabled?: boolean;
  actions: ActionMenuItem[];
}) {
  const theme = useTheme();
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={() => setOuvert(true)}
        style={styles.actionsMenuButton}
      >
        <KebabIcon color={theme.text} />
      </Pressable>

      <ActionsMenu
        visible={ouvert}
        titre={title}
        sousTitre={message}
        onFermer={() => setOuvert(false)}
        actions={actions}
      />
    </>
  );
}

// Validation de la popup d'ajout niveau 3 (ticket #41) : réutilise
// `validateTypeDepenseNiveau3Form` (libellé + niveau2Id) et y ajoute le
// caractère obligatoire du montant — optionnel dans ce validateur partagé
// car aussi utilisé en édition, où un champ vide signifie « pas de
// changement » (voir sa doc). Ici, contrairement à l'ancien formulaire
// d'ajout toujours visible, la popup a 2 champs (Nom, Montant) : la ligne
// créée doit avoir un montant dès sa création.
function validerAjoutNiveau3(values: {
  libelle: string;
  niveau2Id: number;
  montant: string;
}): TypeDepenseNiveau3FormErrors {
  const errors = validateTypeDepenseNiveau3Form(values);

  if (values.montant.trim().length === 0) {
    errors.montant = 'Le montant est obligatoire.';
  }

  return errors;
}

function DepensesTab({ compteId }: { compteId: number }) {
  const { data: types } = useLiveQuery(getTypesDepenseNiveau2Query(compteId), [compteId]);
  // Une seule requête pour tout l'historique de montants du compte (ticket
  // #9) plutôt qu'une par ligne niveau 3 : résolue et agrégée ci-dessous,
  // puis distribuée aux lignes via montantsParType3 (voir
  // resolveMontantsNiveau3Compte).
  const { data: historiqueCompte } = useLiveQuery(getMontantsHistoriqueCompteQuery(compteId), [
    compteId,
  ]);
  const mois = moisCourant();
  const { montantsParType3, sommeParNiveau2 } = useMemo(
    () => resolveMontantsNiveau3Compte(historiqueCompte, mois),
    [historiqueCompte, mois],
  );
  const typesFixe = types.filter((type) => type.niveau1 === 'fixe');
  const typesVariable = types.filter((type) => type.niveau1 === 'variable');
  const sommeNiveau1 = (typesDuNiveau1: TypeDepenseNiveau2[]) =>
    typesDuNiveau1.reduce((somme, type2) => somme + (sommeParNiveau2.get(type2.id) ?? 0), 0);

  return (
    <ThemedView style={styles.section}>
      <Niveau1Pave
        compteId={compteId}
        niveau1="fixe"
        titre={LIBELLE_NIVEAU1.fixe}
        types={typesFixe}
        total={sommeNiveau1(typesFixe)}
        montantsParType3={montantsParType3}
        sommeParNiveau2={sommeParNiveau2}
      />
      <Niveau1Pave
        compteId={compteId}
        niveau1="variable"
        titre={LIBELLE_NIVEAU1.variable}
        types={typesVariable}
        total={sommeNiveau1(typesVariable)}
        montantsParType3={montantsParType3}
        sommeParNiveau2={sommeParNiveau2}
      />
    </ThemedView>
  );
}

// Pavé niveau 1 (Fixe/Variable), maquette « A — Compact » (ticket #41) : non
// éditable, collapsable en cliquant sur le libellé (ouvert par défaut — le
// plus proche du comportement de l'écran précédent, où les types niveau 2
// étaient toujours visibles), somme + bouton « + » (popup 1 champ Nom)
// toujours affichés sur l'en-tête, y compris replié.
function Niveau1Pave({
  compteId,
  niveau1,
  titre,
  types,
  total,
  montantsParType3,
  sommeParNiveau2,
}: {
  compteId: number;
  niveau1: Niveau1;
  titre: string;
  types: TypeDepenseNiveau2[];
  total: number;
  montantsParType3: MontantsParType3;
  sommeParNiveau2: Map<number, number>;
}) {
  const theme = useTheme();
  const [ouvert, setOuvert] = useState(true);
  const [popupOuvert, setPopupOuvert] = useState(false);
  const [libelle, setLibelle] = useState('');
  const [errors, setErrors] = useState<TypeDepenseNiveau2FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const fermerPopup = () => {
    setPopupOuvert(false);
    setLibelle('');
    setErrors({});
    setErreur(null);
  };

  const handleAjouter = async () => {
    const erreursValidation = validateTypeDepenseNiveau2Form({ libelle, niveau1 });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0) {
      return;
    }

    setErreur(null);
    setEnregistrement(true);
    try {
      await createTypeDepenseNiveau2(compteId, libelle.trim(), niveau1);
      // La nouvelle ligne niveau 2 doit être visible immédiatement (voir
      // spec du ticket) : on ouvre le pavé même s'il avait été replié avant
      // l'ajout.
      setOuvert(true);
      fermerPopup();
    } catch {
      setErreur('L’ajout a échoué, réessayez.');
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <ThemedView type="backgroundElement" style={styles.pave}>
      <ThemedView style={styles.paveHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${ouvert ? 'Replier' : 'Déplier'} le pavé ${titre}`}
          onPress={() => setOuvert((valeur) => !valeur)}
          style={styles.paveHeaderLabel}
        >
          <ChevronIcon color={theme.text} open={ouvert} />
          <ThemedText type="smallBold">{titre}</ThemedText>
        </Pressable>

        <ThemedView style={styles.paveHeaderRight}>
          <ThemedText type="smallBold" style={styles.tabularNums}>
            {formatCentimesEnEuros(total)}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ajouter un type de dépense — ${titre}`}
            onPress={() => setPopupOuvert(true)}
          >
            <ThemedView type="backgroundSelected" style={styles.paveAjoutButton}>
              <PlusIcon color={theme.text} />
            </ThemedView>
          </Pressable>
        </ThemedView>
      </ThemedView>

      {ouvert ? (
        types.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Aucun type « {titre} » pour l’instant.
          </ThemedText>
        ) : (
          <ThemedView style={styles.typesList}>
            {types.map((type) => (
              <Niveau2Ligne
                key={type.id}
                item={type}
                montantsParType3={montantsParType3}
                sommeParNiveau2={sommeParNiveau2}
              />
            ))}
          </ThemedView>
        )
      ) : null}

      <AjoutPopup
        visible={popupOuvert}
        titre="Ajouter un type de dépense"
        sousTitre={titre}
        labelValider="Ajouter"
        enregistrement={enregistrement}
        erreur={erreur}
        onFermer={fermerPopup}
        onValider={handleAjouter}
      >
        <ThemedView style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Nom
          </ThemedText>
          <TextInput
            value={libelle}
            onChangeText={setLibelle}
            placeholder="Ex. Maison"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Nom du nouveau type de dépense"
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {errors.libelle ? (
            <ThemedText type="small" themeColor="danger">
              {errors.libelle}
            </ThemedText>
          ) : null}
        </ThemedView>
      </AjoutPopup>
    </ThemedView>
  );
}

// Ligne niveau 2, maquette « A — Compact » (ticket #41) : carte imbriquée
// dans le pavé niveau 1, collapsable (repliée par défaut, comme l'ancien
// Niveau2RowCollapsible), somme du couple niveau1/niveau2 + bouton « + »
// (popup 2 champs Nom/Montant) sur l'en-tête. Le menu « ⋮ » (Modifier/
// Supprimer) est conservé — absent du texte de la spec pixel mais retenu à
// la demande du développeur pour ne pas perdre cette fonctionnalité.
// « Modifier » ouvre une popup (AjoutPopup, même style que l'ajout) plutôt
// qu'une édition inline dans la ligne : homogénéité demandée après coup par
// le développeur (édition inline d'origine jugée non cohérente avec le
// style des popups d'ajout du ticket #41).
function Niveau2Ligne({
  item,
  montantsParType3,
  sommeParNiveau2,
}: {
  item: TypeDepenseNiveau2;
  montantsParType3: MontantsParType3;
  sommeParNiveau2: Map<number, number>;
}) {
  const theme = useTheme();
  const [ouvert, setOuvert] = useState(false);
  // Une fois dépliée au moins une fois, la liste niveau 3 reste montée (juste
  // masquée avec `display: 'none'` au repli) pour ne pas perdre un ajout ou
  // une édition niveau 3 en cours si l'utilisateur replie la ligne parente.
  const [aEteOuvert, setAEteOuvert] = useState(false);
  const [edition, setEdition] = useState(false);
  const [libelle, setLibelle] = useState(item.libelle);
  const [niveau1, setNiveau1] = useState<Niveau1 | null>(item.niveau1);
  const [errors, setErrors] = useState<TypeDepenseNiveau2FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] = useState(false);
  const libelleAccessible = `${item.libelle} (#${item.id})`;

  // État de la popup d'ajout d'une ligne niveau 3, indépendant de l'état
  // d'édition/suppression ci-dessus.
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [ajoutLibelle, setAjoutLibelle] = useState('');
  const [ajoutMontant, setAjoutMontant] = useState('');
  const [ajoutErrors, setAjoutErrors] = useState<TypeDepenseNiveau3FormErrors>({});
  const [ajoutEnregistrement, setAjoutEnregistrement] = useState(false);
  const [ajoutErreur, setAjoutErreur] = useState<string | null>(null);

  const handleAnnuler = () => {
    setLibelle(item.libelle);
    setNiveau1(item.niveau1);
    setErrors({});
    setErreur(null);
    setEdition(false);
  };

  const handleEnregistrer = async () => {
    const erreursValidation = validateTypeDepenseNiveau2Form({ libelle, niveau1 });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0 || niveau1 === null) {
      return;
    }

    setErreur(null);
    setEnregistrement(true);
    try {
      await updateTypeDepenseNiveau2(item.id, libelle.trim(), niveau1);
      setEdition(false);
    } catch {
      setErreur('La sauvegarde a échoué, réessayez.');
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async () => {
    setErreur(null);
    setSuppression(true);
    try {
      await deleteTypeDepenseNiveau2(item.id);
    } catch (error) {
      // Contrainte de clé étrangère (PRAGMA foreign_keys = ON) : la
      // suppression échouera tant que des types niveau 3 dépendent encore
      // de celui-ci (voir delete-type-depense-niveau2.ts). Pas la peine de
      // laisser croire qu'un simple réessai suffira.
      const bloqueParDesEnfants =
        error instanceof Error && error.message.includes('FOREIGN KEY constraint failed');
      setErreur(
        bloqueParDesEnfants
          ? 'Suppression impossible : des dépenses sont encore rattachées à ce type.'
          : 'La suppression a échoué, réessayez.',
      );
      setSuppression(false);
    }
  };

  const handleSupprimer = () => {
    setConfirmationSuppressionOuverte(true);
  };

  const fermerAjout = () => {
    setAjoutOuvert(false);
    setAjoutLibelle('');
    setAjoutMontant('');
    setAjoutErrors({});
    setAjoutErreur(null);
  };

  const handleAjouterNiveau3 = async () => {
    const erreursValidation = validerAjoutNiveau3({
      libelle: ajoutLibelle,
      niveau2Id: item.id,
      montant: ajoutMontant,
    });
    setAjoutErrors(erreursValidation);

    const montantEnCentimes = parseMontantEnCentimes(ajoutMontant);
    if (Object.keys(erreursValidation).length > 0 || montantEnCentimes === null) {
      return;
    }

    setAjoutErreur(null);
    setAjoutEnregistrement(true);
    try {
      const [ligneCreee] = await createTypeDepenseNiveau3(item.id, ajoutLibelle.trim());
      await setMontantDepenseNiveau3(ligneCreee.id, moisCourant(), montantEnCentimes);
      // La nouvelle ligne niveau 3 doit apparaître immédiatement (voir spec
      // du ticket) : on déplie la ligne niveau 2 même si elle était repliée
      // avant l'ajout.
      setOuvert(true);
      setAEteOuvert(true);
      fermerAjout();
    } catch {
      setAjoutErreur('L’ajout a échoué, réessayez.');
    } finally {
      setAjoutEnregistrement(false);
    }
  };

  return (
    <>
      <ThemedView style={styles.niveau2Card}>
        <ThemedView style={styles.niveau2Header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${ouvert ? 'Replier' : 'Déplier'} le type de dépense ${libelleAccessible}`}
            onPress={() => {
              setOuvert((valeur) => !valeur);
              setAEteOuvert(true);
            }}
            style={styles.niveau2HeaderLabel}
          >
            <ChevronIcon color={theme.text} open={ouvert} size={14} />
            <ThemedText type="smallBold">{item.libelle}</ThemedText>
          </Pressable>

          <ThemedView style={styles.niveau2HeaderRight}>
            <ThemedText type="small" style={styles.tabularNums}>
              {formatCentimesEnEuros(sommeParNiveau2.get(item.id) ?? 0)}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ajouter une ligne — ${item.libelle}`}
              style={styles.niveau2AjoutButton}
              onPress={() => setAjoutOuvert(true)}
            >
              <PlusIcon color={theme.textSecondary} />
            </Pressable>
            <ActionsMenuButton
              accessibilityLabel={`Actions pour le type de dépense ${libelleAccessible}`}
              title={item.libelle}
              disabled={suppression}
              actions={[
                { label: 'Modifier', onPress: () => setEdition(true) },
                { label: 'Supprimer', onPress: handleSupprimer, destructive: true },
              ]}
            />
          </ThemedView>
        </ThemedView>

        {/* Erreur de suppression uniquement : l'erreur d'enregistrement d'une
            modification s'affiche dans la popup Modifier ci-dessous (edition
            true pendant la sauvegarde), pas ici — éviter de l'afficher deux
            fois au même moment. */}
        {!edition && erreur ? (
          <ThemedText type="small" themeColor="danger">
            {erreur}
          </ThemedText>
        ) : null}
      </ThemedView>

      {aEteOuvert ? (
        <Niveau3Liste
          niveau2Id={item.id}
          masque={!ouvert}
          montantsParType3={montantsParType3}
          contexte={`${item.libelle} · ${LIBELLE_NIVEAU1[item.niveau1]}`}
        />
      ) : null}

      <AjoutPopup
        visible={edition}
        titre="Modifier le type de dépense"
        sousTitre={LIBELLE_NIVEAU1[item.niveau1]}
        labelValider="Enregistrer"
        enregistrement={enregistrement}
        erreur={erreur}
        onFermer={handleAnnuler}
        onValider={handleEnregistrer}
      >
        <ThemedView style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Nom
          </ThemedText>
          <TextInput
            value={libelle}
            onChangeText={setLibelle}
            accessibilityLabel={`Libellé du type de dépense ${libelleAccessible}`}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {errors.libelle ? (
            <ThemedText type="small" themeColor="danger">
              {errors.libelle}
            </ThemedText>
          ) : null}
        </ThemedView>

        <Niveau1Selector
          valeur={niveau1}
          onChanger={setNiveau1}
          accessibilityLabelPrefix={`Type de dépense ${libelleAccessible}`}
        />
        {errors.niveau1 ? (
          <ThemedText type="small" themeColor="danger">
            {errors.niveau1}
          </ThemedText>
        ) : null}
      </AjoutPopup>

      <AjoutPopup
        visible={ajoutOuvert}
        titre="Ajouter une ligne"
        sousTitre={`${item.libelle} · ${LIBELLE_NIVEAU1[item.niveau1]}`}
        labelValider="Ajouter"
        enregistrement={ajoutEnregistrement}
        erreur={ajoutErreur}
        onFermer={fermerAjout}
        onValider={handleAjouterNiveau3}
      >
        <ThemedView style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Nom
          </ThemedText>
          <TextInput
            value={ajoutLibelle}
            onChangeText={setAjoutLibelle}
            placeholder="Ex. Crédit immobilier"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Nom de la nouvelle ligne"
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {ajoutErrors.libelle ? (
            <ThemedText type="small" themeColor="danger">
              {ajoutErrors.libelle}
            </ThemedText>
          ) : null}
        </ThemedView>

        <ThemedView style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Montant
          </ThemedText>
          <TextInput
            value={ajoutMontant}
            onChangeText={setAjoutMontant}
            placeholder="Ex. 1500"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            accessibilityLabel="Montant de la nouvelle ligne"
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {ajoutErrors.montant ? (
            <ThemedText type="small" themeColor="danger">
              {ajoutErrors.montant}
            </ThemedText>
          ) : null}
        </ThemedView>
      </AjoutPopup>

      <ConfirmationSuppression
        visible={confirmationSuppressionOuverte}
        titre="Supprimer ce type de dépense ?"
        message={`« ${item.libelle} » sera définitivement supprimé.`}
        onFermer={() => setConfirmationSuppressionOuverte(false)}
        onConfirmer={supprimer}
      />
    </>
  );
}

function Niveau3Liste({
  niveau2Id,
  masque,
  montantsParType3,
  contexte,
}: {
  niveau2Id: number;
  masque: boolean;
  montantsParType3: MontantsParType3;
  /** Sous-titre contextuel des popups « Modifier » (ex. « Logement · Fixe »), voir Niveau2Ligne. */
  contexte: string;
}) {
  const { data: sousTypes } = useLiveQuery(getTypesDepenseNiveau3Query(niveau2Id), [niveau2Id]);

  return (
    <ThemedView style={[styles.niveau3Section, masque ? styles.masqueDisplayNone : undefined]}>
      {sousTypes.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Aucune ligne pour l’instant.
        </ThemedText>
      ) : (
        sousTypes.map((sousType, index) => (
          <TypeDepenseNiveau3Row
            key={sousType.id}
            item={sousType}
            montant={montantsParType3.get(sousType.id) ?? null}
            premiere={index === 0}
            contexte={contexte}
          />
        ))
      )}
    </ThemedView>
  );
}

function TypeDepenseNiveau3Row({
  item,
  montant,
  premiere,
  contexte,
}: {
  item: TypeDepenseNiveau3;
  /** Montant résolu au mois courant (voir DepensesTab), `null` = absente ce mois. */
  montant: number | null;
  /** Première ligne de la liste : pas de séparateur au-dessus (voir Niveau3Liste). */
  premiere: boolean;
  /** Sous-titre contextuel de la popup « Modifier » (ex. « Logement · Fixe »). */
  contexte: string;
}) {
  const theme = useTheme();
  const [edition, setEdition] = useState(false);
  const [libelle, setLibelle] = useState(item.libelle);
  const [montantSaisie, setMontantSaisie] = useState('');
  const [errors, setErrors] = useState<TypeDepenseNiveau3FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] = useState(false);
  const libelleAccessible = `${item.libelle} (#${item.id})`;
  // Garde-fou anti-unmount (même pattern que RevenuRow/RevenuForm) : évite
  // un setState après démontage si la ligne disparaît (suppression) pendant
  // qu'un enregistrement de montant est encore en cours.
  const monte = useRef(true);
  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  const handleAnnuler = () => {
    setLibelle(item.libelle);
    setMontantSaisie(montant !== null ? centimesEnSaisie(montant) : '');
    setErrors({});
    setErreur(null);
    setEdition(false);
  };

  const handleEnregistrer = async () => {
    const erreursValidation = validateTypeDepenseNiveau3Form({
      libelle,
      niveau2Id: item.niveau2Id,
      montant: montantSaisie,
    });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0) {
      return;
    }

    setErreur(null);
    setEnregistrement(true);
    try {
      await updateTypeDepenseNiveau3(item.id, libelle.trim());

      // Un champ montant vide signifie « pas de changement de montant » (la
      // validation ci-dessus l'accepte) — ce n'est pas ainsi qu'on marque
      // une dépense absente, voir « Marquer absente » plus bas. Une saisie
      // identique au montant déjà résolu n'est pas non plus réécrite : pas
      // de duplication en base pour un mois sans changement (voir #9).
      const montantSaisieTrim = montantSaisie.trim();
      if (montantSaisieTrim.length > 0) {
        const montantEnCentimes = parseMontantEnCentimes(montantSaisieTrim);
        if (montantEnCentimes !== null && montantEnCentimes !== montant) {
          await setMontantDepenseNiveau3(item.id, moisCourant(), montantEnCentimes);
        }
      }

      if (monte.current) {
        setEdition(false);
      }
    } catch {
      if (monte.current) {
        setErreur('La sauvegarde a échoué, réessayez.');
      }
    } finally {
      if (monte.current) {
        setEnregistrement(false);
      }
    }
  };

  const marquerAbsente = async () => {
    // Le menu d'actions ne permet pas de désactiver une entrée
    // individuellement (voir ActionsMenuButton, dont le `disabled` ne gate
    // que tout le bouton ⋮, via `suppression`) : on protège donc ici contre
    // un appel concurrent à un enregistrement déjà en cours sur cette même
    // ligne (double-tap, ou Modifier + Marquer absente enchaînés rapidement).
    if (enregistrement || suppression) {
      return;
    }
    setErreur(null);
    setEnregistrement(true);
    try {
      await setMontantDepenseNiveau3(item.id, moisCourant(), null);
      if (monte.current) {
        setMontantSaisie('');
      }
    } catch {
      if (monte.current) {
        setErreur('L’action a échoué, réessayez.');
      }
    } finally {
      if (monte.current) {
        setEnregistrement(false);
      }
    }
  };

  const supprimer = async () => {
    setErreur(null);
    setSuppression(true);
    try {
      await deleteTypeDepenseNiveau3(item.id);
    } catch (error) {
      // Contrainte de clé étrangère (PRAGMA foreign_keys = ON) : la
      // suppression échoue tant que des montants historisés dépendent
      // encore de cette ligne (voir delete-type-depense-niveau3.ts). Pas la
      // peine de laisser croire qu'un simple réessai suffira.
      const bloqueParDesEnfants =
        error instanceof Error && error.message.includes('FOREIGN KEY constraint failed');
      setErreur(
        bloqueParDesEnfants
          ? 'Suppression impossible : des montants sont encore rattachés à cette ligne.'
          : 'La suppression a échoué, réessayez.',
      );
      setSuppression(false);
    }
  };

  const handleSupprimer = () => {
    // Même garde que marquerAbsente ci-dessus : évite de déclencher la
    // suppression pendant qu'un enregistrement de montant est encore en
    // cours sur cette ligne (risque de contrainte de clé étrangère si le
    // montant s'insère après coup — voir le catch de `supprimer`).
    if (enregistrement || suppression) {
      return;
    }
    setConfirmationSuppressionOuverte(true);
  };

  return (
    <>
      <ThemedView
        style={[
          styles.niveau3Row,
          premiere ? undefined : { borderTopWidth: 1, borderTopColor: theme.backgroundElement },
        ]}
      >
        <ThemedView style={styles.niveau3RowMain}>
          <ThemedText type="small" style={styles.niveau3Libelle}>
            {item.libelle}
          </ThemedText>
          {montant === null ? (
            <ThemedText type="small" themeColor="textSecondary">
              Absente ce mois
            </ThemedText>
          ) : (
            <ThemedText type="small" style={styles.tabularNums}>
              {formatCentimesEnEuros(montant)}
            </ThemedText>
          )}

          <ActionsMenuButton
            accessibilityLabel={`Actions pour la ligne ${libelleAccessible}`}
            title={item.libelle}
            // Le menu d'actions ne permet pas de désactiver une entrée individuellement
            // (seulement d'ouvrir/fermer tout le menu) : on ne gate donc le menu
            // que par `suppression`, comme sur les lignes niveau 2, plutôt que
            // d'y ajouter `enregistrement` — sinon « Modifier » redevient
            // injoignable pendant l'enregistrement de « Marquer absente », alors
            // que ça a toujours été possible (seules « Marquer absente » et
            // « Supprimer » étaient gérées par ces deux états avant l'introduction
            // de ce menu unique, voir #26).
            disabled={suppression}
            actions={[
              {
                label: 'Modifier',
                onPress: () => {
                  // Initialisé ici plutôt qu'au montage : `montant` provient
                  // d'une requête compte-wide (DepensesTab) qui peut ne pas
                  // avoir encore résolu quand cette ligne apparaît — on lit sa
                  // valeur la plus récente au moment où l'utilisateur ouvre
                  // effectivement l'édition.
                  setMontantSaisie(montant !== null ? centimesEnSaisie(montant) : '');
                  setEdition(true);
                },
              },
              ...(montant !== null ? [{ label: 'Marquer absente', onPress: marquerAbsente }] : []),
              { label: 'Supprimer', onPress: handleSupprimer, destructive: true },
            ]}
          />
        </ThemedView>

        {/* Erreur de suppression/« Marquer absente » uniquement : l'erreur
            d'enregistrement d'une modification s'affiche dans la popup
            Modifier ci-dessous (edition true pendant la sauvegarde), pas ici
            — éviter de l'afficher deux fois au même moment. */}
        {!edition && erreur ? (
          <ThemedText type="small" themeColor="danger">
            {erreur}
          </ThemedText>
        ) : null}
      </ThemedView>

      <AjoutPopup
        visible={edition}
        titre="Modifier la ligne"
        sousTitre={contexte}
        labelValider="Enregistrer"
        enregistrement={enregistrement}
        erreur={erreur}
        onFermer={handleAnnuler}
        onValider={handleEnregistrer}
      >
        <ThemedView style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Nom
          </ThemedText>
          <TextInput
            value={libelle}
            onChangeText={setLibelle}
            accessibilityLabel={`Libellé de la ligne ${libelleAccessible}`}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {errors.libelle ? (
            <ThemedText type="small" themeColor="danger">
              {errors.libelle}
            </ThemedText>
          ) : null}
        </ThemedView>

        <ThemedView style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Montant
          </ThemedText>
          <TextInput
            value={montantSaisie}
            onChangeText={setMontantSaisie}
            placeholder="Ex. 1500"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            accessibilityLabel={`Montant de la ligne ${libelleAccessible}`}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {errors.montant ? (
            <ThemedText type="small" themeColor="danger">
              {errors.montant}
            </ThemedText>
          ) : null}
        </ThemedView>
      </AjoutPopup>

      <ConfirmationSuppression
        visible={confirmationSuppressionOuverte}
        titre="Supprimer cette ligne ?"
        message={`« ${item.libelle} » sera définitivement supprimée.`}
        onFermer={() => setConfirmationSuppressionOuverte(false)}
        onConfirmer={supprimer}
      />
    </>
  );
}

// Onglet Revenus (ticket #12) : liste, ajout, modification et suppression
// des revenus du compte, pour un mois navigable (mois calendaire, mois
// courant par défaut — voir moisCourant() ci-dessus). Plusieurs revenus sont
// possibles pour un même mois (voir ticket #34). Navigation mois par mois
// indépendante de l'onglet Budget (pas d'état de mois partagé entre les
// deux onglets, voir #34).
//
// Modifier/Supprimer sur chaque ligne : bouton « ⋮ » ouvrant un menu à 2
// actions (option C validée par le développeur parmi 3 propositions
// graphiques — voir ActionsMenuButton, généralisé aux autres listes de
// l'onglet Dépenses par la charte graphique, ticket #26). Modifier affiche
// le formulaire pré-rempli sous le
// tableau (même emplacement que l'ajout) ; Supprimer ouvre une popup de
// confirmation dédiée.
function RevenusTab({ compteId }: { compteId: number }) {
  const [mois, setMois] = useState(() => moisCourant());
  const { data: revenusDuMois } = useLiveQuery(getRevenusQuery(compteId, mois), [compteId, mois]);
  const [formulaire, setFormulaire] = useState<RevenuFormulaireEtat>(null);
  const total = revenusDuMois.reduce((somme, revenu) => somme + revenu.montant, 0);
  const [annee, moisIndex] = mois.split('-').map(Number);

  // Si le revenu en cours de modification a été supprimé entre-temps (ex.
  // depuis le menu ⋮ de sa propre ligne pendant que le formulaire était
  // ouvert), on ne le considère plus ouvert : évite de soumettre une
  // modification sur un id devenu inexistant (même défense que
  // `selectedNiveau2Id` dans AjoutTypeNiveau3Form ci-dessus).
  const formulaireAffiche: RevenuFormulaireEtat =
    formulaire?.mode === 'edition' && !revenusDuMois.some((r) => r.id === formulaire.revenu.id)
      ? null
      : formulaire;

  // Changer de mois ferme le formulaire ouvert : un ajout/une modification
  // en cours ne doit pas se retrouver silencieusement rattaché(e) à un
  // autre mois que celui affiché à l'écran au moment de l'ouverture.
  const changerMois = (delta: number) => {
    setFormulaire(null);
    setMois((valeur) => decalerMois(valeur, delta));
  };

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold">Revenus</ThemedText>

      <ThemedView style={styles.anneeSelectorRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mois précédent"
          onPress={() => changerMois(-1)}
        >
          <ThemedText type="title" style={styles.anneeChevron}>
            ‹
          </ThemedText>
        </Pressable>
        <ThemedText type="smallBold">
          {MOIS_LIBELLES[moisIndex - 1]} {annee}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mois suivant"
          onPress={() => changerMois(1)}
        >
          <ThemedText type="title" style={styles.anneeChevron}>
            ›
          </ThemedText>
        </Pressable>
      </ThemedView>

      {revenusDuMois.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Aucun revenu pour l’instant.
        </ThemedText>
      ) : (
        <ThemedView style={styles.typesList}>
          {revenusDuMois.map((revenu) => (
            <RevenuRow
              key={revenu.id}
              revenu={revenu}
              onModifier={() => setFormulaire({ mode: 'edition', revenu })}
            />
          ))}
        </ThemedView>
      )}

      <ThemedView style={styles.totalRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Total
        </ThemedText>
        <ThemedText type="smallBold">{formatCentimesEnEuros(total)}</ThemedText>
      </ThemedView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={formulaireAffiche ? 'Fermer le formulaire' : 'Ajouter un revenu'}
        onPress={() => setFormulaire(formulaireAffiche ? null : { mode: 'ajout' })}
      >
        <ThemedView type="backgroundElement" style={styles.submitButton}>
          <ThemedText type="smallBold">
            {formulaireAffiche ? 'Fermer' : '+ Ajouter un revenu'}
          </ThemedText>
        </ThemedView>
      </Pressable>

      {/* En ajout, le formulaire reste ouvert après un enregistrement réussi
          (juste vidé) pour enchaîner plusieurs revenus du mois sans le
          rouvrir à chaque fois. En modification, il se referme après un
          enregistrement réussi (une ligne à la fois, comme les formulaires
          d'édition niveau 2/3 de l'onglet Dépenses). */}
      {formulaireAffiche ? (
        <RevenuForm
          key={formulaireAffiche.mode === 'edition' ? formulaireAffiche.revenu.id : 'ajout'}
          compteId={compteId}
          mois={mois}
          revenuExistant={formulaireAffiche.mode === 'edition' ? formulaireAffiche.revenu : null}
          onModificationEnregistree={() => setFormulaire(null)}
        />
      ) : null}
    </ThemedView>
  );
}

function RevenuRow({ revenu, onModifier }: { revenu: Revenu; onModifier: () => void }) {
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] = useState(false);
  // Même garde-fou que RevenuForm : évite un setState après démontage si la
  // ligne disparaît (ex. changement de mois) pendant la suppression.
  const monte = useRef(true);
  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  const supprimer = async () => {
    setErreur(null);
    setSuppression(true);
    try {
      await deleteRevenu(revenu.id);
    } catch {
      if (monte.current) {
        setErreur('La suppression a échoué, réessayez.');
        setSuppression(false);
      }
    }
  };

  return (
    <ThemedView type="backgroundElement" style={styles.revenuCard}>
      <ThemedView style={styles.revenuCardRow}>
        <ThemedText type="small">{revenu.libelle}</ThemedText>
        <ThemedView style={styles.revenuCardRight}>
          <ThemedText type="small">{formatCentimesEnEuros(revenu.montant)}</ThemedText>
          <ActionsMenuButton
            accessibilityLabel={`Actions pour le revenu ${revenu.libelle}`}
            title={revenu.libelle}
            message={formatCentimesEnEuros(revenu.montant)}
            disabled={suppression}
            actions={[
              { label: 'Modifier', onPress: onModifier },
              {
                label: 'Supprimer',
                onPress: () => setConfirmationSuppressionOuverte(true),
                destructive: true,
              },
            ]}
          />
        </ThemedView>
      </ThemedView>

      {erreur ? (
        <ThemedText type="small" themeColor="danger">
          {erreur}
        </ThemedText>
      ) : null}

      <ConfirmationSuppression
        visible={confirmationSuppressionOuverte}
        titre="Supprimer ce revenu ?"
        message={`« ${revenu.libelle} » sera définitivement supprimé.`}
        onFermer={() => setConfirmationSuppressionOuverte(false)}
        onConfirmer={supprimer}
      />
    </ThemedView>
  );
}

// Formulaire partagé ajout/modification d'un revenu, affiché sous le
// tableau des revenus. `revenuExistant` distingue les deux modes : en
// modification, les champs sont pré-remplis et l'enregistrement referme le
// formulaire ; en ajout, il reste ouvert et vidé pour enchaîner plusieurs
// revenus (voir commentaire de RevenusTab).
function RevenuForm({
  compteId,
  mois,
  revenuExistant,
  onModificationEnregistree,
}: {
  compteId: number;
  mois: string;
  revenuExistant: Revenu | null;
  onModificationEnregistree: () => void;
}) {
  const theme = useTheme();
  const [libelle, setLibelle] = useState(revenuExistant?.libelle ?? '');
  const [montant, setMontant] = useState(
    revenuExistant ? centimesEnSaisie(revenuExistant.montant) : '',
  );
  const [errors, setErrors] = useState<RevenuFormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null);
  // Le bouton qui referme ce formulaire (dans RevenusTab) reste actif
  // pendant l'enregistrement : ce ref évite d'appeler setState après un
  // démontage si l'utilisateur ferme le formulaire pendant l'await.
  const monte = useRef(true);
  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );
  // Verrou synchrone (contrairement à `enregistrement`, un state React dont
  // la mise à jour n'est pas immédiatement reflétée par `disabled`) : évite
  // qu'un double-tap rapide sur le bouton déclenche handleValider deux fois
  // avant le premier re-render, et crée un revenu en double.
  const enCours = useRef(false);

  const handleValider = async () => {
    const erreursValidation = validateRevenuForm({ libelle, montant });
    setErrors(erreursValidation);

    const montantEnCentimes = parseMontantEnCentimes(montant);
    if (
      Object.keys(erreursValidation).length > 0 ||
      montantEnCentimes === null ||
      enCours.current
    ) {
      return;
    }

    enCours.current = true;
    setErreurEnregistrement(null);
    setEnregistrement(true);
    try {
      if (revenuExistant) {
        await updateRevenu(revenuExistant.id, libelle.trim(), montantEnCentimes);
        if (monte.current) {
          onModificationEnregistree();
        }
      } else {
        await createRevenu(compteId, mois, libelle.trim(), montantEnCentimes);
        if (monte.current) {
          setLibelle('');
          setMontant('');
        }
      }
    } catch {
      if (monte.current) {
        setErreurEnregistrement(
          revenuExistant ? 'La modification a échoué, réessayez.' : 'L’ajout a échoué, réessayez.',
        );
      }
    } finally {
      enCours.current = false;
      if (monte.current) {
        setEnregistrement(false);
      }
    }
  };

  return (
    <ThemedView style={styles.ajoutForm}>
      <TextInput
        value={libelle}
        onChangeText={setLibelle}
        placeholder="Ex. Salaire"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Libellé du revenu"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      {errors.libelle ? (
        <ThemedText type="small" themeColor="danger">
          {errors.libelle}
        </ThemedText>
      ) : null}

      <TextInput
        value={montant}
        onChangeText={setMontant}
        placeholder="Ex. 1500"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        accessibilityLabel="Montant du revenu"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      {errors.montant ? (
        <ThemedText type="small" themeColor="danger">
          {errors.montant}
        </ThemedText>
      ) : null}

      {erreurEnregistrement ? (
        <ThemedText type="small" themeColor="danger">
          {erreurEnregistrement}
        </ThemedText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          revenuExistant ? 'Enregistrer la modification du revenu' : 'Valider l’ajout du revenu'
        }
        disabled={enregistrement}
        onPress={handleValider}
      >
        <ThemedView type="backgroundElement" style={styles.submitButton}>
          <ThemedText type="smallBold">
            {enregistrement
              ? revenuExistant
                ? 'Enregistrement…'
                : 'Ajout…'
              : revenuExistant
                ? 'Enregistrer'
                : 'Ajouter'}
          </ThemedText>
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
}

// Onglet placeholder pour la structure de navigation (sélecteur d'année,
// liste des mois, détail d'un mois avec retour). Le contenu réel du détail
// (répartition des dépenses, revenus, montant disponible) dépend des
// tickets #9, #12 et #13 — voir ticket #34.
function BudgetTab() {
  const [annee, setAnnee] = useState(() => new Date().getFullYear());
  const [moisSelectionne, setMoisSelectionne] = useState<number | null>(null);

  if (moisSelectionne !== null) {
    return (
      <ThemedView style={styles.section}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour à la liste des mois"
          onPress={() => setMoisSelectionne(null)}
        >
          <ThemedText type="link">‹ Retour aux mois</ThemedText>
        </Pressable>

        <ThemedText type="smallBold">
          {MOIS_LIBELLES[moisSelectionne - 1]} {annee}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Détail du mois à venir (dépend des tickets #9, #12, #13).
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.anneeSelectorRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Année précédente"
          onPress={() => setAnnee((valeur) => valeur - 1)}
        >
          <ThemedText type="title" style={styles.anneeChevron}>
            ‹
          </ThemedText>
        </Pressable>
        <ThemedText type="smallBold">{annee}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Année suivante"
          onPress={() => setAnnee((valeur) => valeur + 1)}
        >
          <ThemedText type="title" style={styles.anneeChevron}>
            ›
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.typesList}>
        {MOIS_LIBELLES.map((libelleMois, index) => {
          const mois = 12 - index;
          return (
            <Pressable
              key={mois}
              accessibilityRole="button"
              accessibilityLabel={`Voir le détail de ${MOIS_LIBELLES[mois - 1]} ${annee}`}
              onPress={() => setMoisSelectionne(mois)}
            >
              <ThemedView type="backgroundElement" style={styles.moisRow}>
                <ThemedText type="small">{MOIS_LIBELLES[mois - 1]}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  — (à venir)
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  masqueDisplayNone: {
    display: 'none',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  tabBar: {
    flexDirection: 'row',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  tabWrapper: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  // Pavé niveau 1 (Fixe/Variable) — maquette « A — Compact » (ticket #41).
  pave: {
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  paveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  paveHeaderLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  paveHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  paveAjoutButton: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // `fontVariant: ['tabular-nums']` : chiffres à chasse fixe sur les sommes
  // (pavé, ligne niveau 2, ligne niveau 3), pour qu'elles ne « sautent » pas
  // visuellement quand le montant change (voir maquette A).
  tabularNums: {
    fontVariant: ['tabular-nums'],
  },
  typesList: {
    gap: Spacing.two,
  },
  actionsMenuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  ajoutForm: {
    gap: Spacing.one,
  },
  niveau1Row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  niveau1ChipWrapper: {
    flex: 1,
  },
  niveau1Chip: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  // Ligne niveau 2 — carte imbriquée dans le pavé niveau 1 (ticket #41).
  niveau2Card: {
    gap: Spacing.one,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  niveau2Header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  niveau2HeaderLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  niveau2HeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  niveau2AjoutButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  niveau3Section: {
    paddingTop: Spacing.one,
  },
  // Ligne niveau 3 en consultation : pas de fond de carte (juste un
  // séparateur fin entre lignes, posé au cas par cas via `premiere`, voir
  // TypeDepenseNiveau3Row) — contrairement au mode édition ci-dessous.
  niveau3Row: {
    paddingLeft: Spacing.three,
  },
  niveau3RowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
  },
  niveau3Libelle: {
    flex: 1,
  },
  // Popups d'ajout (niveau 2 « Nom », niveau 3 « Nom + Montant »), popups
  // « Modifier » (même composant AjoutPopup, ticket #41 — l'édition inline
  // d'origine des lignes niveau 2/niveau 3 a été remplacée par ces popups
  // pour rester homogène avec le style des popups d'ajout), et menu
  // d'actions/confirmation de suppression (ActionsMenu, ConfirmationSuppression,
  // ticket #45 — remplacent l'ancien `Alert.alert` natif) — voir
  // docs/design/charte-graphique.md § Popups d'ajout.
  popupOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  popupCard: {
    width: '100%',
    maxWidth: 400,
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  popupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.four,
  },
  popupValiderButton: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  actionsMenuList: {
    gap: Spacing.one,
  },
  actionsMenuItem: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  anneeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  anneeChevron: {
    fontSize: 24,
    lineHeight: 28,
  },
  moisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  revenuCard: {
    gap: Spacing.one,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  revenuCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenuCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
