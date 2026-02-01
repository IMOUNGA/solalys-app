import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, SafeAreaView, KeyboardAvoidingView, ActivityIndicator, Modal, Switch, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { apiService } from '@/services/apiService';
import { fetchEventsThunk } from '@/store/thunks/eventsThunks';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';

export default function CreateEventScreen() {
  const dispatch = useAppDispatch();
  const { myGroups } = useAppSelector((state) => state.groups);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [startTime, setStartTime] = useState({ hours: 14, minutes: 0 });
  const [endTime, setEndTime] = useState({ hours: 16, minutes: 0 });
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');
  const [address, setAddress] = useState('');
  const [link, setLink] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [hasLimitedSeats, setHasLimitedSeats] = useState(false);
  const [maxSeats, setMaxSeats] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const MAX_DESCRIPTION_LENGTH = 500;
  const MAX_IMAGES = 5;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time: { hours: number; minutes: number }) => {
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
  };

  const handleTimeChange = (
    type: 'start' | 'end',
    field: 'hours' | 'minutes',
    value: string
  ) => {
    // Accepter une chaîne vide pour permettre la suppression
    if (value === '') {
      if (type === 'start') {
        setStartTime((prev) => ({ ...prev, [field]: 0 }));
      } else {
        setEndTime((prev) => ({ ...prev, [field]: 0 }));
      }
      return;
    }

    const numValue = parseInt(value);

    // Valider les heures (0-23) et minutes (0-59)
    if (isNaN(numValue)) return;

    if (field === 'hours' && (numValue < 0 || numValue > 23)) return;
    if (field === 'minutes' && (numValue < 0 || numValue > 59)) return;

    if (type === 'start') {
      setStartTime((prev) => ({ ...prev, [field]: numValue }));
    } else {
      setEndTime((prev) => ({ ...prev, [field]: numValue }));
    }
  };

  const canSubmit = () => {
    const baseValid = name.trim().length > 0 && city.trim().length > 0 && country.trim().length > 0;

    // Vérifier que les heures sont valides
    const startValid = startTime.hours >= 0 && startTime.hours <= 23 && startTime.minutes >= 0 && startTime.minutes <= 59;
    const endValid = endTime.hours >= 0 && endTime.hours <= 23 && endTime.minutes >= 0 && endTime.minutes <= 59;

    // Vérifier que l'heure de fin est après l'heure de début
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;
    const timeOrderValid = endMinutes > startMinutes;

    if (!baseValid || !startValid || !endValid || !timeOrderValid) {
      return false;
    }

    if (hasLimitedSeats) {
      return maxSeats.trim().length > 0 && parseInt(maxSeats) > 0;
    }

    return true;
  };

  // Fonction pour sélectionner des images
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_IMAGES,
      });

      if (!result.canceled && result.assets) {
        // Limiter à 5 images max
        const newImages = result.assets.slice(0, MAX_IMAGES - selectedImages.length);
        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner les images');
    }
  };

  // Fonction pour retirer une image
  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    try {
      // Créer la date de début
      const startDate = new Date(date);
      startDate.setHours(startTime.hours, startTime.minutes, 0, 0);

      // Créer la date de fin
      const endDate = new Date(date);
      endDate.setHours(endTime.hours, endTime.minutes, 0, 0);

      const eventData: any = {
        name: name.trim(),
        hours: startDate.toISOString(),
        endTime: endDate.toISOString(),
        city: city.trim(),
        country: country.trim(),
      };

      if (description.trim()) {
        eventData.description = description.trim();
      }

      if (address.trim()) {
        eventData.adress = address.trim();
      }

      if (link.trim()) {
        eventData.link = link.trim();
      }

      if (selectedGroupId) {
        eventData.groupId = selectedGroupId;
      }

      if (hasLimitedSeats && maxSeats) {
        eventData.maxParticipants = parseInt(maxSeats);
      }

      const response = await apiService.events.create(eventData);
      const createdEvent = response.data;

      // Upload images if any
      const uploadedImageUrls: string[] = [];
      if (selectedImages.length > 0 && createdEvent.id) {
        for (let i = 0; i < selectedImages.length; i++) {
          const image = selectedImages[i];
          try {
            // Créer FormData pour l'upload
            const formData = new FormData();

            // Extraire l'URI et créer un objet file
            const uriParts = image.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            formData.append('file', {
              uri: image.uri,
              name: `photo-${i + 1}.${fileType}`,
              type: `image/${fileType}`,
            } as any);

            formData.append('type', 'events');
            formData.append('resourceId', createdEvent.id.toString());
            formData.append('index', i.toString());

            const uploadResponse = await apiService.upload.image(formData);
            if (uploadResponse.data.url) {
              uploadedImageUrls.push(uploadResponse.data.url);
            }
          } catch (uploadError) {
            console.error(`Error uploading image ${i + 1}:`, uploadError);
          }
        }

        // Mettre à jour l'événement avec les URLs des images
        if (uploadedImageUrls.length > 0) {
          await apiService.events.update(createdEvent.id, {
            images: uploadedImageUrls,
          });
        }
      }

      showSuccess('Événement créé avec succès !');

      // Refresh events list
      await dispatch(fetchEventsThunk({}));

      // Go back to events list
      router.back();
    } catch (error: any) {
      console.error('Error creating event:', error);
      showError(error.response?.data?.message || 'Une erreur est survenue lors de la création de l\'événement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const TimeInput = ({ label, value, onChange, isValid }: {
    label: string;
    value: { hours: number; minutes: number };
    onChange: (field: 'hours' | 'minutes', value: string) => void;
    isValid?: boolean;
  }) => {
    const showError = isValid === false;
    const borderColor = showError ? 'border-red-300' : 'border-gray-200';

    return (
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <TextInput
              value={String(value.hours).padStart(2, '0')}
              onChangeText={(text) => onChange('hours', text)}
              placeholder="14"
              keyboardType="number-pad"
              maxLength={2}
              className={`bg-gray-50 border ${borderColor} rounded-xl px-4 py-3 text-base text-center`}
              placeholderTextColor="#9CA3AF"
            />
            <Text className="text-xs text-gray-400 text-center mt-1">0-23</Text>
          </View>
          <Text className="text-xl font-bold text-gray-400">:</Text>
          <View className="flex-1">
            <TextInput
              value={String(value.minutes).padStart(2, '0')}
              onChangeText={(text) => onChange('minutes', text)}
              placeholder="00"
              keyboardType="number-pad"
              maxLength={2}
              className={`bg-gray-50 border ${borderColor} rounded-xl px-4 py-3 text-base text-center`}
              placeholderTextColor="#9CA3AF"
            />
            <Text className="text-xs text-gray-400 text-center mt-1">0-59</Text>
          </View>
        </View>
        {showError && (
          <Text className="text-xs text-red-500 mt-1">Heures invalides</Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header with solid color */}
      <View
        className="bg-blue-500"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <SafeAreaView>
          <View className="px-6 pt-4 pb-6">
            <Pressable onPress={() => router.back()} className="mb-4">
              <View className="bg-white/20 rounded-full p-2 w-10 h-10 items-center justify-center">
                <IconSymbol name="chevron.left" size={24} color="#fff" />
              </View>
            </Pressable>
            <Text className="text-white text-3xl font-bold mb-2">
              Nouvel événement
            </Text>
            <Text className="text-white/90 text-base">
              Créez un événement pour votre communauté
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Card */}
          <View
            className="bg-white rounded-3xl p-6 mb-6"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {/* Name */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Nom de l'événement *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Soirée jeux de société"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Description */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-semibold text-gray-700">
                  Description (optionnel)
                </Text>
                <Text className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </Text>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez votre événement..."
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                maxLength={MAX_DESCRIPTION_LENGTH}
                textAlignVertical="top"
              />
            </View>

            {/* Photos */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-semibold text-gray-700">
                  Photos (optionnel)
                </Text>
                <Text className="text-xs text-gray-400">
                  {selectedImages.length}/{MAX_IMAGES}
                </Text>
              </View>

              {/* Bouton ajouter des photos */}
              {selectedImages.length < MAX_IMAGES && (
                <Pressable
                  onPress={pickImages}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 active:opacity-70"
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <IconSymbol name="photo" size={20} color="#6B7280" />
                    <Text className="text-gray-600 font-medium">
                      Ajouter des photos ({MAX_IMAGES} max)
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400 text-center mt-1">
                    Max 10MB par photo
                  </Text>
                </Pressable>
              )}

              {/* Grille des images sélectionnées */}
              {selectedImages.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {selectedImages.map((image, index) => (
                    <View key={index} className="relative">
                      <Image
                        source={{ uri: image.uri }}
                        className="w-20 h-20 rounded-lg"
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                          elevation: 5,
                        }}
                      >
                        <IconSymbol name="xmark" size={12} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Date */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Date *
              </Text>
              <Pressable
                onPress={() => setShowCalendar(true)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
              >
                <IconSymbol name="calendar" size={20} color="#6B7280" />
                <Text className="text-base text-gray-900 ml-3">
                  {formatDate(date)}
                </Text>
              </Pressable>
            </View>

            {/* Start and End Time */}
            <View className="mb-5">
              <View className="flex-row gap-3 mb-2">
                <TimeInput
                  label="Heure de début *"
                  value={startTime}
                  onChange={(field, value) => handleTimeChange('start', field, value)}
                  isValid={startTime.hours >= 0 && startTime.hours <= 23 && startTime.minutes >= 0 && startTime.minutes <= 59}
                />
                <TimeInput
                  label="Heure de fin *"
                  value={endTime}
                  onChange={(field, value) => handleTimeChange('end', field, value)}
                  isValid={endTime.hours >= 0 && endTime.hours <= 23 && endTime.minutes >= 0 && endTime.minutes <= 59}
                />
              </View>
              {/* Vérification que l'heure de fin est après l'heure de début */}
              {(() => {
                const startMinutes = startTime.hours * 60 + startTime.minutes;
                const endMinutes = endTime.hours * 60 + endTime.minutes;
                return endMinutes <= startMinutes && (
                  <Text className="text-xs text-red-500 mt-1">
                    L'heure de fin doit être après l'heure de début
                  </Text>
                );
              })()}
            </View>

            {/* City */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Ville *
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Ex: Paris"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Country */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Pays *
              </Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="Ex: France"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Address (optional) */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Adresse (optionnel)
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Ex: 123 Rue de la Paix"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Link (optional) */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Lien (optionnel)
              </Text>
              <TextInput
                value={link}
                onChangeText={setLink}
                placeholder="Ex: https://example.com"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* Limited Seats */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-1">
                    Nombre de places limité
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Limitez le nombre de participants
                  </Text>
                </View>
                <Switch
                  value={hasLimitedSeats}
                  onValueChange={setHasLimitedSeats}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="#fff"
                />
              </View>
              {hasLimitedSeats && (
                <TextInput
                  value={maxSeats}
                  onChangeText={setMaxSeats}
                  placeholder="Ex: 20"
                  keyboardType="number-pad"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                  placeholderTextColor="#9CA3AF"
                />
              )}
            </View>

            {/* Group Selection (optional) */}
            {myGroups && myGroups.length > 0 && (
              <View className="mb-2">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Associer à un groupe (optionnel)
                </Text>
                <View className="gap-2">
                  <Pressable
                    onPress={() => setSelectedGroupId(null)}
                    className={`border-2 rounded-xl px-4 py-3 ${
                      selectedGroupId === null
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <Text className={`text-base ${
                      selectedGroupId === null ? 'text-blue-600 font-semibold' : 'text-gray-700'
                    }`}>
                      Aucun groupe
                    </Text>
                  </Pressable>
                  {myGroups.map((group) => (
                    <Pressable
                      key={group.id}
                      onPress={() => setSelectedGroupId(group.id)}
                      className={`border-2 rounded-xl px-4 py-3 ${
                        selectedGroupId === group.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <Text className={`text-base ${
                        selectedGroupId === group.id ? 'text-blue-600 font-semibold' : 'text-gray-700'
                      }`}>
                        {group.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View className="bg-white border-t border-gray-200 px-6 py-4">
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
            className={`py-4 px-6 rounded-2xl ${
              !canSubmit() || isSubmitting ? 'opacity-50' : 'active:opacity-80'
            }`}
          >
            <LinearGradient
              colors={!canSubmit() || isSubmitting ? ['#9CA3AF', '#9CA3AF'] : ['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
            />
            {isSubmitting ? (
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator color="#fff" />
                <Text className="text-white text-center font-bold text-lg">
                  Création...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-center font-bold text-lg">
                Créer l'événement
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl overflow-hidden">
            <SafeAreaView>
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <Text className="text-lg font-bold text-gray-900">
                  Choisir une date
                </Text>
                <Pressable onPress={() => setShowCalendar(false)}>
                  <IconSymbol name="xmark.circle.fill" size={28} color="#6B7280" />
                </Pressable>
              </View>

              {/* Calendar */}
              <Calendar
                current={date.toISOString().split('T')[0]}
                minDate={new Date().toISOString().split('T')[0]}
                onDayPress={(day) => {
                  setDate(new Date(day.timestamp));
                  setShowCalendar(false);
                }}
                markedDates={{
                  [date.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#3B82F6',
                  },
                }}
                theme={{
                  todayTextColor: '#3B82F6',
                  selectedDayBackgroundColor: '#3B82F6',
                  selectedDayTextColor: '#ffffff',
                  arrowColor: '#3B82F6',
                  monthTextColor: '#111827',
                  textMonthFontWeight: 'bold',
                  textMonthFontSize: 18,
                  textDayFontSize: 16,
                  textDayHeaderFontSize: 14,
                }}
              />

              {/* Spacer for safe area */}
              <View className="h-8" />
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
