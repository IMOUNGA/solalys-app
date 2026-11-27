import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';
import { useSuccessAlert, useErrorAlert, useConfirmAlert, useAlert } from '@/hooks/useAlert';
import { apiService, type InviteLink } from '@/services/apiService';

const MAX_EMAILS = 50;

/** Toutes les adresses email trouvées dans un texte collé (tableur, liste, email...). */
function extractEmails(text: string): string[] {
  const found = text.match(/[^\s,;<>()"']+@[^\s,;<>()"']+\.[^\s,;<>()"']+/g) ?? [];
  return [...new Set(found.map((e) => e.trim().toLowerCase()))];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

export default function InviteMemberScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const { currentGroup } = useAppSelector((state) => state.groups);
  const [emailsText, setEmailsText] = useState('');
  const [isSending, setIsSending] = useState(false);
  // undefined : chargement ; null : pas de lien ; false : pas le droit de gérer le lien.
  const [link, setLink] = useState<InviteLink | null | undefined | false>(undefined);
  const [linkBusy, setLinkBusy] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();
  const showConfirm = useConfirmAlert();
  const { showAlert } = useAlert();

  const emails = extractEmails(emailsText);

  useEffect(() => {
    apiService.inviteLinks
      .getForGroup(groupId)
      .then((res) => setLink(res.data.link))
      // Membre simple (ou palier insuffisant) : la section du lien n'est pas affichée.
      .catch(() => setLink(false));
  }, [groupId]);

  const shareLink = async (url: string) => {
    const name = currentGroup?.name ?? 'notre groupe';
    await Share.share({ message: `Rejoignez ${name} sur Solalys : ${url}` });
  };

  const createLink = async (share: boolean) => {
    setLinkBusy(true);
    try {
      const res = await apiService.inviteLinks.regenerate(groupId);
      setLink(res.data.link);
      if (share) await shareLink(res.data.link.url);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de créer le lien');
    } finally {
      setLinkBusy(false);
    }
  };

  const confirmRegenerate = () =>
    showConfirm(
      "L'ancien lien ne fonctionnera plus. Les personnes qui l'ont déjà utilisé restent membres.",
      () => createLink(false),
      'Créer un nouveau lien ?',
      'Nouveau lien',
    );

  const confirmRevoke = () =>
    showConfirm(
      'Plus personne ne pourra rejoindre le groupe avec ce lien.',
      async () => {
        setLinkBusy(true);
        try {
          await apiService.inviteLinks.revoke(groupId);
          setLink(null);
          showSuccess('Lien désactivé');
        } catch (error: any) {
          showError(error?.response?.data?.message || 'Impossible de désactiver le lien');
        } finally {
          setLinkBusy(false);
        }
      },
      'Désactiver le lien ?',
      'Désactiver',
    );

  const handleInvite = async () => {
    if (emails.length === 0) {
      showError('Merci de saisir au moins une adresse email valide');
      return;
    }
    if (emails.length > MAX_EMAILS) {
      showError(`${MAX_EMAILS} adresses maximum par envoi (${emails.length} trouvées)`);
      return;
    }

    setIsSending(true);
    try {
      if (emails.length === 1) {
        await apiService.invitations.create(groupId, emails[0]);
        showSuccess(`Invitation envoyée à ${emails[0]}`);
        setEmailsText('');
        router.back();
        return;
      }
      const { data } = await apiService.invitations.createMany(groupId, emails);
      setEmailsText(data.skipped.map((s) => s.email).join('\n'));
      const sentLine = `${data.sent.length} invitation${data.sent.length > 1 ? 's' : ''} envoyée${data.sent.length > 1 ? 's' : ''}.`;
      if (data.skipped.length === 0) {
        showSuccess(sentLine);
        router.back();
      } else {
        const details = data.skipped
          .slice(0, 8)
          .map((s) => `• ${s.email} : ${s.reason}`)
          .join('\n');
        const more = data.skipped.length > 8 ? `\n… et ${data.skipped.length - 8} autre(s)` : '';
        showAlert({
          title: 'Envoi terminé',
          message: `${sentLine}\nNon envoyées (restées dans le champ) :\n${details}${more}`,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible d'envoyer les invitations");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <LinearGradient colors={['#2345C2', '#3A5FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingBottom: 28 }}>
            <SafeAreaView edges={['top']}>
              <View className="flex-row items-center px-5 pt-3 pb-4">
                <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2 mr-2">
                  <IconSymbol name="chevron.left" size={22} color="#fff" />
                </Pressable>
                <Text className="text-white text-lg font-bold">Inviter des membres</Text>
              </View>
              <View className="items-center px-6">
                <View className="bg-white/15 rounded-full p-5 mb-3">
                  <IconSymbol name="person.badge.plus" size={32} color="#fff" />
                </View>
                {currentGroup && (
                  <Text className="text-white/90 text-center text-sm">
                    {'Faites venir votre club dans\n'}
                    <Text className="font-bold">{currentGroup.name}</Text>
                  </Text>
                )}
              </View>
            </SafeAreaView>
          </LinearGradient>

          <View className="px-5 pt-6 gap-6">
            {/* Lien d'invitation (créateur ou président) */}
            {link === undefined && <ActivityIndicator color="#2345C2" />}
            {link !== undefined && link !== false && (
              <View className="bg-brand-50 dark:bg-brand-950 rounded-2xl p-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <IconSymbol name="link" size={16} color="#2345C2" />
                  <Text className="text-base font-bold text-gray-900 dark:text-white">{"Lien d'invitation"}</Text>
                </View>
                <Text className="text-xs text-gray-600 dark:text-gray-300 leading-4 mb-3">
                  {'Partagez-le dans le groupe WhatsApp du club : chacun rejoint en un geste, avec ou sans compte Solalys.'}
                </Text>

                {link ? (
                  <>
                    <Text selectable className="text-xs text-brand-600 dark:text-brand-300 mb-1" numberOfLines={1}>
                      {link.url}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {`Valable jusqu'au ${formatDate(link.expiresat)} · utilisé ${link.uses} fois`}
                    </Text>
                    <Pressable
                      onPress={() => shareLink(link.url)}
                      disabled={linkBusy}
                      className="rounded-xl overflow-hidden active:opacity-90"
                    >
                      <LinearGradient colors={['#2345C2', '#3A5FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 12 }}>
                        <Text className="text-white text-center font-bold">Partager le lien</Text>
                      </LinearGradient>
                    </Pressable>
                    <View className="flex-row justify-center gap-6 mt-3">
                      <Pressable onPress={confirmRegenerate} disabled={linkBusy} className="active:opacity-70">
                        <Text className="text-xs font-semibold text-brand-600 dark:text-brand-300">Nouveau lien</Text>
                      </Pressable>
                      <Pressable onPress={confirmRevoke} disabled={linkBusy} className="active:opacity-70">
                        <Text className="text-xs font-semibold text-red-500">Désactiver</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <Pressable
                    onPress={() => createLink(true)}
                    disabled={linkBusy}
                    className={`rounded-xl overflow-hidden ${linkBusy ? 'opacity-60' : 'active:opacity-90'}`}
                  >
                    <LinearGradient colors={['#2345C2', '#3A5FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 12 }}>
                      <Text className="text-white text-center font-bold">
                        {linkBusy ? 'Création...' : 'Créer et partager un lien'}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            )}

            {/* Par email : une ou plusieurs adresses */}
            <View>
              <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">Par email</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 leading-4 mb-3">
                {`Une adresse, ou toute une liste collée depuis un tableur ou un email (${MAX_EMAILS} maximum).`}
              </Text>
              <RNTextInput
                value={emailsText}
                onChangeText={setEmailsText}
                placeholder={'prenom.nom@exemple.com\nautre.membre@exemple.com'}
                placeholderTextColor="#9CA3AF"
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-gray-900 dark:text-white"
                style={{ minHeight: 110, textAlignVertical: 'top' }}
              />
              {emails.length > 1 && (
                <Text className="text-xs text-brand-600 dark:text-brand-300 mt-2">
                  {`${emails.length} adresses trouvées`}
                </Text>
              )}
            </View>

            <View className="flex-row items-start gap-2 bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
              <IconSymbol name="info.circle.fill" size={16} color="#2345C2" />
              <Text className="flex-1 text-xs text-gray-600 dark:text-gray-300 leading-4">
                {"Les personnes sans compte Solalys reçoivent un email pour en créer un avec cette adresse et rejoindre le groupe."}
              </Text>
            </View>

            <Pressable
              onPress={handleInvite}
              disabled={isSending}
              className={`rounded-2xl overflow-hidden ${isSending ? 'opacity-60' : 'active:opacity-90'}`}
            >
              <LinearGradient colors={['#2345C2', '#3A5FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16 }}>
                <Text className="text-white text-center font-bold text-base">
                  {isSending
                    ? 'Envoi...'
                    : emails.length > 1
                      ? `Envoyer ${emails.length} invitations`
                      : "Envoyer l'invitation"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
