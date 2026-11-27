import { Redirect } from 'expo-router';
import { useAppSelector } from '@/hooks/useRedux';

/**
 * Ouvert par le lien universel https://solalys.com/invitation (email
 * d'invitation) : invitations reçues si connecté, sinon connexion/inscription.
 */
export default function InvitationLink() {
  const { user } = useAppSelector((state) => state.auth);
  return <Redirect href={user ? '/(tabs)/(groupes)/invitations' : '/(auth)'} />;
}
