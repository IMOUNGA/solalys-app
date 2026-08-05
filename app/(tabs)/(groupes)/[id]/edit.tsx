import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, SafeAreaView, KeyboardAvoidingView, ActivityIndicator, Platform, Alert, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppDispatch } from '@/hooks/useRedux';
import { apiService } from '@/services/apiService';
import { fetchMyGroupsThunk } from '@/store/thunks/groupsThunks';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';

const MAX_SLOGAN_LENGTH = 255;
const MAX_IMAGES = 3;

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const response = await apiService.groups.getById(Number(id));
      const group = response.data;

      setExistingImages(group.images || []);
      setName(group.name || '');
      setSlogan(group.slogan || '');
      setCity(group.city || '');
      setCountry(group.country || '');
      setAddress(group.adresse || '');
      setLink(group.link || '');
    } catch (error: any) {
      showError(error.message || 'Erreur lors du chargement du groupe');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const totalImages = existingImages.length + newImages.length;

  const pickImages = async () => {
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
      const validImages = result.assets.filter((img) => {
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
      const updateData: any = {
        name: name.trim(),
        slogan: slogan.trim() || undefined,
        city: city.trim(),
        country: country.trim(),
        adresse: address.trim() || undefined,
        link: link.trim() || undefined,
      };

      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < newImages.length; i++) {
        const image = newImages[i];
        try {
          const fileType = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
          const formData = new FormData();
          formData.append('file', {
            uri: image.uri,
            name: `group-${id}-${Date.now()}-${i}.${fileType}`,
            type: `image/${fileType}`,
          } as any);
          formData.append('type', 'groups');
          formData.append('resourceId', String(id));
          formData.append('index', String(existingImages.length + i));

          const uploadResponse = await apiService.upload.image(formData);
          if (uploadResponse.data.url) {
            uploadedImageUrls.push(uploadResponse.data.url);
          }
        } catch {
          // un échec d'upload individuel ne doit pas bloquer la mise à jour du reste
        }
      }

      updateData.images = [...existingImages, ...uploadedImageUrls];

      await apiService.groups.update(Number(id), updateData);

      showSuccess('Groupe mis à jour avec succès');

      // Refresh groups list
      await dispatch(fetchMyGroupsThunk());

      router.back();
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Supprimer le groupe',
      'Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible et supprimera tous les événements associés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiService.groups.delete(Number(id));
              showSuccess('Groupe supprimé');
              await dispatch(fetchMyGroupsThunk());
              router.replace('/(tabs)/(groupes)');
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
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-gray-500 mt-4">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          {/* Header */}
          <LinearGradient
            colors={['#10B981', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="px-6 pt-4 pb-6"
          >
            <View className="flex-row items-center justify-between">
              <Pressable onPress={() => router.back()}>
                <IconSymbol name="chevron.left" size={24} color="#fff" />
              </Pressable>
              <Text className="text-white text-xl font-bold">Modifier le groupe</Text>
              <View style={{ width: 24 }} />
            </View>
          </LinearGradient>

          <View className="px-6 py-6">
            {/* Images */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                Images ({totalImages}/{MAX_IMAGES})
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {existingImages.map((uri, index) => (
                  <View key={`existing-${index}`} className="relative">
                    <Image source={{ uri }} className="w-20 h-20 rounded-xl" resizeMode="cover" />
                    <Pressable
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                      onPress={() => removeExistingImage(index)}
                    >
                      <IconSymbol name="xmark" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                {newImages.map((image, index) => (
                  <View key={`new-${index}`} className="relative">
                    <Image source={{ uri: image.uri }} className="w-20 h-20 rounded-xl" resizeMode="cover" />
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

            {/* Name */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Nom du groupe *</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={name}
                onChangeText={setName}
                placeholder="Ex: Les passionnés de randonnée"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Slogan */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-semibold">Slogan</Text>
                <Text className="text-gray-400 text-sm">
                  {slogan.length}/{MAX_SLOGAN_LENGTH}
                </Text>
              </View>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={slogan}
                onChangeText={(text) => text.length <= MAX_SLOGAN_LENGTH && setSlogan(text)}
                placeholder="Ex: Ensemble vers les sommets"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* City */}
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

            {/* Country */}
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

            {/* Address */}
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
            <View className="mb-8">
              <Text className="text-gray-700 font-semibold mb-2">Lien (site web, réseaux sociaux)</Text>
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

            {/* Buttons */}
            <View className="gap-3">
              <Pressable
                className={`py-4 px-6 rounded-xl ${isSubmitting ? 'opacity-50' : ''}`}
                onPress={handleUpdate}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#10B981', '#3B82F6']}
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
                    Supprimer le groupe
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
