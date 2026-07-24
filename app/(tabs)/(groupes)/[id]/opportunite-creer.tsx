import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { useAppSelector } from '@/hooks/useRedux';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { OPPORTUNITY_TYPES, OpportunityType } from '@/types/opportunity';

export default function CreateOpportunityScreen() {
  const { id } = useLocalSearchParams();
  const { currentGroup } = useAppSelector((state) => state.groups);
  const [type, setType] = useState<OpportunityType>('prestataire');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      showError('Merci de renseigner un titre et une description');
      return;
    }

    setIsSending(true);
    try {
      await apiService.opportunities.create(Number(id), {
        type,
        title: title.trim(),
        description: description.trim(),
      });
      showSuccess('Opportunité publiée dans le groupe !');
      router.back();
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible de publier l'opportunité");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View>
          <LinearGradient
            colors={['#F59E0B', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingBottom: 28 }}
          >
            <SafeAreaView edges={['top']}>
              <View className="flex-row items-center px-5 pt-3 pb-4">
                <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2 mr-2">
                  <IconSymbol name="chevron.left" size={22} color="#fff" />
                </Pressable>
                <Text className="text-white text-lg font-bold">Publier une opportunité</Text>
              </View>
              <View className="items-center px-6">
                <View className="bg-white/15 rounded-full p-5 mb-3">
                  <IconSymbol name="lightbulb.fill" size={32} color="#fff" />
                </View>
                {currentGroup && (
                  <Text className="text-white/90 text-center text-sm">
                    Visible par tous les membres de{'\n'}
                    <Text className="font-bold">{currentGroup.name}</Text>
                  </Text>
                )}
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-base font-medium text-gray-700 dark:text-gray-300">Type d'opportunité</Text>
            <View className="flex-row flex-wrap gap-2">
              {OPPORTUNITY_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setType(t.value)}
                  className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${
                    type === t.value ? 'bg-amber-500' : 'bg-gray-100 dark:bg-gray-900'
                  }`}
                >
                  <IconSymbol name={t.icon as any} size={14} color={type === t.value ? '#fff' : '#6B7280'} />
                  <Text className={`text-sm font-semibold ${type === t.value ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextInput
            label="Titre"
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Recherche comptable pour ma société"
          />

          <View className="gap-2">
            <Text className="text-base font-medium text-gray-700 dark:text-gray-300">Description</Text>
            <View className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3.5">
              <RNTextInput
                className="text-base text-gray-900 dark:text-white"
                placeholder="Décrivez précisément votre besoin..."
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{ minHeight: 110 }}
                maxLength={1000}
              />
            </View>
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={isSending}
            className={`rounded-2xl overflow-hidden mt-2 ${isSending ? 'opacity-60' : 'active:opacity-90'}`}
          >
            <LinearGradient
              colors={['#F59E0B', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16 }}
            >
              <Text className="text-white text-center font-bold text-base">
                {isSending ? 'Publication...' : 'Publier'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
