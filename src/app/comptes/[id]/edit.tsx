import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getCompteQuery } from '@/db/queries/get-compte';
import { updateCompte } from '@/db/queries/update-compte';
import { validateCompteForm, type CompteFormErrors } from '@/forms/validate-compte-form';
import { useTheme } from '@/hooks/use-theme';

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
        <ThemedText type="title">Édition du compte</ThemedText>

        <ThemedView style={styles.field}>
          <ThemedText type="smallBold">Nom</ThemedText>
          <TextInput
            value={nom}
            onChangeText={setNom}
            placeholder="Ex. Compte courant"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Nom du compte"
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
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
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
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

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">Types de dépenses</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Gestion des types de dépenses de ce compte à venir (ticket #7).
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
    gap: Spacing.one,
    paddingTop: Spacing.three,
  },
});
