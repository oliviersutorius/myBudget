import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getCompteQuery } from '@/db/queries/get-compte';
import { createTypeDepenseNiveau2 } from '@/db/queries/create-type-depense-niveau2';
import { createTypeDepenseNiveau3 } from '@/db/queries/create-type-depense-niveau3';
import { deleteTypeDepenseNiveau2 } from '@/db/queries/delete-type-depense-niveau2';
import { deleteTypeDepenseNiveau3 } from '@/db/queries/delete-type-depense-niveau3';
import { getTypesDepenseNiveau2Query } from '@/db/queries/get-types-depense-niveau2';
import { getTypesDepenseNiveau3Query } from '@/db/queries/get-types-depense-niveau3';
import { updateCompte } from '@/db/queries/update-compte';
import { updateTypeDepenseNiveau2 } from '@/db/queries/update-type-depense-niveau2';
import { updateTypeDepenseNiveau3 } from '@/db/queries/update-type-depense-niveau3';
import { validateCompteForm, type CompteFormErrors } from '@/forms/validate-compte-form';
import {
  validateTypeDepenseNiveau2Form,
  type TypeDepenseNiveau2FormErrors,
} from '@/forms/validate-type-depense-niveau2-form';
import {
  validateTypeDepenseNiveau3Form,
  type TypeDepenseNiveau3FormErrors,
} from '@/forms/validate-type-depense-niveau3-form';
import { useTheme } from '@/hooks/use-theme';

type Niveau1 = 'fixe' | 'variable';
type Onglet = 'infos' | 'depenses' | 'revenus' | 'budget';

type TypeDepenseNiveau2 = Awaited<ReturnType<typeof getTypesDepenseNiveau2Query>>[number];
type TypeDepenseNiveau3 = Awaited<ReturnType<typeof getTypesDepenseNiveau3Query>>[number];

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
                  <ThemedText type="small" style={styles.errorText}>
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
                  <ThemedText type="small" style={styles.errorText}>
                    {errors.banque}
                  </ThemedText>
                ) : null}
              </ThemedView>

              {erreurEnregistrement ? (
                <ThemedText type="small" style={styles.errorText}>
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
              <RevenusTab />
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

// Boutons Modifier/Supprimer partagés entre les lignes niveau 2 et niveau 3
// (même comportement, seuls les libellés accessibles diffèrent).
function LigneActionsAffichage({
  labelModifier,
  labelSupprimer,
  suppression,
  onModifier,
  onSupprimer,
}: {
  labelModifier: string;
  labelSupprimer: string;
  suppression: boolean;
  onModifier: () => void;
  onSupprimer: () => void;
}) {
  return (
    <ThemedView style={styles.typeRowActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={labelModifier} onPress={onModifier}>
        <ThemedText type="link">Modifier</ThemedText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labelSupprimer}
        disabled={suppression}
        onPress={onSupprimer}
      >
        <ThemedText type="link">{suppression ? 'Suppression…' : 'Supprimer'}</ThemedText>
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

function DepensesTab({ compteId }: { compteId: number }) {
  const { data: types } = useLiveQuery(getTypesDepenseNiveau2Query(compteId), [compteId]);
  const typesFixe = types.filter((type) => type.niveau1 === 'fixe');
  const typesVariable = types.filter((type) => type.niveau1 === 'variable');

  return (
    <ThemedView style={styles.section}>
      <Niveau1Table titre="Fixe" types={typesFixe} />
      <Niveau1Table titre="Variable" types={typesVariable} />
      <AjoutTypeNiveau2Form compteId={compteId} />
      <AjoutTypeNiveau3Form typesNiveau2={types} />
    </ThemedView>
  );
}

function Niveau1Table({ titre, types }: { titre: string; types: TypeDepenseNiveau2[] }) {
  return (
    <ThemedView style={styles.niveau1Table}>
      <ThemedText type="smallBold">{titre}</ThemedText>

      {types.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Aucun type « {titre} » pour l’instant.
        </ThemedText>
      ) : (
        <ThemedView style={styles.typesList}>
          {types.map((type) => (
            <Niveau2RowCollapsible key={type.id} item={type} />
          ))}
        </ThemedView>
      )}

      <ThemedView style={styles.totalRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Total {titre}
        </ThemedText>
        {/* La somme des montants dépend de la saisie du montant niveau 3 (ticket #9). */}
        <ThemedText type="small" themeColor="textSecondary">
          — (ticket #9)
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function AjoutTypeNiveau2Form({ compteId }: { compteId: number }) {
  const theme = useTheme();
  const [libelle, setLibelle] = useState('');
  const [niveau1, setNiveau1] = useState<Niveau1 | null>(null);
  const [errors, setErrors] = useState<TypeDepenseNiveau2FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null);

  const handleAjouter = async () => {
    const erreursValidation = validateTypeDepenseNiveau2Form({ libelle, niveau1 });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0 || niveau1 === null) {
      return;
    }

    setErreurEnregistrement(null);
    setEnregistrement(true);
    try {
      await createTypeDepenseNiveau2(compteId, libelle.trim(), niveau1);
      setLibelle('');
      setNiveau1(null);
    } catch {
      setErreurEnregistrement('L’ajout a échoué, réessayez.');
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <ThemedView style={styles.ajoutForm}>
      <ThemedText type="smallBold">Ajouter un type de dépense</ThemedText>

      <TextInput
        value={libelle}
        onChangeText={setLibelle}
        placeholder="Ex. Maison"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Libellé du nouveau type de dépense"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      {errors.libelle ? (
        <ThemedText type="small" style={styles.errorText}>
          {errors.libelle}
        </ThemedText>
      ) : null}

      <Niveau1Selector
        valeur={niveau1}
        onChanger={setNiveau1}
        accessibilityLabelPrefix="Nouveau type de dépense"
      />
      {errors.niveau1 ? (
        <ThemedText type="small" style={styles.errorText}>
          {errors.niveau1}
        </ThemedText>
      ) : null}

      {erreurEnregistrement ? (
        <ThemedText type="small" style={styles.errorText}>
          {erreurEnregistrement}
        </ThemedText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajouter un type de dépense"
        disabled={enregistrement}
        onPress={handleAjouter}
      >
        <ThemedView type="backgroundElement" style={styles.submitButton}>
          <ThemedText type="smallBold">{enregistrement ? 'Ajout…' : 'Ajouter'}</ThemedText>
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
}

function AjoutTypeNiveau3Form({ typesNiveau2 }: { typesNiveau2: TypeDepenseNiveau2[] }) {
  const theme = useTheme();
  const [libelle, setLibelle] = useState('');
  const [niveau2Id, setNiveau2Id] = useState<number | null>(null);
  const [errors, setErrors] = useState<TypeDepenseNiveau3FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null);

  // Si le parent sélectionné a été supprimé entre-temps, on ne le considère plus comme
  // sélectionné : évite de soumettre un niveau2Id devenu inexistant en base.
  const selectedNiveau2Id = typesNiveau2.some((type2) => type2.id === niveau2Id) ? niveau2Id : null;

  const handleAjouter = async () => {
    const erreursValidation = validateTypeDepenseNiveau3Form({
      libelle,
      niveau2Id: selectedNiveau2Id,
    });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0 || selectedNiveau2Id === null) {
      return;
    }

    setErreurEnregistrement(null);
    setEnregistrement(true);
    try {
      await createTypeDepenseNiveau3(selectedNiveau2Id, libelle.trim());
      setLibelle('');
      setNiveau2Id(null);
    } catch {
      setErreurEnregistrement('L’ajout a échoué, réessayez.');
    } finally {
      setEnregistrement(false);
    }
  };

  if (typesNiveau2.length === 0) {
    return (
      <ThemedView style={styles.ajoutForm}>
        <ThemedText type="smallBold">Ajouter une ligne</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Créez d’abord un type de dépense ci-dessus.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.ajoutForm}>
      <ThemedText type="smallBold">Ajouter une ligne</ThemedText>

      <ThemedView style={styles.niveau2SelectorRow}>
        {typesNiveau2.map((type2) => (
          <Pressable
            key={type2.id}
            accessibilityRole="button"
            accessibilityLabel={`Type de dépense parent : ${type2.libelle} (${LIBELLE_NIVEAU1[type2.niveau1]})`}
            onPress={() => setNiveau2Id(type2.id)}
          >
            <ThemedView
              type={selectedNiveau2Id === type2.id ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.niveau2Chip}
            >
              <ThemedText type="small">{type2.libelle}</ThemedText>
            </ThemedView>
          </Pressable>
        ))}
      </ThemedView>
      {errors.niveau2Id ? (
        <ThemedText type="small" style={styles.errorText}>
          {errors.niveau2Id}
        </ThemedText>
      ) : null}

      <TextInput
        value={libelle}
        onChangeText={setLibelle}
        placeholder="Ex. Crédit immobilier"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Libellé de la nouvelle ligne"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      {errors.libelle ? (
        <ThemedText type="small" style={styles.errorText}>
          {errors.libelle}
        </ThemedText>
      ) : null}

      {erreurEnregistrement ? (
        <ThemedText type="small" style={styles.errorText}>
          {erreurEnregistrement}
        </ThemedText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajouter une ligne"
        disabled={enregistrement}
        onPress={handleAjouter}
      >
        <ThemedView type="backgroundElement" style={styles.submitButton}>
          <ThemedText type="smallBold">{enregistrement ? 'Ajout…' : 'Ajouter'}</ThemedText>
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
}

function Niveau2RowCollapsible({ item }: { item: TypeDepenseNiveau2 }) {
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
    Alert.alert(
      'Supprimer ce type de dépense ?',
      `« ${item.libelle} » sera définitivement supprimé.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: supprimer },
      ],
    );
  };

  return (
    <>
      {edition ? (
        <ThemedView type="backgroundElement" style={styles.typeRow}>
          <TextInput
            value={libelle}
            onChangeText={setLibelle}
            accessibilityLabel={`Libellé du type de dépense ${libelleAccessible}`}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          />
          {errors.libelle ? (
            <ThemedText type="small" style={styles.errorText}>
              {errors.libelle}
            </ThemedText>
          ) : null}

          <Niveau1Selector
            valeur={niveau1}
            onChanger={setNiveau1}
            accessibilityLabelPrefix={`Type de dépense ${libelleAccessible}`}
          />
          {errors.niveau1 ? (
            <ThemedText type="small" style={styles.errorText}>
              {errors.niveau1}
            </ThemedText>
          ) : null}

          {erreur ? (
            <ThemedText type="small" style={styles.errorText}>
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
      ) : (
        <ThemedView type="backgroundElement" style={styles.typeRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${ouvert ? 'Replier' : 'Déplier'} le type de dépense ${libelleAccessible}`}
            onPress={() => {
              setOuvert((valeur) => !valeur);
              setAEteOuvert(true);
            }}
            style={styles.typeRowHeader}
          >
            <ThemedText type="smallBold">
              {ouvert ? '▾' : '▸'} {item.libelle}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {LIBELLE_NIVEAU1[item.niveau1]}
            </ThemedText>
          </Pressable>

          {erreur ? (
            <ThemedText type="small" style={styles.errorText}>
              {erreur}
            </ThemedText>
          ) : null}

          <LigneActionsAffichage
            labelModifier={`Modifier le type de dépense ${libelleAccessible}`}
            labelSupprimer={`Supprimer le type de dépense ${libelleAccessible}`}
            suppression={suppression}
            onModifier={() => setEdition(true)}
            onSupprimer={handleSupprimer}
          />
        </ThemedView>
      )}

      {aEteOuvert ? (
        <Niveau3Liste niveau2Id={item.id} niveau1Parent={item.niveau1} masque={!ouvert} />
      ) : null}
    </>
  );
}

function Niveau3Liste({
  niveau2Id,
  niveau1Parent,
  masque,
}: {
  niveau2Id: number;
  niveau1Parent: Niveau1;
  masque: boolean;
}) {
  const { data: sousTypes } = useLiveQuery(getTypesDepenseNiveau3Query(niveau2Id), [niveau2Id]);

  return (
    <ThemedView style={[styles.niveau3Section, masque ? styles.masqueDisplayNone : undefined]}>
      {sousTypes.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Aucune ligne pour l’instant.
        </ThemedText>
      ) : (
        <>
          <ThemedView style={styles.typesList}>
            {sousTypes.map((sousType) => (
              <TypeDepenseNiveau3Row
                key={sousType.id}
                item={sousType}
                niveau1Parent={niveau1Parent}
              />
            ))}
          </ThemedView>

          <ThemedView style={styles.totalRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Total
            </ThemedText>
            {/* La somme dépend de la saisie du montant niveau 3 (ticket #9). */}
            <ThemedText type="small" themeColor="textSecondary">
              — (ticket #9)
            </ThemedText>
          </ThemedView>
        </>
      )}
    </ThemedView>
  );
}

function TypeDepenseNiveau3Row({
  item,
  niveau1Parent,
}: {
  item: TypeDepenseNiveau3;
  niveau1Parent: Niveau1;
}) {
  const theme = useTheme();
  const [edition, setEdition] = useState(false);
  const [libelle, setLibelle] = useState(item.libelle);
  const [errors, setErrors] = useState<TypeDepenseNiveau3FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const libelleAccessible = `${item.libelle} (#${item.id})`;

  const handleAnnuler = () => {
    setLibelle(item.libelle);
    setErrors({});
    setErreur(null);
    setEdition(false);
  };

  const handleEnregistrer = async () => {
    const erreursValidation = validateTypeDepenseNiveau3Form({
      libelle,
      niveau2Id: item.niveau2Id,
    });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0) {
      return;
    }

    setErreur(null);
    setEnregistrement(true);
    try {
      await updateTypeDepenseNiveau3(item.id, libelle.trim());
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
      await deleteTypeDepenseNiveau3(item.id);
    } catch (error) {
      // Contrainte de clé étrangère (PRAGMA foreign_keys = ON) : dès que le
      // ticket #9 insère des montants historisés, la suppression échouera
      // tant que des montants dépendent encore de cette ligne (voir
      // delete-type-depense-niveau3.ts). Pas la peine de laisser croire
      // qu'un simple réessai suffira.
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
    Alert.alert('Supprimer cette ligne ?', `« ${item.libelle} » sera définitivement supprimée.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: supprimer },
    ]);
  };

  if (edition) {
    return (
      <ThemedView type="backgroundElement" style={styles.niveau3Row}>
        <TextInput
          value={libelle}
          onChangeText={setLibelle}
          accessibilityLabel={`Libellé de la ligne ${libelleAccessible}`}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
        />
        {errors.libelle ? (
          <ThemedText type="small" style={styles.errorText}>
            {errors.libelle}
          </ThemedText>
        ) : null}

        {erreur ? (
          <ThemedText type="small" style={styles.errorText}>
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
    <ThemedView type="backgroundElement" style={styles.niveau3Row}>
      <ThemedView style={styles.niveau3RowHeader}>
        <ThemedView style={styles.typeRowInfo}>
          <ThemedText type="small">{item.libelle}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {LIBELLE_NIVEAU1[niveau1Parent]} (hérité)
          </ThemedText>
        </ThemedView>
        {/* Le montant dépend de la saisie/historisation niveau 3 (ticket #9). */}
        <ThemedText type="small" themeColor="textSecondary">
          — (ticket #9)
        </ThemedText>
      </ThemedView>

      {erreur ? (
        <ThemedText type="small" style={styles.errorText}>
          {erreur}
        </ThemedText>
      ) : null}

      <LigneActionsAffichage
        labelModifier={`Modifier la ligne ${libelleAccessible}`}
        labelSupprimer={`Supprimer la ligne ${libelleAccessible}`}
        suppression={suppression}
        onModifier={() => setEdition(true)}
        onSupprimer={handleSupprimer}
      />
    </ThemedView>
  );
}

// Onglet placeholder : la lecture/l'écriture des revenus est le scope du
// ticket #12 ("Ajout d'un revenu sur un mois donné"). Cet onglet pose
// seulement le point d'entrée (voir ticket #34).
function RevenusTab() {
  const [formulaireDemande, setFormulaireDemande] = useState(false);

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold">Revenus</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Aucun revenu pour l’instant.
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajouter un revenu"
        onPress={() => setFormulaireDemande(true)}
      >
        <ThemedView type="backgroundElement" style={styles.submitButton}>
          <ThemedText type="smallBold">+ Ajouter un revenu</ThemedText>
        </ThemedView>
      </Pressable>

      {formulaireDemande ? (
        <ThemedText type="small" themeColor="textSecondary">
          Formulaire d’ajout à venir (ticket #12).
        </ThemedText>
      ) : null}
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
  errorText: {
    color: '#D92D20',
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
  niveau1Table: {
    gap: Spacing.two,
  },
  typesList: {
    gap: Spacing.two,
  },
  typeRow: {
    gap: Spacing.one,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  typeRowHeader: {
    gap: Spacing.half,
  },
  typeRowInfo: {
    gap: Spacing.half,
  },
  typeRowActions: {
    flexDirection: 'row',
    gap: Spacing.three,
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
  niveau2SelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  niveau2Chip: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  niveau3Section: {
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingTop: Spacing.one,
  },
  niveau3Row: {
    gap: Spacing.one,
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  niveau3RowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});
