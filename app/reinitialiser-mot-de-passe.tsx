import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Ouvert par le lien universel https://solalys.com/reinitialiser-mot-de-passe?token=…
 * (email « mot de passe oublié ») : renvoie vers l'écran de l'app.
 */
export default function ResetPasswordLink() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  return <Redirect href={{ pathname: '/(auth)/reset-password', params: token ? { token } : {} }} />;
}
