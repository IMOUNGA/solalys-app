import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, SafeAreaView, KeyboardAvoidingView, ActivityIndicator, Platform, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppDispatch } from '@/hooks/useRedux';
import { apiService } from '@/services/apiService';
import { fetchMyEventsThunk } from '@/store/thunks/eventsThunks';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';

const MAX_IMAGES = 5;
const MAX_DESCRIPTION_LENGTH = 500;

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [link, setLink] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');

  // Images
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const response = await apiService.events.getById(Number(id));
      const event = response.data;

      setName(event.name || '');
      setDescription(event.description || '');
      setCity(event.city || '');
      setCountry(event.country || '');
      setAddress(event.adress || '');
      setLink(event.link || '');
      setMaxParticipants(event.maxParticipants ? String(event.maxParticipants) : '');
      setExistingImages(event.images || []);
    } catch (error: any) {
      showError(error.message || 'Erreur lors du chargement de l\'événement');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const totalImages = existingImages.length + newImages.length;
    if (totalImages >= MAX_IMAGES) {
      showError(`Vous ne pouvez ajouter que ${MAX_IMAGES} images maximum`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - totalImages,
    });

    if (!result.canceled && result.assets) {
      const validImages = result.assets.filter(img => {
        if (img.fileSize && img.fileSize > 10 * 1024 * 1024) {
          showError('Une ou plusieurs images dépassent 10 Mo');
          return false;
        }
        return true;
      });

      setNewImages([...newImages, ...validImages]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!name.trim() || !city.trim() || !country.trim()) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare update data
      const updateData: any = {
        name: name.trim(),
        description: description.trim(),
        city: city.trim(),
        country: country.trim(),
        adress: address.trim() || undefined,
        link: link.trim() || undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
      };

      // Upload new images if any
      const uploadedImageUrls: string[] = [];
      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          const image = newImages[i];
          const fileType = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
          const formData = new FormData();
          formData.append('file', {
            uri: image.uri,
            name: `photo-${Date.now()}-${i}.${fileType}`,
            type: `image/${fileType}`,
          } as any);
          formData.append('type', 'events');
          formData.append('resourceId', String(id));
          formData.append('index', String(existingImages.length + i));

          const uploadResponse = await apiService.upload.image(formData);
          if (uploadResponse.data.url) {
            uploadedImageUrls.push(uploadResponse.data.url);
          }
        }
      }

      // Combine existing and new images
      updateData.images = [...existingImages, ...uploadedImageUrls];

      // Update event
      await apiService.events.update(Number(id), updateData);

      showSuccess('Événement mis à jour avec succès');

      // Refresh events list
      await dispatch(fetchMyEventsThunk());

      router.back();
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiService.events.delete(Number(id));
              showSuccess('Événement supprimé');
              await dispatch(fetchMyEventsThunk());
              router.replace('/(tabs)/(events)');
            } catch (error: any) {
              showError(error.message || 'Erreur lors de la suppression');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-500 mt-4">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalImages = existingImages.length + newImages.length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          {/* Header */}
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="px-6 pt-4 pb-6"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Pressable onPress={() => router.back()}>
                <IconSymbol name="chevron.left" size={24} color="#fff" />
              </Pressable>
              <Text className="text-white text-xl font-bold">Modifier l'événement</Text>
              <View style={{ width: 24 }} />
            </View>
          </LinearGradient>

          <View className="px-6 py-6">
            {/* Name */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Nom de l'événement *</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={name}
                onChangeText={setName}
                placeholder="Ex: Pique-nique au parc"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Description */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-semibold">Description</Text>
                <Text className="text-gray-400 text-sm">
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </Text>
              </View>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={description}
                onChangeText={(text) => text.length <= MAX_DESCRIPTION_LENGTH && setDescription(text)}
                placeholder="Décrivez votre événement..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Images */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                Images ({totalImages}/{MAX_IMAGES})
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {/* Existing images */}
                {existingImages.map((uri, index) => (
                  <View key={`existing-${index}`} className="relative">
                    <Image
                      source={{ uri }}
                      className="w-20 h-20 rounded-xl"
                      resizeMode="cover"
                    />
                    <Pressable
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                      onPress={() => removeExistingImage(index)}
                    >
                      <IconSymbol name="xmark" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}

                {/* New images */}
                {newImages.map((image, index) => (
                  <View key={`new-${index}`} className="relative">
                    <Image
                      source={{ uri: image.uri }}
                      className="w-20 h-20 rounded-xl"
                      resizeMode="cover"
                    />
                    <Pressable
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                      onPress={() => removeNewImage(index)}
                    >
                      <IconSymbol name="xmark" size={12} color="#fff" />
                    </Pressable>
                    <View className="absolute bottom-1 right-1 bg-blue-500 rounded-full px-2 py-0.5">
                      <Text className="text-white text-xs font-bold">NEW</Text>
                    </View>
                  </View>
                ))}

                {/* Add button */}
                {totalImages < MAX_IMAGES && (
                  <Pressable
                    className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center active:bg-gray-200"
                    onPress={pickImages}
                  >
                    <IconSymbol name="plus" size={24} color="#6B7280" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Location */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Ville *</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={city}
                onChangeText={setCity}
                placeholder="Ex: Paris"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Pays *</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={country}
                onChangeText={setCountry}
                placeholder="Ex: France"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Adresse complète</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={address}
                onChangeText={setAddress}
                placeholder="Ex: 123 rue de la Paix"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Link */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Lien (optionnel)</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={link}
                onChangeText={setLink}
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {/* Max participants */}
            <View className="mb-8">
              <Text className="text-gray-700 font-semibold mb-2">Nombre max de participants</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                placeholder="Illimité"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
            </View>

            {/* Buttons */}
            <View className="gap-3">
              <Pressable
                className={`py-4 px-6 rounded-xl ${isSubmitting ? 'opacity-50' : ''}`}
                onPress={handleUpdate}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12 }}
                />
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center font-bold text-lg">
                    Mettre à jour
                  </Text>
                )}
              </Pressable>

              <Pressable
                className={`py-4 px-6 rounded-xl bg-red-50 ${isDeleting ? 'opacity-50' : ''}`}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#EF4444" />
                ) : (
                  <Text className="text-red-600 text-center font-bold text-lg">
                    Supprimer l'événement
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
