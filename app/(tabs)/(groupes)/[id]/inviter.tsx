import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { useAppSelector } from '@/hooks/useRedux';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function InviteMemberScreen() {
  const { id } = useLocalSearchParams();
  const { currentGroup } = useAppSelector((state) => state.groups);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const handleInvite = async () => {
    if (!isValidEmail(email)) {
      showError('Merci de saisir une adresse email valide');
      return;
    }

    setIsSending(true);
    try {
      await apiService.invitations.create(Number(id), email.trim());
      showSuccess(`Invitation envoyée à ${email.trim()}`);
      setEmail('');
      router.back();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible d\'envoyer l\'invitation');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingBottom: 28 }}
          >
            <SafeAreaView edges={['top']}>
              <View className="flex-row items-center px-5 pt-3 pb-4">
                <Pressable
                  onPress={() => router.back()}
                  className="w-9 h-9 items-center justify-center -ml-2 mr-2"
                >
                  <IconSymbol name="chevron.left" size={22} color="#fff" />
                </Pressable>
                <Text className="text-white text-lg font-bold">Inviter un membre</Text>
              </View>
              <View className="items-center px-6">
                <View className="bg-white/15 rounded-full p-5 mb-3">
                  <IconSymbol name="person.badge.plus" size={32} color="#fff" />
                </View>
                {currentGroup && (
                  <Text className="text-white/90 text-center text-sm">
                    Vous invitez quelqu'un à rejoindre{'\n'}
                    <Text className="font-bold">{currentGroup.name}</Text>
                  </Text>
                )}
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        <View className="px-5 pt-6 gap-5">
          <TextInput
            label="Adresse email"
            value={email}
            onChangeText={setEmail}
            placeholder="prenom.nom@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon="envelope.fill"
          />

          <View className="flex-row items-start gap-2 bg-violet-50 dark:bg-violet-950 rounded-xl p-3">
            <IconSymbol name="info.circle.fill" size={16} color="#8B5CF6" />
            <Text className="flex-1 text-xs text-violet-700 dark:text-violet-300 leading-4">
              Si cette personne n'a pas encore de compte Solalys, elle recevra un email l'invitant à en créer un avec cette adresse pour rejoindre le groupe.
            </Text>
          </View>

          <Pressable
            onPress={handleInvite}
            disabled={isSending}
            className={`rounded-2xl overflow-hidden mt-2 ${isSending ? 'opacity-60' : 'active:opacity-90'}`}
          >
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16 }}
            >
              <Text className="text-white text-center font-bold text-base">
                {isSending ? 'Envoi...' : "Envoyer l'invitation"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
