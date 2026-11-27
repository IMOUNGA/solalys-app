import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { useErrorAlert, useSuccessAlert } from '@/hooks/useAlert';
import { apiService, type InviteLinkPreview } from '@/services/apiService';
import { fetchMyGroupsThunk } from '@/store/thunks/groupsThunks';
import { clearPostAuthRedirect, setPostAuthRedirect } from '@/lib/postAuthRedirect';

/**
 * Ouvert par le lien universel https://solalys.com/rejoindre/<jeton> (ou
 * solalysapp://rejoindre/<jeton>) : aperçu du groupe, puis adhésion en un
 * geste. Sans compte, on passe par l'inscription puis on revient ici.
 */
export default function JoinGroupScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [preview, setPreview] = useState<InviteLinkPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const showError = useErrorAlert();
  const showSuccess = useSuccessAlert();

  useEffect(() => {
    if (!token) return;
    apiService.inviteLinks
      .preview(String(token))
      .then((res) => setPreview(res.data))
      .catch((err) => {
        clearPostAuthRedirect();
        setError(err?.response?.data?.message || "Ce lien d'invitation n'est plus valide.");
      });
  }, [token, user?.id]);

  const goToGroup = (groupId: number) => {
    clearPostAuthRedirect();
    router.replace(`/(tabs)/(groupes)/${groupId}` as any);
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await apiService.inviteLinks.join(String(token));
      dispatch(fetchMyGroupsThunk());
      showSuccess(res.data.message);
      goToGroup(res.data.groupId);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Impossible de rejoindre le groupe');
    } finally {
      setJoining(false);
    }
  };

  const goToAuth = (screen: 'sign-up' | 'sign-in') => {
    setPostAuthRedirect(`/rejoindre/${token}`);
    router.push(`/(auth)/${screen}` as any);
  };

  const later = () => {
    clearPostAuthRedirect();
    router.replace('/(tabs)/(trouver)' as any);
  };

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="link" size={40} color="#9CA3AF" />
          <Text className="text-lg font-bold text-gray-900 dark:text-white mt-4 text-center">{error}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            {"Demandez un nouveau lien à la personne qui vous l'a envoyé."}
          </Text>
          <Pressable onPress={later} className="mt-6 px-6 py-3 rounded-xl bg-brand active:opacity-80">
            <Text className="text-white font-semibold">{"Découvrir Solalys"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!preview) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2345C2" />
        </View>
      </SafeAreaView>
    );
  }

  const { group, isMember } = preview;
  const cover = group.images?.[0];

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      {cover ? (
        <Image source={{ uri: cover }} style={{ width: '100%', height: 260 }} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#2345C2', '#3A5FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 260, alignItems: 'center', justifyContent: 'center' }}>
          <View className="bg-white/15 rounded-full p-6">
            <IconSymbol name="person.2.fill" size={40} color="#fff" />
          </View>
        </LinearGradient>
      )}

      <View className="flex-1 px-6 pt-6" style={{ marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <Text className="text-sm font-semibold text-brand-600 dark:text-brand-300 mb-1">
          {'Vous êtes invité(e) à rejoindre'}
        </Text>
        <Text className="text-3xl font-extrabold text-gray-900 dark:text-white">{group.name}</Text>
        {group.slogan ? (
          <Text className="text-base italic text-gray-500 dark:text-gray-400 mt-1">{`« ${group.slogan} »`}</Text>
        ) : null}
        <Text className="text-sm text-gray-600 dark:text-gray-300 mt-3">
          {`${group.city}, ${group.country} · ${group.memberCount} membre${group.memberCount > 1 ? 's' : ''}`}
        </Text>

        <View className="mt-auto pb-10 gap-3">
          {user ? (
            isMember ? (
              <Pressable onPress={() => goToGroup(group.id)} className="rounded-2xl bg-brand py-4 active:opacity-90">
                <Text className="text-white text-center font-bold text-base">{'Vous êtes déjà membre : voir le groupe'}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleJoin} disabled={joining} className={`rounded-2xl overflow-hidden ${joining ? 'opacity-60' : 'active:opacity-90'}`}>
                <LinearGradient colors={['#2345C2', '#3A5FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16 }}>
                  <Text className="text-white text-center font-bold text-base">{joining ? 'Un instant...' : 'Rejoindre le groupe'}</Text>
                </LinearGradient>
              </Pressable>
            )
          ) : (
            <>
              <Pressable onPress={() => goToAuth('sign-up')} className="rounded-2xl overflow-hidden active:opacity-90">
                <LinearGradient colors={['#2345C2', '#3A5FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16 }}>
                  <Text className="text-white text-center font-bold text-base">{'Créer mon compte et rejoindre'}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => goToAuth('sign-in')} className="rounded-2xl border border-gray-200 dark:border-gray-800 py-4 active:opacity-80">
                <Text className="text-center font-semibold text-gray-900 dark:text-white">{"J'ai déjà un compte"}</Text>
              </Pressable>
            </>
          )}
          <Pressable onPress={later} className="py-2 active:opacity-70">
            <Text className="text-center text-sm text-gray-500 dark:text-gray-400">Plus tard</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
