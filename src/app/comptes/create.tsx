import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { createCompte } from '@/db/queries/create-compte';
import { validateCompteForm, type CompteFormErrors } from '@/forms/validate-compte-form';
import { useTheme } from '@/hooks/use-theme';

export default function CreationCompteScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [nom, setNom] = useState('');
  const [banque, setBanque] = useState('');
  const [errors, setErrors] = useState<CompteFormErrors>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null);

  const handleValider = async () => {
    const erreursValidation = validateCompteForm({ nom, banque });
    setErrors(erreursValidation);

    if (Object.keys(erreursValidation).length > 0) {
      return;
    }

    setErreurEnregistrement(null);
    setEnregistrement(true);
    try {
      await createCompte(nom.trim(), banque.trim());
      router.back();
    } catch {
      setErreurEnregistrement('La création a échoué, réessayez.');
      setEnregistrement(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Nouveau compte</ThemedText>

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
          accessibilityLabel="Valider la création du compte"
          disabled={enregistrement}
          onPress={handleValider}
        >
          <ThemedView type="backgroundElement" style={styles.submitButton}>
            <ThemedText type="smallBold">
              {enregistrement ? 'Création…' : 'Créer le compte'}
            </ThemedText>
          </ThemedView>
        </Pressable>
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
});
