import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, SafeAreaView, KeyboardAvoidingView, ActivityIndicator, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppDispatch } from '@/hooks/useRedux';
import { apiService } from '@/services/apiService';
import { fetchMyGroupsThunk } from '@/store/thunks/groupsThunks';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';

const MAX_SLOGAN_LENGTH = 255;
const MAX_IMAGES = 3;

export default function CreateGroupScreen() {
  const dispatch = useAppDispatch();
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const [tierLoading, setTierLoading] = useState(true);
  const [hasPro, setHasPro] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.users.getSubscription();
        const tier = res.data?.subscriptionTier ?? 'gratuit';
        setHasPro(tier === 'pro' || tier === 'organisateur');
      } catch {
        setHasPro(false);
      } finally {
        setTierLoading(false);
      }
    })();
  }, []);

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      showError(`Vous ne pouvez ajouter que ${MAX_IMAGES} images maximum`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - images.length,
    });

    if (!result.canceled && result.assets) {
      const validImages = result.assets.filter((img) => {
        if (img.fileSize && img.fileSize > 10 * 1024 * 1024) {
          showError('Une ou plusieurs images dépassent 10 Mo');
          return false;
        }
        return true;
      });
      setImages([...images, ...validImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!name.trim() || !city.trim() || !country.trim()) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.groups.create({
        name: name.trim(),
        slogan: slogan.trim() || undefined,
        city: city.trim(),
        country: country.trim(),
        adresse: address.trim() || undefined,
        link: link.trim() || undefined,
      });
      const createdGroup = response.data;

      if (images.length > 0) {
        const uploadedImageUrls: string[] = [];
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          try {
            const fileType = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
            const formData = new FormData();
            formData.append('file', {
              uri: image.uri,
              name: `group-${createdGroup.id}-${i}.${fileType}`,
              type: `image/${fileType}`,
            } as any);
            formData.append('type', 'groups');
            formData.append('resourceId', createdGroup.id.toString());
            formData.append('index', String(i));

            const uploadResponse = await apiService.upload.image(formData);
            if (uploadResponse.data.url) {
              uploadedImageUrls.push(uploadResponse.data.url);
            }
          } catch {
            // Le groupe est déjà créé — un échec d'upload ne doit pas bloquer le flow
          }
        }

        if (uploadedImageUrls.length > 0) {
          await apiService.groups.update(createdGroup.id, { images: uploadedImageUrls });
        }
      }

      showSuccess('Groupe créé avec succès');
      await dispatch(fetchMyGroupsThunk());
      router.replace(`/(tabs)/(groupes)/${createdGroup.id}` as any);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Erreur lors de la création du groupe');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tierLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPro) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-6 pt-4 pb-2">
          <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
            <IconSymbol name="chevron.left" size={22} color="#000" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-gray-100 rounded-full p-6 mb-4">
            <IconSymbol name="lock.fill" size={36} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 font-semibold text-lg mb-1 text-center">Abonnement requis</Text>
          <Text className="text-gray-500 text-center mb-5">
            Créer un groupe nécessite un abonnement Pro ou supérieur. Vous pouvez toujours rejoindre un groupe existant sur invitation.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/(compte)/abonnement' as any)}
            className="bg-green-500 rounded-full px-5 py-3 active:opacity-80"
          >
            <Text className="text-white font-bold text-sm">Voir les offres</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1">
          <LinearGradient colors={['#10B981', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="px-6 pt-4 pb-6">
            <View className="flex-row items-center justify-between">
              <Pressable onPress={() => router.back()}>
                <IconSymbol name="chevron.left" size={24} color="#fff" />
              </Pressable>
              <Text className="text-white text-xl font-bold">Créer un groupe</Text>
              <View style={{ width: 24 }} />
            </View>
          </LinearGradient>

          <View className="px-6 py-6">
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                Images ({images.length}/{MAX_IMAGES})
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {images.map((image, index) => (
                  <View key={index} className="relative">
                    <Image source={{ uri: image.uri }} className="w-20 h-20 rounded-xl" resizeMode="cover" />
                    <Pressable
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                      onPress={() => removeImage(index)}
                    >
                      <IconSymbol name="xmark" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                {images.length < MAX_IMAGES && (
                  <Pressable
                    className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center active:bg-gray-200"
                    onPress={pickImages}
                  >
                    <IconSymbol name="plus" size={24} color="#6B7280" />
                  </Pressable>
                )}
              </View>
            </View>

            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Nom du groupe *</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={name}
                onChangeText={setName}
                placeholder="Ex: Réseau Affaires Paris"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-semibold">Slogan</Text>
                <Text className="text-gray-400 text-sm">{slogan.length}/{MAX_SLOGAN_LENGTH}</Text>
              </View>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl text-gray-900"
                value={slogan}
                onChangeText={(text) => text.length <= MAX_SLOGAN_LENGTH && setSlogan(text)}
                placeholder="Ex: Ensemble, on va plus loin"
                placeholderTextColor="#9CA3AF"
              />
            </View>

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

            <Pressable
              className={`py-4 px-6 rounded-xl overflow-hidden ${isSubmitting ? 'opacity-50' : ''}`}
              onPress={handleCreate}
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
                <Text className="text-white text-center font-bold text-lg">Créer le groupe</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
