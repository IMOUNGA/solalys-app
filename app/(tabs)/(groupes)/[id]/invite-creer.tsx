import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';

export default function CreateGuestScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [metier, setMetier] = useState('');
  const [notes, setNotes] = useState('');
  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleCreate = async () => {
    if (!firstname.trim() || !lastname.trim()) {
      showError('Prénom et nom sont requis');
      return;
    }

    setIsSending(true);
    try {
      await apiService.guests.create(groupId, {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        metier: metier.trim() || undefined,
        notes: notes.trim() || undefined,
        visitDate: visitDate ? visitDate.toISOString().split('T')[0] : undefined,
      });
      showSuccess(`${firstname.trim()} a bien été ajouté(e)`, 'Invité ajouté');
      router.back();
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible d'enregistrer cet invité");
    } finally {
      setIsSending(false);
    }
  };

  const inputClass =
    'rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3.5 text-base text-gray-900 dark:text-white';

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={['#EC4899', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingBottom: 20 }}>
          <SafeAreaView edges={['top']}>
            <View className="flex-row items-center px-5 pt-3 pb-4">
              <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2 mr-2">
                <IconSymbol name="chevron.left" size={22} color="#fff" />
              </Pressable>
              <Text className="text-white text-lg font-bold">Nouvel invité</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row gap-3">
            <View className="flex-1 gap-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</Text>
              <TextInput className={inputClass} placeholderTextColor="#9ca3af" value={firstname} onChangeText={setFirstname} maxLength={255} />
            </View>
            <View className="flex-1 gap-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom</Text>
              <TextInput className={inputClass} placeholderTextColor="#9ca3af" value={lastname} onChangeText={setLastname} maxLength={255} />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Métier (optionnel)</Text>
            <TextInput className={inputClass} placeholderTextColor="#9ca3af" value={metier} onChangeText={setMetier} maxLength={255} />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Email (optionnel)</Text>
            <TextInput
              className={inputClass}
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={255}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone (optionnel)</Text>
            <TextInput className={inputClass} placeholderTextColor="#9ca3af" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={50} />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de venue (optionnel)</Text>
            <Pressable onPress={() => setShowCalendar(true)} className={`${inputClass} flex-row items-center`}>
              <IconSymbol name="calendar" size={18} color="#9ca3af" />
              <Text className={`ml-2.5 ${visitDate ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                {visitDate ? formatDate(visitDate) : 'Choisir une date'}
              </Text>
            </Pressable>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Note (optionnel)</Text>
            <TextInput
              className={inputClass}
              placeholder="Amené par qui, à quel événement, prochaine étape..."
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={1000}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={isSending}
            className={`rounded-2xl overflow-hidden mt-2 ${isSending ? 'opacity-60' : 'active:opacity-90'}`}
          >
            <LinearGradient colors={['#EC4899', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16 }}>
              <Text className="text-white text-center font-bold text-base">
                {isSending ? 'Enregistrement...' : "Enregistrer l'invité"}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCalendar} transparent animationType="slide" onRequestClose={() => setShowCalendar(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl overflow-hidden">
            <SafeAreaView>
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <Text className="text-lg font-bold text-gray-900">Date de venue</Text>
                <Pressable onPress={() => setShowCalendar(false)}>
                  <IconSymbol name="xmark.circle.fill" size={28} color="#6B7280" />
                </Pressable>
              </View>

              <Calendar
                current={(visitDate ?? new Date()).toISOString().split('T')[0]}
                onDayPress={(day) => {
                  setVisitDate(new Date(day.timestamp));
                  setShowCalendar(false);
                }}
                markedDates={
                  visitDate
                    ? { [visitDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#8B5CF6' } }
                    : {}
                }
                theme={{
                  todayTextColor: '#8B5CF6',
                  selectedDayBackgroundColor: '#8B5CF6',
                  selectedDayTextColor: '#ffffff',
                  arrowColor: '#8B5CF6',
                }}
              />
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
