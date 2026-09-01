import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { hexToRgba } from '@/utils/color';
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

// Icônes SVG traits (ticket #41, charte graphique §Iconographie) : jusqu'ici
// l'app se contentait de caractères Unicode (▾/▸/⋮) rendus en ThemedText —
// la maquette A retenue pour la refonte de l'onglet Dépenses exige des SVG
// (`react-native-svg`, seule dépendance ajoutée par ce ticket). Couleur
// toujours pilotée par une prop (jamais de couleur en dur ici), résolue par
// l'appelant via `useTheme()`. Rester locales à cet écran, comme le reste
// des composants de ce fichier (voir commentaire au-dessus
// d'ActionsMenuButton plus bas) : à extraire vers src/components/ le jour où
// un deuxième écran en a réellement besoin.
function ChevronIcon({
  direction,
  color,
  size = 14,
}: {
  /** 'bas' = ligne dépliée, 'droite' = ligne repliée (charte §Iconographie). */
  direction: 'bas' | 'droite';
  color: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={direction === 'bas' ? 'M5 9l7 7 7-7' : 'M9 5l7 7-7 7'}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function KebabIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx="12" cy="5" r="2" />
      <Circle cx="12" cy="12" r="2" />
      <Circle cx="12" cy="19" r="2" />
    </Svg>
  );
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

// Sélecteur Fixe/Variable réutilisé par l'édition d'un type niveau 2
// (LigneNiveau2, ticket #41) : le choix niveau1 n'est saisi qu'à l'édition
// (renommage/re-catégorisation d'un type existant) — à la création, il est
// implicite au pavé depuis lequel la popup d'ajout a été ouverte (voir
// PopupAjoutNiveau2).
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

// Reste local à cet écran (non exporté) plutôt que déplacé dans
// src/components/ : `src/app/**` est exclu de la couverture Jest (couvert
// par l'e2e Maestro à la place, voir jest.config.js), un composant partagé
// dans src/components/ ne le serait pas et exigerait ses propres tests. À
// extraire quand un deuxième écran de liste en aura vraiment besoin (voir
// docs/design/charte-graphique.md), pas avant.
type ActionMenuItem = { label: string; onPress: () => void; destructive?: boolean };

// Construit la liste de boutons d'un Alert.alert : « Annuler » toujours en
// tête, puis les actions demandées. Partagé par demanderConfirmationSuppression
// et ActionsMenuButton ci-dessous, qui sont chacun une variante (1 action
// destructive fixe / N actions arbitraires) du même Alert.alert.
function alertActions(actions: ActionMenuItem[]) {
  return [
    { text: 'Annuler', style: 'cancel' as const },
    ...actions.map(({ label, onPress, destructive }) => ({
      text: label,
      style: destructive ? ('destructive' as const) : undefined,
      onPress,
    })),
  ];
}

// Popup de confirmation partagée par les suppressions de cet écran (type de
// dépense niveau 2, niveau 3, revenu) : même forme Annuler/Supprimer
// partout, déclenchée depuis l'entrée « Supprimer » d'un ActionsMenuButton.
function demanderConfirmationSuppression(titre: string, message: string, onConfirmer: () => void) {
  Alert.alert(
    titre,
    message,
    alertActions([{ label: 'Supprimer', onPress: onConfirmer, destructive: true }]),
  );
}

// Bouton « ⋮ » ouvrant un menu natif d'actions (Modifier/Supprimer, etc.) —
// pattern établi par RevenuRow (ticket #12) et généralisé à toutes les
// listes de l'onglet Dépenses par la charte graphique (ticket #26). Glyphe
// Unicode remplacé par une icône SVG traits (KebabIcon) par la refonte
// #41 : ce composant étant partagé avec l'onglet Revenus (RevenuRow),
// le changement s'y répercute aussi — voulu, pas un effet de bord à corriger.
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
  const ouvrirActions = () => {
    Alert.alert(title, message, alertActions(actions));
  };

  return (
    <ThemedView style={styles.actionsMenuButtonRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={ouvrirActions}
        style={styles.kebabButton}
      >
        <KebabIcon color={theme.text} size={20} />
      </Pressable>
    </ThemedView>
  );
}

// Boutons Annuler/Enregistrer partagés entre les lignes niveau 2 et niveau 3
// en édition.
function LigneActionsEdition({
  labelAnnuler,
  labelEnregistrer,
  enregistrement,
  onAnnuler,
  onEnregistrer,
}: {
  labelAnnuler: string;
  labelEnregistrer: string;
  enregistrement: boolean;
  onAnnuler: () => void;
  onEnregistrer: () => void;
}) {
  return (
    <ThemedView style={styles.typeRowActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={labelAnnuler} onPress={onAnnuler}>
        <ThemedText type="link">Annuler</ThemedText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labelEnregistrer}
        disabled={enregistrement}
        onPress={onEnregistrer}
      >
        <ThemedText type="link">{enregistrement ? 'Enregistrement…' : 'Enregistrer'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

// Onglet Dépenses (refonte ticket #41, maquette A « Compact ») : 2 pavés
// niveau 1 (Fixe/Variable, non éditables, collapsables) contenant chacun ses
// lignes niveau 2 (collapsables, une somme en en-tête, jamais de ligne de
// total séparée en pied — voir le « Point résolu » du ticket), elles-mêmes
// contenant leurs lignes niveau 3 une fois dépliées. Ajout niveau 2/niveau 3
// désormais par popup (PopupAjoutNiveau2/PopupAjoutNiveau3 ci-dessous)
// plutôt que par formulaire toujours visible en pied d'onglet (ancien
// AjoutTypeNiveau2Form/AjoutTypeNiveau3Form, supprimés par ce ticket).
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

  // Popups d'ajout centralisées ici plutôt que dans chaque pavé/ligne : une
  // seule à la fois peut être ouverte, et ce composant connaît déjà
  // compteId — pas besoin de le faire redescendre jusqu'au bouton « + » qui
  // déclenche l'ouverture. `null` = fermée ; sinon porte le contexte
  // (niveau1 du pavé, ou type niveau 2 parent) nécessaire à la soumission.
  const [popupNiveau2Pour, setPopupNiveau2Pour] = useState<Niveau1 | null>(null);
  const [popupNiveau3Pour, setPopupNiveau3Pour] = useState<TypeDepenseNiveau2 | null>(null);

  return (
    <ThemedView style={styles.section}>
      <PaveNiveau1
        niveau1="fixe"
        types={typesFixe}
        total={sommeNiveau1(typesFixe)}
        montantsParType3={montantsParType3}
        sommeParNiveau2={sommeParNiveau2}
        onAjouterNiveau2={() => setPopupNiveau2Pour('fixe')}
        onAjouterNiveau3={setPopupNiveau3Pour}
      />
      <PaveNiveau1
        niveau1="variable"
        types={typesVariable}
        total={sommeNiveau1(typesVariable)}
        montantsParType3={montantsParType3}
        sommeParNiveau2={sommeParNiveau2}
        onAjouterNiveau2={() => setPopupNiveau2Pour('variable')}
        onAjouterNiveau3={setPopupNiveau3Pour}
      />

      <PopupAjoutNiveau2
        visible={popupNiveau2Pour !== null}
        compteId={compteId}
        niveau1={popupNiveau2Pour}
        onFermer={() => setPopupNiveau2Pour(null)}
      />
      <PopupAjoutNiveau3
        visible={popupNiveau3Pour !== null}
        niveau2={popupNiveau3Pour}
        onFermer={() => setPopupNiveau3Pour(null)}
      />
    </ThemedView>
  );
}

// Pavé niveau 1 (Fixe ou Variable) : non éditable (pas de renommage — les 2
// niveaux 1 sont fixes, voir docs/DOMAIN.md), collapsable en cliquant sur le
// chevron/libellé, somme + bouton « + » (popup d'ajout niveau 2) toujours
// visibles en en-tête, y compris replié (voir le « Point résolu » du
// ticket #41 : plus de ligne de total séparée en pied de section).
function PaveNiveau1({
  niveau1,
  types,
  total,
  montantsParType3,
  sommeParNiveau2,
  onAjouterNiveau2,
  onAjouterNiveau3,
}: {
  niveau1: Niveau1;
  types: TypeDepenseNiveau2[];
  total: number;
  montantsParType3: MontantsParType3;
  sommeParNiveau2: Map<number, number>;
  onAjouterNiveau2: () => void;
  onAjouterNiveau3: (item: TypeDepenseNiveau2) => void;
}) {
  const theme = useTheme();
  const [ouvert, setOuvert] = useState(true);
  // Une fois déplié au moins une fois, le contenu du pavé (liste des
  // LigneNiveau2, ou message vide) reste monté — juste masqué avec
  // `display: 'none'` au repli — plutôt que démonté (review #41) : sinon un
  // ajout/une édition niveau 2 en cours dans une ligne enfant serait perdu
  // silencieusement si l'utilisateur replie le pavé parent (toujours
  // visible, donc toujours cliquable) pendant cette édition, et rouvrir
  // redéclencherait un nouvel abonnement useLiveQuery par ligne au lieu de
  // réutiliser l'existant. `ouvert` démarre à `true`, donc `aEteOuvert` l'est
  // aussi dès le départ.
  const [aEteOuvert, setAEteOuvert] = useState(true);
  const titre = LIBELLE_NIVEAU1[niveau1];

  return (
    <ThemedView type="backgroundElement" style={styles.paveNiveau1}>
      <ThemedView style={styles.paveNiveau1Header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${ouvert ? 'Replier' : 'Déplier'} le pavé ${titre}`}
          onPress={() => {
            setOuvert((valeur) => !valeur);
            setAEteOuvert(true);
          }}
          style={styles.paveNiveau1Toggle}
        >
          <ChevronIcon direction={ouvert ? 'bas' : 'droite'} color={theme.text} size={14} />
          <ThemedText style={styles.paveNiveau1Titre}>{titre}</ThemedText>
        </Pressable>

        <ThemedView style={styles.paveNiveau1Right}>
          <ThemedText style={styles.paveNiveau1Somme}>{formatCentimesEnEuros(total)}</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ajouter un type de dépense ${titre}`}
            onPress={() => {
              // Déplie le pavé s'il était replié : sans ça, la nouvelle
              // ligne niveau 2 créée par la popup serait invisible tant que
              // l'utilisateur ne déplie pas lui-même le pavé (voir AC du
              // ticket #41 : « la nouvelle ligne apparaît dans le pavé »).
              setOuvert(true);
              setAEteOuvert(true);
              onAjouterNiveau2();
            }}
          >
            <ThemedView type="backgroundSelected" style={styles.paveNiveau1BoutonAjout}>
              <PlusIcon color={theme.text} size={16} />
            </ThemedView>
          </Pressable>
        </ThemedView>
      </ThemedView>

      {aEteOuvert ? (
        <ThemedView style={ouvert ? undefined : styles.masqueDisplayNone}>
          {types.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Aucun type « {titre} » pour l’instant.
            </ThemedText>
          ) : (
            <ThemedView style={styles.typesList}>
              {types.map((type) => (
                <LigneNiveau2
                  key={type.id}
                  item={type}
                  montantsParType3={montantsParType3}
                  sommeParNiveau2={sommeParNiveau2}
                  onAjouterNiveau3={() => onAjouterNiveau3(type)}
                />
              ))}
            </ThemedView>
          )}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

// Ligne niveau 2 (carte imbriquée dans un pavé niveau 1) : somme du couple
// niveau1/niveau2 + bouton « + » (popup d'ajout niveau 3) en en-tête,
// collapsable en cliquant sur le chevron/libellé pour révéler ses lignes
// niveau 3. Le menu « ⋮ » (Modifier/Supprimer, ActionsMenuButton) est
// réintégré ici à la demande du développeur : la maquette pixel-exacte ne
// lui laissait pas de place en en-tête, mais la spec du ticket #41 ne
// prévoyait pas explicitement de retirer cette fonctionnalité pour le
// niveau 2 (contrairement au niveau 1, marqué « non éditable ») — on
// préfère donc garder ce pattern générique/cohérent avec niveau 3 et
// Revenus plutôt que suivre la maquette au pixel près sur ce seul point.
// « + » et « ⋮ » sont placés côte à côte à droite (voir ligneNiveau2Right) :
// ça déborde légèrement de la largeur prévue par la maquette pour ce bloc,
// sans casser l'alignement chevron/libellé à gauche / somme au centre-droit.
function LigneNiveau2({
  item,
  montantsParType3,
  sommeParNiveau2,
  onAjouterNiveau3,
}: {
  item: TypeDepenseNiveau2;
  montantsParType3: MontantsParType3;
  sommeParNiveau2: Map<number, number>;
  onAjouterNiveau3: () => void;
}) {
  const theme = useTheme();
  const [ouvert, setOuvert] = useState(false);
  // Une fois dépliée au moins une fois, Niveau3Liste reste montée (juste
  // masquée avec `display: 'none'` au repli) plutôt que démontée (review
  // #41) : sinon un ajout ou une édition niveau 3 en cours (ex. « Modifier »
  // ouvert sur une sous-ligne) serait perdu silencieusement si l'utilisateur
  // tape sur l'en-tête parent — toujours visible, donc toujours cliquable —
  // pour replier la ligne pendant cette édition ; redéplier redéclencherait
  // en plus un nouvel abonnement useLiveQuery au lieu de réutiliser
  // l'existant.
  const [aEteOuvert, setAEteOuvert] = useState(false);
  // Édition (renommage/re-catégorisation fixe/variable) et suppression du
  // type niveau 2 lui-même : même logique que l'ancien Niveau2RowCollapsible
  // (avant la refonte #41), simplement réintégrée dans la nouvelle carte.
  const [edition, setEdition] = useState(false);
  const [libelle, setLibelle] = useState(item.libelle);
  const [niveau1, setNiveau1] = useState<Niveau1 | null>(item.niveau1);
  const [errors, setErrors] = useState<TypeDepenseNiveau2FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const somme = sommeParNiveau2.get(item.id) ?? 0;
  const libelleAccessible = `${item.libelle} (#${item.id})`;

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
    demanderConfirmationSuppression(
      'Supprimer ce type de dépense ?',
      `« ${item.libelle} » sera définitivement supprimé.`,
      supprimer,
    );
  };

  if (edition) {
    return (
      <ThemedView type="background" style={styles.ligneNiveau2}>
        <ThemedView style={styles.ligneNiveau2Edition}>
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

          {erreur ? (
            <ThemedText type="small" themeColor="danger">
              {erreur}
            </ThemedText>
          ) : null}

          <LigneActionsEdition
            labelAnnuler={`Annuler la modification du type de dépense ${libelleAccessible}`}
            labelEnregistrer={`Enregistrer le type de dépense ${libelleAccessible}`}
            enregistrement={enregistrement}
            onAnnuler={handleAnnuler}
            onEnregistrer={handleEnregistrer}
          />
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="background" style={styles.ligneNiveau2}>
      <ThemedView style={styles.ligneNiveau2Header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${ouvert ? 'Replier' : 'Déplier'} ${item.libelle}`}
          onPress={() => {
            setOuvert((valeur) => !valeur);
            setAEteOuvert(true);
          }}
          style={styles.ligneNiveau2Toggle}
        >
          <ChevronIcon direction={ouvert ? 'bas' : 'droite'} color={theme.text} size={14} />
          <ThemedText style={styles.ligneNiveau2Titre} numberOfLines={1}>
            {item.libelle}
          </ThemedText>
        </Pressable>

        <ThemedView style={styles.ligneNiveau2Right}>
          <ThemedText style={styles.ligneNiveau2Somme}>{formatCentimesEnEuros(somme)}</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ajouter une ligne à ${item.libelle}`}
            onPress={() => {
              // Même raison que le bouton « + » de PaveNiveau1 ci-dessus :
              // déplie la ligne pour que la nouvelle ligne niveau 3 créée
              // par la popup soit visible sans action supplémentaire.
              setOuvert(true);
              setAEteOuvert(true);
              onAjouterNiveau3();
            }}
            style={styles.ligneNiveau2BoutonAjout}
          >
            <PlusIcon color={theme.textSecondary} size={16} />
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

      {erreur ? (
        <ThemedText type="small" themeColor="danger" style={styles.ligneNiveau2Erreur}>
          {erreur}
        </ThemedText>
      ) : null}

      {aEteOuvert ? (
        <ThemedView style={ouvert ? undefined : styles.masqueDisplayNone}>
          <Niveau3Liste niveau2Id={item.id} montantsParType3={montantsParType3} />
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

function Niveau3Liste({
  niveau2Id,
  montantsParType3,
}: {
  niveau2Id: number;
  montantsParType3: MontantsParType3;
}) {
  const { data: sousTypes } = useLiveQuery(getTypesDepenseNiveau3Query(niveau2Id), [niveau2Id]);

  if (sousTypes.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.niveau3ListeVide}>
        Aucune ligne pour l’instant.
      </ThemedText>
    );
  }

  return (
    <ThemedView style={styles.niveau3Liste}>
      {sousTypes.map((sousType, index) => (
        <LigneNiveau3
          key={sousType.id}
          item={sousType}
          montant={montantsParType3.get(sousType.id) ?? null}
          premiere={index === 0}
        />
      ))}
    </ThemedView>
  );
}

function LigneNiveau3({
  item,
  montant,
  premiere,
}: {
  item: TypeDepenseNiveau3;
  /** Montant résolu au mois courant (voir DepensesTab), `null` = absente ce mois. */
  montant: number | null;
  /** Première ligne de la liste : pas de séparateur au-dessus (voir styles.ligneNiveau3 et le rendu ci-dessous). */
  premiere: boolean;
}) {
  const theme = useTheme();
  const [edition, setEdition] = useState(false);
  const [libelle, setLibelle] = useState(item.libelle);
  const [montantSaisie, setMontantSaisie] = useState('');
  const [errors, setErrors] = useState<TypeDepenseNiveau3FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
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
    // Alert.alert ne permet pas de désactiver une entrée du menu ⋮
    // individuellement (voir ActionsMenuButton, dont le `disabled` ne gate
    // que `suppression`) : on protège donc ici contre un appel concurrent à
    // un enregistrement déjà en cours sur cette même ligne (double-tap, ou
    // Modifier + Marquer absente enchaînés rapidement).
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
    demanderConfirmationSuppression(
      'Supprimer cette ligne ?',
      `« ${item.libelle} » sera définitivement supprimée.`,
      supprimer,
    );
  };

  if (edition) {
    return (
      <ThemedView type="backgroundElement" style={styles.ligneNiveau3Edition}>
        <TextInput
          value={libelle}
          onChangeText={setLibelle}
          accessibilityLabel={`Libellé de la ligne ${libelleAccessible}`}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
        />
        {errors.libelle ? (
          <ThemedText type="small" themeColor="danger">
            {errors.libelle}
          </ThemedText>
        ) : null}

        <TextInput
          value={montantSaisie}
          onChangeText={setMontantSaisie}
          placeholder="Ex. 1500"
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          accessibilityLabel={`Montant de la ligne ${libelleAccessible}`}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
        />
        {errors.montant ? (
          <ThemedText type="small" themeColor="danger">
            {errors.montant}
          </ThemedText>
        ) : null}

        {erreur ? (
          <ThemedText type="small" themeColor="danger">
            {erreur}
          </ThemedText>
        ) : null}

        <LigneActionsEdition
          labelAnnuler={`Annuler la modification de la ligne ${libelleAccessible}`}
          labelEnregistrer={`Enregistrer la ligne ${libelleAccessible}`}
          enregistrement={enregistrement}
          onAnnuler={handleAnnuler}
          onEnregistrer={handleEnregistrer}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[
        styles.ligneNiveau3Wrapper,
        premiere ? undefined : { borderTopWidth: 1, borderTopColor: theme.backgroundElement },
      ]}
    >
      <ThemedView style={styles.ligneNiveau3}>
        <ThemedText style={styles.ligneNiveau3Libelle} numberOfLines={1}>
          {item.libelle}
        </ThemedText>

        <ThemedView style={styles.ligneNiveau3Right}>
          {montant === null ? (
            <ThemedText themeColor="textSecondary" style={styles.ligneNiveau3Montant}>
              Absente ce mois
            </ThemedText>
          ) : (
            <ThemedText style={styles.ligneNiveau3Montant}>
              {formatCentimesEnEuros(montant)}
            </ThemedText>
          )}

          <ActionsMenuButton
            accessibilityLabel={`Actions pour la ligne ${libelleAccessible}`}
            title={item.libelle}
            // Alert.alert ne permet pas de désactiver une entrée individuellement
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
      </ThemedView>

      {erreur ? (
        <ThemedText type="small" themeColor="danger" style={styles.ligneNiveau3Erreur}>
          {erreur}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

// Champ de popup partagé (libellé 12px/600 textSecondary + input, voir
// docs/design/charte-graphique.md §Popups d'ajout) : les deux popups
// d'ajout ci-dessous n'ont besoin que d'un rendu de champ texte simple,
// pas de composant TextInput ad hoc chacune.
function PopupChamp({
  label,
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  erreur,
  theme,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (valeur: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  erreur?: string;
  theme: ReturnType<typeof useTheme>;
  keyboardType?: 'decimal-pad';
}) {
  return (
    <ThemedView style={styles.popupChamp}>
      <ThemedText themeColor="textSecondary" style={styles.popupChampLabel}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        accessibilityLabel={accessibilityLabel}
        style={[styles.popupInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      {erreur ? (
        <ThemedText type="small" themeColor="danger">
          {erreur}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

// Pied de popup partagé (Annuler/Ajouter, voir charte graphique) : les deux
// boutons alignés à droite, traitement neutre (pas de `primary`, voir le
// ticket #41 — la maquette A ne réserve `primary` à aucun élément de cet
// écran). Les deux boutons sont désactivés pendant `enregistrement` (review
// #41) : sans ça, un tap sur « Annuler » pendant qu'un `handleAjouter` est
// encore en vol referme la popup en donnant l'impression d'une annulation,
// alors que l'écriture DB déjà lancée ne peut pas être interrompue et se
// termine juste après — créant silencieusement la ligne malgré
// l'« annulation ».
function PopupPied({
  enregistrement,
  onAnnuler,
  onValider,
  labelAnnulerAccessible,
  labelValiderAccessible,
}: {
  enregistrement: boolean;
  onAnnuler: () => void;
  onValider: () => void;
  labelAnnulerAccessible: string;
  labelValiderAccessible: string;
}) {
  return (
    <ThemedView style={styles.popupPied}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labelAnnulerAccessible}
        disabled={enregistrement}
        onPress={onAnnuler}
        style={styles.popupAnnulerZone}
      >
        <ThemedText themeColor="textSecondary" style={styles.popupAnnulerLabel}>
          Annuler
        </ThemedText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labelValiderAccessible}
        disabled={enregistrement}
        onPress={onValider}
      >
        <ThemedView type="backgroundSelected" style={styles.popupBoutonValider}>
          <ThemedText style={styles.popupBoutonValiderLabel}>
            {enregistrement ? 'Ajout…' : 'Ajouter'}
          </ThemedText>
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
}

// Coquille commune aux deux popups d'ajout (Modal + voile + carte + entête +
// pied) : mutualise la structure jusque-là dupliquée verbatim entre
// PopupAjoutNiveau2 et PopupAjoutNiveau3 (review #41), qui ne diffèrent que
// par leurs champs (passés en `children`, via PopupChamp) et leur logique
// de soumission. Un futur correctif comportemental sur la coquille (ex. le
// fix « Annuler désactivé pendant l'enregistrement » ci-dessus, sur
// PopupPied) ne s'applique donc qu'à un seul endroit. Le voile
// d'assombrissement fixe (indépendant du thème) est porté par
// styles.popupVoile directement, voir sa définition dans le StyleSheet en
// bas de fichier — pas recalculé ici.
function Popup({
  visible,
  titre,
  sousTitre,
  enregistrement,
  erreurEnregistrement,
  onAnnuler,
  onValider,
  labelAnnulerAccessible,
  labelValiderAccessible,
  children,
}: {
  visible: boolean;
  titre: string;
  sousTitre: string;
  enregistrement: boolean;
  erreurEnregistrement: string | null;
  onAnnuler: () => void;
  onValider: () => void;
  labelAnnulerAccessible: string;
  labelValiderAccessible: string;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Même garde que le bouton Annuler de PopupPied ci-dessus (désactivé
        // pendant `enregistrement`) : le bouton retour Android déclenche
        // aussi `onRequestClose`, il doit être soumis à la même règle pour
        // ne pas rouvrir la même race (fermeture apparente pendant qu'une
        // écriture DB est encore en vol).
        if (!enregistrement) {
          onAnnuler();
        }
      }}
    >
      <View style={styles.popupVoile}>
        <ThemedView type="background" style={styles.popupCarte}>
          <ThemedView style={styles.popupEntete}>
            <ThemedText style={styles.popupTitre}>{titre}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.popupSousTitre}>
              {sousTitre}
            </ThemedText>
          </ThemedView>

          {children}

          {erreurEnregistrement ? (
            <ThemedText type="small" themeColor="danger">
              {erreurEnregistrement}
            </ThemedText>
          ) : null}

          <PopupPied
            enregistrement={enregistrement}
            onAnnuler={onAnnuler}
            onValider={onValider}
            labelAnnulerAccessible={labelAnnulerAccessible}
            labelValiderAccessible={labelValiderAccessible}
          />
        </ThemedView>
      </View>
    </Modal>
  );
}

// Popup d'ajout d'un type de dépense niveau 2 (ticket #41), ouverte depuis le
// bouton « + » d'un pavé niveau 1. Un seul champ (Nom) : le niveau 1 n'est
// jamais saisi ici, il est implicite au pavé depuis lequel la popup a été
// ouverte (contrairement à l'ancien AjoutTypeNiveau2Form, qui exposait un
// sélecteur Fixe/Variable — voir validateTypeDepenseNiveau2Form, dont la
// signature ne change pas : seul l'appel ci-dessous ne demande plus ce choix
// à l'utilisateur).
function PopupAjoutNiveau2({
  visible,
  compteId,
  niveau1,
  onFermer,
}: {
  visible: boolean;
  compteId: number;
  /** `null` tant qu'aucun pavé n'a ouvert la popup (`visible` vaut alors `false`). */
  niveau1: Niveau1 | null;
  onFermer: () => void;
}) {
  const theme = useTheme();
  const [libelle, setLibelle] = useState('');
  const [errors, setErrors] = useState<TypeDepenseNiveau2FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null);

  const fermer = () => {
    setLibelle('');
    setErrors({});
    setErreurEnregistrement(null);
    onFermer();
  };

  const handleAjouter = async () => {
    if (niveau1 === null) {
      return;
    }
    const erreursValidation = validateTypeDepenseNiveau2Form({ libelle, niveau1 });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0) {
      return;
    }

    setErreurEnregistrement(null);
    setEnregistrement(true);
    try {
      await createTypeDepenseNiveau2(compteId, libelle.trim(), niveau1);
      setEnregistrement(false);
      fermer();
    } catch {
      setErreurEnregistrement('L’ajout a échoué, réessayez.');
      setEnregistrement(false);
    }
  };

  return (
    <Popup
      visible={visible}
      titre="Ajouter un type de dépense"
      sousTitre={niveau1 ? LIBELLE_NIVEAU1[niveau1] : ''}
      enregistrement={enregistrement}
      erreurEnregistrement={erreurEnregistrement}
      onAnnuler={fermer}
      onValider={handleAjouter}
      labelAnnulerAccessible="Annuler l’ajout du type de dépense"
      labelValiderAccessible="Ajouter le type de dépense"
    >
      <PopupChamp
        label="Nom"
        value={libelle}
        onChangeText={setLibelle}
        placeholder="Ex. Logement"
        accessibilityLabel="Nom du nouveau type de dépense"
        erreur={errors.libelle}
        theme={theme}
      />
    </Popup>
  );
}

// Popup d'ajout d'une ligne niveau 3 (ticket #9, refondue par #41), ouverte
// depuis le bouton « + » d'une ligne niveau 2. Deux champs (Nom + Montant) :
// contrairement à l'ancien flux (créer la ligne, puis régler son montant a
// posteriori via le menu ⋮ → Modifier), le montant se saisit désormais dès
// la création — d'où l'appel à setMontantDepenseNiveau3 juste après
// createTypeDepenseNiveau3 ci-dessous, avec l'id retourné par l'insertion
// (`lastInsertRowId`, voir expo-sqlite : pas de `.returning()` utilisé
// ailleurs dans ce repo, on reste cohérent avec ce pattern).
function PopupAjoutNiveau3({
  visible,
  niveau2,
  onFermer,
}: {
  visible: boolean;
  /** `null` tant qu'aucune ligne niveau 2 n'a ouvert la popup (`visible` vaut alors `false`). */
  niveau2: TypeDepenseNiveau2 | null;
  onFermer: () => void;
}) {
  const theme = useTheme();
  const [libelle, setLibelle] = useState('');
  const [montant, setMontant] = useState('');
  const [errors, setErrors] = useState<TypeDepenseNiveau3FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null);
  // Id de la ligne niveau 3 déjà créée par une tentative précédente, dont
  // seul l'enregistrement du montant a échoué (review #41, écriture en 2
  // étapes non-atomique : create puis set-montant). Tant que cet id est
  // renseigné, une nouvelle tentative « Ajouter » ne rappelle plus
  // createTypeDepenseNiveau3 (qui créerait un doublon à côté de la ligne
  // déjà existante, orpheline de montant) : elle retente uniquement
  // setMontantDepenseNiveau3 sur cet id.
  const [niveau3CreeEnAttente, setNiveau3CreeEnAttente] = useState<number | null>(null);

  const fermer = () => {
    setLibelle('');
    setMontant('');
    setErrors({});
    setErreurEnregistrement(null);
    setNiveau3CreeEnAttente(null);
    onFermer();
  };

  const handleAjouter = async () => {
    if (niveau2 === null) {
      return;
    }
    // montantRequis: true — seule différence avec la validation en édition
    // (LigneNiveau3 ci-dessus) : ici le montant se saisit à la création, il
    // est donc obligatoire (voir validate-type-depense-niveau3-form.ts).
    const erreursValidation = validateTypeDepenseNiveau3Form(
      { libelle, niveau2Id: niveau2.id, montant },
      true,
    );
    setErrors(erreursValidation);

    const montantEnCentimes = parseMontantEnCentimes(montant);
    if (Object.keys(erreursValidation).length > 0 || montantEnCentimes === null) {
      return;
    }

    setErreurEnregistrement(null);
    setEnregistrement(true);
    // Copie locale de l'id en attente : évite de dépendre de l'état React
    // (non relu à jour de façon synchrone après un setState) pour décider,
    // dans le catch ci-dessous, si l'échec porte sur la création ou sur le
    // seul enregistrement du montant.
    let idPourMontant = niveau3CreeEnAttente;
    try {
      if (idPourMontant === null) {
        const resultat = await createTypeDepenseNiveau3(niveau2.id, libelle.trim());
        idPourMontant = resultat.lastInsertRowId;
        // Mémorisé dès la création réussie, avant l'écriture du montant
        // ci-dessous : si celle-ci échoue, une nouvelle tentative retente
        // uniquement setMontantDepenseNiveau3 sur cet id (voir plus haut).
        setNiveau3CreeEnAttente(idPourMontant);
      }
      await setMontantDepenseNiveau3(idPourMontant, moisCourant(), montantEnCentimes);
      setEnregistrement(false);
      fermer();
    } catch {
      setErreurEnregistrement(
        idPourMontant !== null
          ? 'La ligne a bien été créée, mais l’enregistrement du montant a échoué : retapez « Ajouter » pour réessayer juste le montant.'
          : 'L’ajout a échoué, réessayez.',
      );
      setEnregistrement(false);
    }
  };

  return (
    <Popup
      visible={visible}
      titre="Ajouter une ligne"
      sousTitre={niveau2 ? `${niveau2.libelle} · ${LIBELLE_NIVEAU1[niveau2.niveau1]}` : ''}
      enregistrement={enregistrement}
      erreurEnregistrement={erreurEnregistrement}
      onAnnuler={fermer}
      onValider={handleAjouter}
      labelAnnulerAccessible="Annuler l’ajout de la ligne"
      labelValiderAccessible="Ajouter la ligne"
    >
      <PopupChamp
        label="Nom"
        value={libelle}
        onChangeText={setLibelle}
        placeholder="Ex. Crédit immobilier"
        accessibilityLabel="Nom de la nouvelle ligne"
        erreur={errors.libelle}
        theme={theme}
      />

      <PopupChamp
        label="Montant"
        value={montant}
        onChangeText={setMontant}
        placeholder="Ex. 1500"
        keyboardType="decimal-pad"
        accessibilityLabel="Montant de la nouvelle ligne"
        erreur={errors.montant}
        theme={theme}
      />
    </Popup>
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
  // modification sur un id devenu inexistant.
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

  const confirmerSuppression = () => {
    demanderConfirmationSuppression(
      'Supprimer ce revenu ?',
      `« ${revenu.libelle} » sera définitivement supprimé.`,
      supprimer,
    );
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
              { label: 'Supprimer', onPress: confirmerSuppression, destructive: true },
            ]}
          />
        </ThemedView>
      </ThemedView>

      {erreur ? (
        <ThemedText type="small" themeColor="danger">
          {erreur}
        </ThemedText>
      ) : null}
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
  typesList: {
    gap: Spacing.two,
  },
  // Utilisé uniquement par LigneActionsEdition (2 boutons Annuler/Enregistrer,
  // espacés). ActionsMenuButton porte son propre style d'alignement
  // (actionsMenuButtonRow) — ne pas réutiliser ce style-ci pour lui, voir le
  // bug corrigé en review #26 (les deux partageaient ce style, l'un des deux
  // en pâtissait à chaque changement de l'autre).
  typeRowActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionsMenuButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  ajoutForm: {
    gap: Spacing.one,
  },
  // --- Onglet Dépenses, maquette A « Compact » (ticket #41) ---------------
  // Pavé niveau 1 (Fixe/Variable) : valeurs pixel-exactes de la maquette,
  // hors échelle Spacing quand celle-ci n'a pas d'équivalent (44, 10…) — voir
  // le contexte du ticket, ces valeurs ont été validées sur maquette.
  paveNiveau1: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  paveNiveau1Header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  paveNiveau1Toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 44,
    flexShrink: 1,
  },
  paveNiveau1Titre: {
    fontSize: 17,
    fontWeight: '700',
  },
  paveNiveau1Right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  paveNiveau1Somme: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  paveNiveau1BoutonAjout: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ligne niveau 2 (carte imbriquée dans un pavé niveau 1).
  ligneNiveau2: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Spacing.half,
  },
  ligneNiveau2Header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  ligneNiveau2Toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 44,
    flexShrink: 1,
  },
  ligneNiveau2Titre: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  ligneNiveau2Right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  ligneNiveau2Somme: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  // Icône seule, pas de fond (contrairement à paveNiveau1BoutonAjout) : voir
  // charte graphique §Popups d'ajout / maquette A.
  ligneNiveau2BoutonAjout: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Formulaire d'édition (Modifier, via le menu ⋮ réintégré — voir le
  // commentaire au-dessus de LigneNiveau2) : remplace l'en-tête le temps de
  // l'édition, même structure que l'ancien Niveau2RowCollapsible.
  ligneNiveau2Edition: {
    gap: Spacing.one,
    padding: Spacing.one,
  },
  ligneNiveau2Erreur: {
    paddingTop: Spacing.one,
  },
  // Sélecteur Fixe/Variable (Niveau1Selector), utilisé uniquement en édition
  // d'un type niveau 2 — jamais à la création (voir PopupAjoutNiveau2).
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
  // Lignes niveau 3 : indentation sous leur ligne niveau 2 parente.
  niveau3Liste: {
    paddingLeft: 20,
  },
  niveau3ListeVide: {
    paddingLeft: 20,
    paddingTop: Spacing.one,
  },
  ligneNiveau3Wrapper: {
    // Le séparateur (borderTopWidth/borderTopColor, couleur du thème donc
    // non statique) est appliqué inline sur ce style par LigneNiveau3, pas
    // ici — voir son rendu.
  },
  ligneNiveau3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: Spacing.two,
  },
  ligneNiveau3Libelle: {
    fontSize: 13.5,
    fontWeight: '400',
    flexShrink: 1,
  },
  ligneNiveau3Right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  ligneNiveau3Montant: {
    fontSize: 13.5,
    fontVariant: ['tabular-nums'],
  },
  ligneNiveau3Erreur: {
    paddingBottom: Spacing.one,
  },
  ligneNiveau3Edition: {
    gap: Spacing.one,
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  // Zone tactile 44×44 partagée par ActionsMenuButton (⋮) : icône seule, pas
  // de fond (voir charte graphique §Iconographie).
  kebabButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- Popups d'ajout (niveau 2 « Nom », niveau 3 « Nom + Montant ») -------
  // Traitement neutre commun aux deux popups (voir charte graphique
  // §Popups d'ajout, composant Popup ci-dessus) : voile fixe + carte
  // centrée. Le voile est volontairement fixe quel que soit le thème actif
  // (toujours sombre, contrairement aux autres couleurs de cet écran) :
  // backgroundColor calculé une seule fois ici, via hexToRgba(
  // Colors.light.text, 0.5) plutôt que recopié en dur, pour respecter la
  // règle « aucune couleur en dur » — review #41 : c'était auparavant
  // recalculé inline et dupliqué dans les deux popups.
  popupVoile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    backgroundColor: hexToRgba(Colors.light.text, 0.5),
  },
  popupCarte: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Spacing.three,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 14,
    // Ombre portée légère (voir spec de la popup) : propriétés iOS +
    // `elevation` pour l'équivalent Android, pas de librairie dédiée pour un
    // effet aussi simple.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  // Titre + sous-titre groupés dans un même bloc à gap serré : le gap: 14 du
  // popupCarte parent s'applique entre ce bloc, les champs et le pied de
  // popup, pas à l'intérieur du bloc lui-même.
  popupEntete: {
    gap: Spacing.half,
  },
  popupTitre: {
    fontSize: 16,
    fontWeight: '700',
  },
  popupSousTitre: {
    fontSize: 12,
  },
  popupChamp: {
    gap: Spacing.half,
  },
  popupChampLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  popupInput: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 11,
    fontSize: 16,
  },
  popupPied: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 20,
  },
  popupAnnulerZone: {
    minHeight: 44,
    justifyContent: 'center',
  },
  popupAnnulerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  popupBoutonValider: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
    paddingVertical: 11,
    paddingHorizontal: Spacing.four,
  },
  popupBoutonValiderLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  // --------------------------------------------------------------------------
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
