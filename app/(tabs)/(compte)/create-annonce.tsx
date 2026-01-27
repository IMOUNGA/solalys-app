import React, {useState, useEffect} from 'react';
import {View, Modal, Pressable, Text, Alert} from "react-native";
import {router} from "expo-router";
import {v4 as uuidv4} from 'uuid';
import {usePublicationDraft, PublicationDraft} from '@/hooks/usePublicationDraft';
import ScreenScroll from "@/components/ux/ScreenScroll";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";
import {ImageUploadState, DEFAULT_IMAGE_CONSTRAINTS} from "@/types/image";
import Step1PropertyType, {PropertyType} from "@/components/formulaire/Step1PropertyType";
import Step2AccommodationType, {AccommodationType} from "@/components/formulaire/Step2AccommodationType";
import Step3Address, {AddressData} from "@/components/formulaire/Step3Address";
import Step4Details, {DetailsData} from "@/components/formulaire/Step4Details";
import Step5Equipments, {EquipmentsData} from "@/components/formulaire/Step5Equipments";
import Step6Photos from "@/components/formulaire/Step6Photos";
import Step7Title from "@/components/formulaire/Step7Title";
import Step8Description from "@/components/formulaire/Step8Description";
import Step9FullDescription from "@/components/formulaire/Step9FullDescription";
import Step10WeekPrice from "@/components/formulaire/Step10WeekPrice";
import Step11WeekendPrice from "@/components/formulaire/Step11WeekendPrice";
import Step12Security, {SecurityData} from "@/components/formulaire/Step12Security";
import Step13HostInfo, {HostInfoData} from "@/components/formulaire/Step13HostInfo";
import Step14Confirmation from "@/components/formulaire/Step14Confirmation";

const CreateAnnonceScreen = () => {
    // Hook pour gérer les brouillons
    const { saveDraft, loadDraft, deleteDraft, listDrafts, markAsPublished } = usePublicationDraft();

    // Générer un UUID unique pour la publication dès le début du formulaire
    const [publicationId] = useState(() => uuidv4());

    const [isCheckingDrafts, setIsCheckingDrafts] = useState(true); // Loading au démarrage
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [availableDrafts, setAvailableDrafts] = useState<PublicationDraft[]>([]);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType>(null);
    const [selectedAccommodationType, setSelectedAccommodationType] = useState<AccommodationType>(null);
    const [addressData, setAddressData] = useState<AddressData>({
        batiment: '',
        appartement: '',
        residence: '',
        etage: '',
        nomBatiment: '',
        numeroVoie: '',
        codePostal: '',
        commune: ''
    });
    const [detailsData, setDetailsData] = useState<DetailsData>({
        voyageurs: 1,
        chambres: 0,
        lits: 0,
        sallesDeBain: 0
    });
    const [equipmentsData, setEquipmentsData] = useState<EquipmentsData>({
        essentiels: [],
        horsCommun: [],
        access: [],
        securite: []
    });
    const [title, setTitle] = useState('');
    const [selectedDescriptions, setSelectedDescriptions] = useState<string[]>([]);
    const [fullDescription, setFullDescription] = useState('');
    const [weekPrice, setWeekPrice] = useState('');
    const [weekendPrice, setWeekendPrice] = useState('');
    const [securityData, setSecurityData] = useState<SecurityData>({
        cameras: false,
        noiseSensors: false,
        weapons: false,
        dangerousAnimals: false
    });
    const [hostInfo, setHostInfo] = useState<HostInfoData>({
        address: '',
        postalCode: '',
        city: '',
        isCompany: false
    });
    const [images, setImages] = useState<ImageUploadState[]>([]);

    // Charger les brouillons au démarrage
    useEffect(() => {
        const checkForDrafts = async () => {
            try {
                const drafts = await listDrafts();
                const draftsList = drafts.filter(d => d.status === 'draft');

                if (draftsList.length > 0) {
                    // On a des brouillons → Afficher la modale de brouillon
                    setAvailableDrafts(draftsList);
                    setShowDraftModal(true);
                    setShowInstructionsModal(false);
                } else {
                    // Pas de brouillons → Afficher les instructions
                    setShowInstructionsModal(true);
                    setShowDraftModal(false);
                }
            } catch (error) {
                console.error('Erreur lors de la vérification des brouillons:', error);
                // En cas d'erreur, afficher les instructions
                setShowInstructionsModal(true);
            } finally {
                // Terminé, arrêter le loading
                setIsCheckingDrafts(false);
            }
        };

        checkForDrafts();
    }, []);

    // Auto-save à chaque changement important
    useEffect(() => {
        // Ne pas sauvegarder si on est à l'étape 1 et aucune donnée n'est remplie
        if (currentStep === 1 && !selectedPropertyType) return;

        // Ne pas sauvegarder pendant l'affichage des modales
        if (showInstructionsModal || showDraftModal) return;

        const autoSave = async () => {
            const draftData = {
                publicationId,
                currentStep,
                selectedPropertyType,
                selectedAccommodationType,
                addressData,
                detailsData,
                equipmentsData,
                images,
                title,
                selectedDescriptions,
                fullDescription,
                weekPrice,
                weekendPrice,
                securityData,
                hostInfo,
            };

            await saveDraft(draftData);
        };

        // Débounce l'auto-save pour éviter trop de sauvegardes
        const timeoutId = setTimeout(autoSave, 1000); // 1 seconde après le dernier changement

        return () => clearTimeout(timeoutId);
    }, [
        currentStep,
        selectedPropertyType,
        selectedAccommodationType,
        addressData,
        detailsData,
        equipmentsData,
        images,
        title,
        selectedDescriptions,
        fullDescription,
        weekPrice,
        weekendPrice,
        securityData,
        hostInfo,
        showInstructionsModal,
        showDraftModal,
    ]);

    // Charger un brouillon existant
    const handleLoadDraft = async (draft: PublicationDraft) => {
        const data = draft.data;

        setCurrentStep(data.currentStep);
        setSelectedPropertyType(data.selectedPropertyType);
        setSelectedAccommodationType(data.selectedAccommodationType);
        setAddressData(data.addressData);
        setDetailsData(data.detailsData);
        setEquipmentsData(data.equipmentsData);
        setImages(data.images);
        setTitle(data.title);
        setSelectedDescriptions(data.selectedDescriptions);
        setFullDescription(data.fullDescription);
        setWeekPrice(data.weekPrice);
        setWeekendPrice(data.weekendPrice);
        setSecurityData(data.securityData);
        setHostInfo(data.hostInfo);

        // Fermer la modale de brouillon et s'assurer que les instructions ne s'affichent pas
        setShowDraftModal(false);
        setShowInstructionsModal(false);
        console.log('✅ Brouillon chargé avec succès - Étape', data.currentStep);
    };

    // Commencer un nouveau formulaire (ignorer le brouillon)
    const handleStartFresh = () => {
        setShowDraftModal(false);
        setShowInstructionsModal(true);
    };

    // Supprimer un brouillon
    const handleDeleteDraft = async (draft: PublicationDraft) => {
        Alert.alert(
            'Supprimer le brouillon',
            `Voulez-vous vraiment supprimer "${generateAutoTitle(draft)}" ?\n\nCette action est irréversible.`,
            [
                {
                    text: 'Annuler',
                    style: 'cancel'
                },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteDraft(draft.id);

                        // Mettre à jour la liste des brouillons
                        const updatedDrafts = availableDrafts.filter(d => d.id !== draft.id);
                        setAvailableDrafts(updatedDrafts);

                        // S'il n'y a plus de brouillons, afficher les instructions
                        if (updatedDrafts.length === 0) {
                            setShowDraftModal(false);
                            setShowInstructionsModal(true);
                        }

                        console.log('🗑️ Brouillon supprimé:', draft.id);
                    }
                }
            ]
        );
    };

    // Fonction de soumission du formulaire
    const handleSubmit = async () => {
        // Filtrer uniquement les images uploadées avec succès
        const successfulImages = images.filter(img => img.status === 'success');

        // Construire l'objet publication avec toutes les données du formulaire
        const publication = {
            id: publicationId,
            propertyType: selectedPropertyType,
            accommodationType: selectedAccommodationType,
            address: addressData,
            details: detailsData,
            equipments: equipmentsData,
            title: title,
            descriptions: selectedDescriptions,
            fullDescription: fullDescription,
            prices: {
                week: parseInt(weekPrice),
                weekend: parseInt(weekendPrice),
            },
            security: securityData,
            hostInfo: hostInfo,
            images: {
                urls: successfulImages.map(img => img.url),
                keys: successfulImages.map(img => img.key),
            },
            createdAt: new Date().toISOString(),
        };

        // Pour l'instant, on log les données (en attendant l'API backend)
        console.log('📝 Publication créée :', publication);
        console.log('🆔 Publication ID :', publicationId);
        console.log('📸 Nombre d\'images :', successfulImages.length);

        // TODO: Envoyer à l'API backend
        // await api.createPublication(publication);

        // Marquer le brouillon comme publié et le supprimer
        await markAsPublished(publicationId);
        await deleteDraft(publicationId);

        Alert.alert(
            'Publication créée ! 🎉',
            `Votre annonce "${title}" a été créée avec succès.\n\nID: ${publicationId}\nImages: ${successfulImages.length}`,
            [
                {
                    text: 'Voir les détails',
                    onPress: () => console.log('Publication data:', JSON.stringify(publication, null, 2))
                },
                {
                    text: 'Terminer',
                    onPress: () => router.replace('/(tabs)/(compte)'),
                    style: 'cancel'
                }
            ]
        );
    };

    const instructions = [
        {
            number: "1",
            title: "Parlez nous de votre logement",
            description: "Décrivez les caractéristiques de votre bien : type de logement, nombre de pièces, équipements et localisation.",
            icon: "house.fill"
        },
        {
            number: "2",
            title: "Démarquez vous",
            description: "Ajoutez des photos de qualité et mettez en avant ce qui rend votre logement unique et attractif.",
            icon: "star.fill"
        },
        {
            number: "3",
            title: "Publiez",
            description: "Vérifiez vos informations, définissez vos tarifs et disponibilités, puis publiez votre annonce.",
            icon: "checkmark.circle.fill"
        }
    ];

    const handleUpdateAddress = (field: keyof AddressData, value: string) => {
        setAddressData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleUpdateDetails = (field: keyof DetailsData, value: number) => {
        setDetailsData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleToggleEquipment = (category: keyof EquipmentsData, equipment: string) => {
        setEquipmentsData(prev => {
            const categoryList = prev[category];
            const isSelected = categoryList.includes(equipment);

            return {
                ...prev,
                [category]: isSelected
                    ? categoryList.filter(item => item !== equipment)
                    : [...categoryList, equipment]
            };
        });
    };

    const handleToggleDescription = (description: string) => {
        setSelectedDescriptions(prev => {
            const isSelected = prev.includes(description);
            return isSelected
                ? prev.filter(item => item !== description)
                : [...prev, description];
        });
    };

    const handleToggleSecurity = (field: keyof SecurityData) => {
        setSecurityData(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleUpdateHostInfo = (field: keyof HostInfoData, value: string | boolean) => {
        setHostInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1:
                return "Étape 1 : Type de logement";
            case 2:
                return "Étape 2 : Configuration du logement";
            case 3:
                return "Étape 3 : Adresse du logement";
            case 4:
                return "Étape 4 : Informations du logement";
            case 5:
                return "Étape 5 : Équipements";
            case 6:
                return "Étape 6 : Photos";
            case 7:
                return "Étape 7 : Titre de l'annonce";
            case 8:
                return "Étape 8 : Points forts";
            case 9:
                return "Étape 9 : Description complète";
            case 10:
                return "Étape 10 : Tarif semaine";
            case 11:
                return "Étape 11 : Tarif week-end";
            case 12:
                return "Étape 12 : Sécurité";
            case 13:
                return "Étape 13 : Vos informations";
            case 14:
                return "Confirmation";
            default:
                return "";
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1PropertyType
                        selectedPropertyType={selectedPropertyType}
                        onSelectPropertyType={setSelectedPropertyType}
                    />
                );
            case 2:
                return (
                    <Step2AccommodationType
                        selectedAccommodationType={selectedAccommodationType}
                        onSelectAccommodationType={setSelectedAccommodationType}
                    />
                );
            case 3:
                return (
                    <Step3Address
                        addressData={addressData}
                        onUpdateAddress={handleUpdateAddress}
                    />
                );
            case 4:
                return (
                    <Step4Details
                        detailsData={detailsData}
                        onUpdateDetails={handleUpdateDetails}
                    />
                );
            case 5:
                return (
                    <Step5Equipments
                        equipmentsData={equipmentsData}
                        onToggleEquipment={handleToggleEquipment}
                    />
                );
            case 6:
                return (
                    <Step6Photos
                        publicationId={publicationId}
                        images={images}
                        onImagesChange={setImages}
                    />
                );
            case 7:
                return (
                    <Step7Title
                        title={title}
                        onUpdateTitle={setTitle}
                    />
                );
            case 8:
                return (
                    <Step8Description
                        selectedDescriptions={selectedDescriptions}
                        onToggleDescription={handleToggleDescription}
                    />
                );
            case 9:
                return (
                    <Step9FullDescription
                        description={fullDescription}
                        onUpdateDescription={setFullDescription}
                    />
                );
            case 10:
                return (
                    <Step10WeekPrice
                        price={weekPrice}
                        onUpdatePrice={setWeekPrice}
                    />
                );
            case 11:
                return (
                    <Step11WeekendPrice
                        price={weekendPrice}
                        weekPrice={weekPrice}
                        onUpdatePrice={setWeekendPrice}
                    />
                );
            case 12:
                return (
                    <Step12Security
                        securityData={securityData}
                        onToggleSecurity={handleToggleSecurity}
                    />
                );
            case 13:
                return (
                    <Step13HostInfo
                        hostInfo={hostInfo}
                        onUpdateHostInfo={handleUpdateHostInfo}
                    />
                );
            case 14:
                return <Step14Confirmation />;
            default:
                return null;
        }
    };

    const canContinue = () => {
        switch (currentStep) {
            case 1:
                return !!selectedPropertyType;
            case 2:
                return !!selectedAccommodationType;
            case 3:
                // Vérifie que les champs obligatoires sont remplis
                return !!(addressData.numeroVoie && addressData.commune);
            case 4:
                // Vérifie qu'au moins 1 voyageur est défini (déjà initialisé à 1)
                return detailsData.voyageurs >= 1;
            case 5:
                // Aucune validation particulière, l'utilisateur peut passer même sans sélectionner d'équipements
                return true;
            case 6:
                // Vérifie qu'au moins 3 photos sont uploadées avec succès
                const successfulImages = images.filter(img => img.status === 'success');
                return successfulImages.length >= DEFAULT_IMAGE_CONSTRAINTS.minImages;
            case 7:
                // Vérifie que le titre n'est pas vide
                return title.trim().length > 0;
            case 8:
                // Au moins une description sélectionnée
                return selectedDescriptions.length > 0;
            case 9:
                // Vérifie que la description a au moins 200 caractères
                return fullDescription.length >= 200;
            case 10:
                // Vérifie qu'un prix semaine est défini
                return weekPrice.length > 0 && parseInt(weekPrice) > 0;
            case 11:
                // Vérifie qu'un prix week-end est défini
                return weekendPrice.length > 0 && parseInt(weekendPrice) > 0;
            case 12:
                // Pas de validation obligatoire pour la sécurité
                return true;
            case 13:
                // Vérifie que l'adresse, le code postal et la ville sont remplis
                return !!(hostInfo.address && hostInfo.city);
            case 14:
                // Dernière étape, toujours valide
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (canContinue()) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <>
            {/* Loading pendant la vérification des brouillons */}
            {isCheckingDrafts && (
                <View className="flex-1 items-center justify-center bg-gray-50">
                    <Text className="text-gray-500">Chargement...</Text>
                </View>
            )}

            {/* Formulaire (affiché si pas de loading et pas de modale) */}
            {!isCheckingDrafts && !showInstructionsModal && !showDraftModal && (
                <View className="flex flex-1 flex-col">
                    <ScreenScroll
                        className=""
                        contentClassName="pt-0 pb-10"
                    >
                        {/* Step Content */}
                        <View className="flex-1">
                            {renderStepContent()}
                        </View>
                    </ScreenScroll>

                    {/* Navigation Buttons */}
                    <View className="bg-white border-t border-gray-200 p-4">
                        {currentStep === 14 ? (
                            <Pressable
                                onPress={handleSubmit}
                                className="py-3 px-6 rounded-xl bg-black active:bg-gray-800"
                                accessibilityLabel="Publier l'annonce"
                            >
                                <View className="flex-row items-center justify-center gap-2">
                                    <Text className="text-white font-semibold text-base">
                                        Publier l'annonce
                                    </Text>
                                    <IconSymbol name="checkmark.circle.fill" size={20} color="#fff"/>
                                </View>
                            </Pressable>
                        ) : (
                            <View className="flex-row gap-3">
                                {currentStep > 1 && (
                                    <Pressable
                                        onPress={handlePrevious}
                                        className="w-1/2 py-3 px-6 rounded-xl border-2 border-gray-300 bg-white active:bg-gray-50"
                                        accessibilityLabel="Étape précédente"
                                    >
                                        <View className="flex-row items-center justify-center gap-2">
                                            <IconSymbol name="chevron.left" size={20} color="#374151"/>
                                            <Text className="text-gray-900 font-semibold text-base">
                                                Retour
                                            </Text>
                                        </View>
                                    </Pressable>
                                )}
                                <Pressable
                                    onPress={handleNext}
                                    disabled={!canContinue()}
                                    className={`flex-1 py-3 px-6 rounded-xl ${
                                        !canContinue()
                                            ? 'bg-gray-300'
                                            : 'bg-black active:bg-gray-800'
                                    }`}
                                    accessibilityLabel="Continuer"
                                >
                                    <View className="flex-row items-center justify-center gap-2">
                                        <Text
                                            className={`font-semibold text-base ${
                                                !canContinue()
                                                    ? 'text-gray-500'
                                                    : 'text-white'
                                            }`}
                                        >
                                            Continuer
                                        </Text>
                                        <IconSymbol
                                            name="chevron.right"
                                            size={20}
                                            color={!canContinue() ? "#6b7280" : "#fff"}
                                        />
                                    </View>
                                </Pressable>)
                            </View>)}
                    </View>
                </View>
            )}

            {/* Draft Modal */}
            <Modal
                visible={showDraftModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDraftModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white rounded-2xl p-6 w-full max-w-md">
                        {/* Header */}
                        <View className="items-center mb-6">
                            <View className="bg-orange-100 w-16 h-16 rounded-full items-center justify-center mb-3">
                                <IconSymbol name="doc.text.fill" size={32} color="#f97316"/>
                            </View>
                            <ThemedText type="subtitle" className="text-center">
                                Brouillon trouvé
                            </ThemedText>
                            <Text className="text-sm text-gray-600 text-center mt-2">
                                Vous avez un brouillon non terminé. Voulez-vous le reprendre ?
                            </Text>
                        </View>

                        {/* Draft List */}
                        <View className="gap-3 mb-6">
                            {availableDrafts.map((draft, index) => (
                                <View key={draft.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    {/* Info du brouillon */}
                                    <View className="mb-3">
                                        <Text className="font-semibold text-gray-900 mb-1">
                                            {generateAutoTitle(draft)}
                                        </Text>
                                        <Text className="text-xs text-gray-500">
                                            Étape {draft.data.currentStep}/14
                                        </Text>
                                        <Text className="text-xs text-gray-500">
                                            Modifié il y a {getTimeAgo(draft.lastModified)}
                                        </Text>
                                    </View>

                                    {/* Boutons d'action */}
                                    <View className="flex-row gap-2">
                                        <Pressable
                                            onPress={() => handleLoadDraft(draft)}
                                            className="flex-1 bg-black py-2.5 px-4 rounded-lg active:bg-gray-800"
                                        >
                                            <Text className="text-white text-center font-semibold text-sm">
                                                Reprendre
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => handleDeleteDraft(draft)}
                                            className="bg-white border border-red-500 py-2.5 px-4 rounded-lg active:bg-red-50"
                                        >
                                            <IconSymbol name="trash.fill" size={16} color="#ef4444"/>
                                        </Pressable>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Buttons */}
                        <View className="gap-3">
                            <Pressable
                                onPress={handleStartFresh}
                                className="bg-white border-2 border-gray-300 py-3 px-6 rounded-xl active:bg-gray-50"
                            >
                                <Text className="text-gray-900 text-center font-semibold">
                                    Recommencer
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Instructions Modal */}
            <Modal
                visible={showInstructionsModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowInstructionsModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white rounded-2xl p-6 w-full max-w-md">
                        {/* Header */}
                        <View className="items-center mb-6">
                            <View className="bg-gray-200 w-16 h-16 rounded-full items-center justify-center mb-3">
                                <IconSymbol name="lightbulb.fill" size={32} color="#000000"/>
                            </View>
                            <ThemedText type="subtitle" className="text-center">
                                Comment créer votre annonce
                            </ThemedText>
                        </View>

                        {/* Instructions List */}
                        <View className="gap-5 mb-8">
                            {instructions.map((instruction, index) => (
                                <View key={index} className="flex-row gap-4">
                                    <View className="items-center">
                                        <View className="bg-black w-10 h-10 rounded-full items-center justify-center">
                                            <IconSymbol name={instruction.icon} size={20} color="#fff"/>
                                        </View>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-base text-gray-900 mb-1">
                                            {instruction.number}. {instruction.title}
                                        </Text>
                                        <Text className="text-sm text-gray-600 leading-5">
                                            {instruction.description}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Start Button */}
                        <Pressable
                            onPress={() => setShowInstructionsModal(false)}
                            className="bg-black py-4 px-6 rounded-xl active:bg-gray-800"
                            accessibilityLabel="Commencer la création d'annonce"
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                Commencer
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </>
    );
};

// Fonction utilitaire pour afficher le temps écoulé
const getTimeAgo = (dateString: string): string => {
    const now = new Date().getTime();
    const then = new Date(dateString).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
};

// Fonction pour générer un titre automatique basé sur les données disponibles (comme Airbnb)
const generateAutoTitle = (draft: PublicationDraft): string => {
    const data = draft.data;

    // Si le titre personnalisé existe, l'utiliser
    if (data.title && data.title.trim().length > 0) {
        return data.title;
    }

    // Sinon, générer un titre automatique
    let autoTitle = '';

    // 1. Type de propriété (Maison, Appartement, etc.)
    if (data.selectedPropertyType) {
        autoTitle = data.selectedPropertyType;
    }

    // 2. Type d'hébergement - convertir en format court
    if (data.selectedAccommodationType && autoTitle) {
        const accommodationShort: { [key: string]: string } = {
            'Logement entier': 'entier',
            'Chambre privée': 'privée',
            'Chambre partagée': 'partagée',
        };
        const shortType = accommodationShort[data.selectedAccommodationType];
        if (shortType) {
            autoTitle += ` ${shortType}`;
        }
    }

    // 3. Ville
    if (data.addressData?.commune && autoTitle) {
        autoTitle += ` à ${data.addressData.commune}`;
    }

    // 4. Nombre de voyageurs
    if (data.detailsData?.voyageurs && data.detailsData.voyageurs > 0 && autoTitle) {
        autoTitle += ` · ${data.detailsData.voyageurs} voyageur${data.detailsData.voyageurs > 1 ? 's' : ''}`;
    }

    // Si aucune donnée n'est disponible
    return autoTitle || 'Nouvelle annonce';
};

export default CreateAnnonceScreen;
