import React, { useState } from 'react';
import {View, Pressable, Text, Image, ScrollView, Alert, ActivityIndicator} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToR2, isR2Configured } from '@/services/r2UploadService';
import { ImageUploadState, DEFAULT_IMAGE_CONSTRAINTS } from '@/types/image';
import { v4 as uuidv4 } from 'uuid';

type Step6PhotosProps = {
    publicationId: string; // UUID de la publication (généré dès le début du formulaire)
    images?: ImageUploadState[];
    onImagesChange?: (images: ImageUploadState[]) => void;
};

const Step6Photos = ({ publicationId, images = [], onImagesChange }: Step6PhotosProps) => {
    const [uploadingImages, setUploadingImages] = useState<ImageUploadState[]>(images);
    const [isUploading, setIsUploading] = useState(false);

    // Vérifier les permissions
    const requestPermissions = async (type: 'camera' | 'library') => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission requise',
                    'Nous avons besoin de votre permission pour accéder à la caméra.'
                );
                return false;
            }
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission requise',
                    'Nous avons besoin de votre permission pour accéder à vos photos.'
                );
                return false;
            }
        }
        return true;
    };

    // Upload une image vers R2
    const uploadImage = async (uri: string, fileName: string, index?: number): Promise<ImageUploadState> => {
        const imageId = uuidv4();
        const newImage: ImageUploadState = {
            id: imageId,
            localUri: uri,
            fileName,
            status: 'uploading',
            progress: 0,
        };

        // Ajouter l'image à l'état pendant l'upload
        setUploadingImages(prev => {
            const updated = [...prev, newImage];
            onImagesChange?.(updated);
            return updated;
        });

        try {
            // Vérifier si R2 est configuré
            if (!isR2Configured()) {
                throw new Error('R2 n\'est pas encore configuré. Veuillez configurer vos variables d\'environnement.');
            }

            // Upload vers R2 avec la nouvelle structure : images/publications/{publicationId}/photo-1.jpg
            const result = await uploadImageToR2(
                uri,
                'publications',
                publicationId,
                fileName,
                index,
                (progress) => {
                setUploadingImages(prev => {
                    const updated = prev.map(img =>
                        img.id === imageId
                            ? { ...img, progress: progress.percentage }
                            : img
                    );
                    onImagesChange?.(updated);
                    return updated;
                });
            });

            if (result.success && result.url && result.key) {
                const successImage: ImageUploadState = {
                    ...newImage,
                    status: 'success',
                    progress: 100,
                    url: result.url,
                    key: result.key,
                };

                setUploadingImages(prev => {
                    const updated = prev.map(img => img.id === imageId ? successImage : img);
                    onImagesChange?.(updated);
                    return updated;
                });

                return successImage;
            } else {
                throw new Error(result.error || 'Erreur lors de l\'upload');
            }
        } catch (error) {
            const errorImage: ImageUploadState = {
                ...newImage,
                status: 'error',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            };

            setUploadingImages(prev => {
                const updated = prev.map(img => img.id === imageId ? errorImage : img);
                onImagesChange?.(updated);
                return updated;
            });

            return errorImage;
        }
    };

    const handleAddPhotos = async () => {
        if (uploadingImages.length >= DEFAULT_IMAGE_CONSTRAINTS.maxImages) {
            Alert.alert(
                'Limite atteinte',
                `Vous ne pouvez ajouter que ${DEFAULT_IMAGE_CONSTRAINTS.maxImages} photos maximum.`
            );
            return;
        }

        const hasPermission = await requestPermissions('library');
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: DEFAULT_IMAGE_CONSTRAINTS.maxImages - uploadingImages.length,
            });

            if (!result.canceled && result.assets.length > 0) {
                setIsUploading(true);

                for (let i = 0; i < result.assets.length; i++) {
                    const asset = result.assets[i];
                    // Passer l'index basé sur le nombre d'images déjà uploadées
                    const currentIndex = uploadingImages.length + i;
                    await uploadImage(asset.uri, asset.fileName || `image-${Date.now()}.jpg`, currentIndex);
                }

                setIsUploading(false);
            }
        } catch (error) {
            setIsUploading(false);
            Alert.alert('Erreur', 'Impossible de sélectionner les photos');
            console.error('Error picking images:', error);
        }
    };

    const handleTakePhoto = async () => {
        if (uploadingImages.length >= DEFAULT_IMAGE_CONSTRAINTS.maxImages) {
            Alert.alert(
                'Limite atteinte',
                `Vous ne pouvez ajouter que ${DEFAULT_IMAGE_CONSTRAINTS.maxImages} photos maximum.`
            );
            return;
        }

        const hasPermission = await requestPermissions('camera');
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploading(true);
                const currentIndex = uploadingImages.length;
                await uploadImage(
                    result.assets[0].uri,
                    result.assets[0].fileName || `photo-${Date.now()}.jpg`,
                    currentIndex
                );
                setIsUploading(false);
            }
        } catch (error) {
            setIsUploading(false);
            Alert.alert('Erreur', 'Impossible de prendre la photo');
            console.error('Error taking photo:', error);
        }
    };

    const handleRemoveImage = (imageId: string) => {
        Alert.alert(
            'Supprimer la photo',
            'Voulez-vous vraiment supprimer cette photo ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        setUploadingImages(prev => {
                            const updated = prev.filter(img => img.id !== imageId);
                            onImagesChange?.(updated);
                            return updated;
                        });
                    },
                },
            ]
        );
    };

    const successfulImages = uploadingImages.filter(img => img.status === 'success');
    const isMinimumMet = successfulImages.length >= DEFAULT_IMAGE_CONSTRAINTS.minImages;

    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Ajoutez des photos de votre logement
                </ThemedText>
                <Text className="text-gray-600 text-sm mb-2">
                    Des photos de qualité aident les voyageurs à se projeter dans votre logement
                </Text>
                <Text className={`text-sm font-medium ${isMinimumMet ? 'text-green-600' : 'text-orange-600'}`}>
                    {successfulImages.length} / {DEFAULT_IMAGE_CONSTRAINTS.minImages} photos minimum
                    {successfulImages.length > DEFAULT_IMAGE_CONSTRAINTS.minImages &&
                        ` (max ${DEFAULT_IMAGE_CONSTRAINTS.maxImages})`}
                </Text>
            </View>

            {/* Grille des images uploadées */}
            {uploadingImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
                    <View className="flex-row gap-3">
                        {uploadingImages.map((image) => (
                            <View key={image.id} className="relative">
                                <View className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100">
                                    {image.localUri && (
                                        <Image
                                            source={{ uri: image.localUri }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    )}

                                    {/* Overlay de statut */}
                                    {image.status === 'uploading' && (
                                        <View className="absolute inset-0 bg-black/50 items-center justify-center">
                                            <ActivityIndicator color="#fff" />
                                            <Text className="text-white text-xs mt-2">
                                                {Math.round(image.progress)}%
                                            </Text>
                                        </View>
                                    )}

                                    {image.status === 'error' && (
                                        <View className="absolute inset-0 bg-red-500/50 items-center justify-center">
                                            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#fff" />
                                            <Text className="text-white text-xs mt-1">Erreur</Text>
                                        </View>
                                    )}

                                    {image.status === 'success' && (
                                        <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                            <IconSymbol name="checkmark" size={12} color="#fff" />
                                        </View>
                                    )}
                                </View>

                                {/* Bouton supprimer */}
                                <Pressable
                                    onPress={() => handleRemoveImage(image.id)}
                                    className="absolute top-1 left-1 bg-red-500 rounded-full w-6 h-6 items-center justify-center active:bg-red-600"
                                >
                                    <IconSymbol name="xmark" size={14} color="#fff" />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}

            {/* Boutons d'ajout */}
            {uploadingImages.length < DEFAULT_IMAGE_CONSTRAINTS.maxImages && (
                <View className="gap-4">
                    {/* Ajouter des photos */}
                    <Pressable
                        onPress={handleAddPhotos}
                        disabled={isUploading}
                        className={`bg-white border-2 border-gray-300 rounded-2xl p-6 ${isUploading ? 'opacity-50' : 'active:bg-gray-50'}`}
                        accessibilityLabel="Ajouter des photos depuis la galerie"
                    >
                        <View className="items-center gap-3">
                            <View className="bg-gray-100 w-16 h-16 rounded-full items-center justify-center">
                                <IconSymbol name="photo.on.rectangle" size={32} color="#000000" />
                            </View>
                            <View className="items-center">
                                <Text className="text-base font-semibold text-gray-900 mb-1">
                                    Ajouter depuis la galerie
                                </Text>
                                <Text className="text-sm text-gray-600 text-center">
                                    Sélection multiple possible
                                </Text>
                            </View>
                        </View>
                    </Pressable>

                    {/* Prendre une photo */}
                    <Pressable
                        onPress={handleTakePhoto}
                        disabled={isUploading}
                        className={`bg-white border-2 border-gray-300 rounded-2xl p-6 ${isUploading ? 'opacity-50' : 'active:bg-gray-50'}`}
                        accessibilityLabel="Prendre une photo avec la caméra"
                    >
                        <View className="items-center gap-3">
                            <View className="bg-gray-100 w-16 h-16 rounded-full items-center justify-center">
                                <IconSymbol name="camera.fill" size={32} color="#000000" />
                            </View>
                            <View className="items-center">
                                <Text className="text-base font-semibold text-gray-900 mb-1">
                                    Prendre une photo
                                </Text>
                                <Text className="text-sm text-gray-600 text-center">
                                    Utilisez votre appareil photo
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                </View>
            )}

            {/* Note d'information */}
            {!isR2Configured() && (
                <View className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <View className="flex-row gap-3">
                        <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#f97316" />
                        <View className="flex-1">
                            <Text className="text-sm text-orange-900 leading-5">
                                Configuration R2 requise : Veuillez configurer vos variables d'environnement R2 dans le fichier .env pour activer l'upload d'images.
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Conseils pour de bonnes photos */}
            {uploadingImages.length > 0 && (
                <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <View className="flex-row gap-3">
                        <IconSymbol name="lightbulb.fill" size={20} color="#3b82f6" />
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-blue-900 mb-1">
                                Conseils pour de meilleures photos
                            </Text>
                            <Text className="text-sm text-blue-800 leading-5">
                                • Utilisez la lumière naturelle{'\n'}
                                • Montrez les différentes pièces{'\n'}
                                • Prenez des photos horizontales{'\n'}
                                • Évitez les photos floues
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

export default Step6Photos;
