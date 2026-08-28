import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

type TypeDepenseNiveau2 = Awaited<ReturnType<typeof getTypesDepenseNiveau2Query>>[number];
type TypeDepenseNiveau3 = Awaited<ReturnType<typeof getTypesDepenseNiveau3Query>>[number];

const LIBELLE_NIVEAU1: Record<Niveau1, string> = {
  fixe: 'Fixe',
  variable: 'Variable',
};

export default function EditionCompteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const compteId = Number(id);
  const router = useRouter();
  const theme = useTheme();

  const [chargement, setChargement] = useState(true);
  const [introuvable, setIntrouvable] = useState(false);
  const [nom, setNom] = useState('');
  const [banque, setBanque] = useState('');
  const [errors, setErrors] = useState<CompteFormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null);

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
    setEnregistrement(true);
    try {
      await updateCompte(compteId, nom.trim(), banque.trim());
      router.back();
    } catch {
      setErreurEnregistrement('La sauvegarde a échoué, réessayez.');
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
          <ThemedText type="title">Édition du compte</ThemedText>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Nom</ThemedText>
            <TextInput
              value={nom}
              onChangeText={setNom}
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
              onChangeText={setBanque}
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

          <TypesDepenseNiveau2Section compteId={compteId} />
        </ScrollView>
      </SafeAreaView>
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

function TypesDepenseNiveau2Section({ compteId }: { compteId: number }) {
  const theme = useTheme();
  const { data: types } = useLiveQuery(getTypesDepenseNiveau2Query(compteId), [compteId]);

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
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold">Types de dépenses</ThemedText>

      {types.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Aucun type de dépense pour l’instant.
        </ThemedText>
      ) : (
        <ThemedView style={styles.typesList}>
          {types.map((type) => (
            <TypeDepenseNiveau2Row key={type.id} item={type} />
          ))}
        </ThemedView>
      )}

      <ThemedView style={styles.ajoutForm}>
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
    </ThemedView>
  );
}

function TypeDepenseNiveau2Row({ item }: { item: TypeDepenseNiveau2 }) {
  const theme = useTheme();
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

  if (edition) {
    return (
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

        <ThemedView style={styles.typeRowActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Annuler la modification du type de dépense ${libelleAccessible}`}
            onPress={handleAnnuler}
          >
            <ThemedText type="link">Annuler</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Enregistrer le type de dépense ${libelleAccessible}`}
            disabled={enregistrement}
            onPress={handleEnregistrer}
          >
            <ThemedText type="link">
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.typeRow}>
      <ThemedView style={styles.typeRowInfo}>
        <ThemedText type="smallBold">{item.libelle}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {LIBELLE_NIVEAU1[item.niveau1]}
        </ThemedText>
      </ThemedView>

      {erreur ? (
        <ThemedText type="small" style={styles.errorText}>
          {erreur}
        </ThemedText>
      ) : null}

      <ThemedView style={styles.typeRowActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Modifier le type de dépense ${libelleAccessible}`}
          onPress={() => setEdition(true)}
        >
          <ThemedText type="link">Modifier</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Supprimer le type de dépense ${libelleAccessible}`}
          disabled={suppression}
          onPress={handleSupprimer}
        >
          <ThemedText type="link">{suppression ? 'Suppression…' : 'Supprimer'}</ThemedText>
        </Pressable>
      </ThemedView>

      <TypesDepenseNiveau3Section niveau2Id={item.id} niveau1Parent={item.niveau1} />
    </ThemedView>
  );
}

function TypesDepenseNiveau3Section({
  niveau2Id,
  niveau1Parent,
}: {
  niveau2Id: number;
  niveau1Parent: Niveau1;
}) {
  const theme = useTheme();
  const { data: sousTypes } = useLiveQuery(getTypesDepenseNiveau3Query(niveau2Id), [niveau2Id]);

  const [libelle, setLibelle] = useState('');
  const [errors, setErrors] = useState<TypeDepenseNiveau3FormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null);

  const handleAjouter = async () => {
    const erreursValidation = validateTypeDepenseNiveau3Form({ libelle });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0) {
      return;
    }

    setErreurEnregistrement(null);
    setEnregistrement(true);
    try {
      await createTypeDepenseNiveau3(niveau2Id, libelle.trim());
      setLibelle('');
    } catch {
      setErreurEnregistrement('L’ajout a échoué, réessayez.');
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <ThemedView style={styles.niveau3Section}>
      {sousTypes.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Aucune ligne pour l’instant.
        </ThemedText>
      ) : (
        <ThemedView style={styles.typesList}>
          {sousTypes.map((sousType) => (
            <TypeDepenseNiveau3Row
              key={sousType.id}
              item={sousType}
              niveau1Parent={niveau1Parent}
            />
          ))}
        </ThemedView>
      )}

      <ThemedView style={styles.ajoutForm}>
        <TextInput
          value={libelle}
          onChangeText={setLibelle}
          placeholder="Ex. Crédit immobilier"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Libellé de la nouvelle ligne"
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
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
          <ThemedView type="backgroundSelected" style={styles.submitButtonSmall}>
            <ThemedText type="small">{enregistrement ? 'Ajout…' : 'Ajouter une ligne'}</ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>
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
    const erreursValidation = validateTypeDepenseNiveau3Form({ libelle });
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

  const handleSupprimer = () => {
    Alert.alert('Supprimer cette ligne ?', `« ${item.libelle} » sera définitivement supprimée.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setErreur(null);
          setSuppression(true);
          try {
            await deleteTypeDepenseNiveau3(item.id);
          } catch {
            setErreur('La suppression a échoué, réessayez.');
            setSuppression(false);
          }
        },
      },
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

        <ThemedView style={styles.typeRowActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Annuler la modification de la ligne ${libelleAccessible}`}
            onPress={handleAnnuler}
          >
            <ThemedText type="link">Annuler</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Enregistrer la ligne ${libelleAccessible}`}
            disabled={enregistrement}
            onPress={handleEnregistrer}
          >
            <ThemedText type="link">
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.niveau3Row}>
      <ThemedView style={styles.typeRowInfo}>
        <ThemedText type="small">{item.libelle}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {LIBELLE_NIVEAU1[niveau1Parent]} (hérité)
        </ThemedText>
      </ThemedView>

      {erreur ? (
        <ThemedText type="small" style={styles.errorText}>
          {erreur}
        </ThemedText>
      ) : null}

      <ThemedView style={styles.typeRowActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Modifier la ligne ${libelleAccessible}`}
          onPress={() => setEdition(true)}
        >
          <ThemedText type="link">Modifier</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Supprimer la ligne ${libelleAccessible}`}
          disabled={suppression}
          onPress={handleSupprimer}
        >
          <ThemedText type="link">{suppression ? 'Suppression…' : 'Supprimer'}</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  submitButtonSmall: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  section: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  typesList: {
    gap: Spacing.two,
  },
  typeRow: {
    gap: Spacing.one,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  typeRowInfo: {
    gap: Spacing.half,
  },
  typeRowActions: {
    flexDirection: 'row',
    gap: Spacing.three,
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
});
