import { useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageUploadState } from '@/types/image';
import { PropertyType } from '@/components/formulaire/Step1PropertyType';
import { AccommodationType } from '@/components/formulaire/Step2AccommodationType';
import { AddressData } from '@/components/formulaire/Step3Address';
import { DetailsData } from '@/components/formulaire/Step4Details';
import { EquipmentsData } from '@/components/formulaire/Step5Equipments';
import { SecurityData } from '@/components/formulaire/Step12Security';
import { HostInfoData } from '@/components/formulaire/Step13HostInfo';

const DRAFT_KEY_PREFIX = 'publication-draft-';
const DRAFTS_LIST_KEY = 'publication-drafts-list';

export interface PublicationDraftData {
    publicationId: string;
    currentStep: number;
    selectedPropertyType: PropertyType;
    selectedAccommodationType: AccommodationType;
    addressData: AddressData;
    detailsData: DetailsData;
    equipmentsData: EquipmentsData;
    images: ImageUploadState[];
    title: string;
    selectedDescriptions: string[];
    fullDescription: string;
    weekPrice: string;
    weekendPrice: string;
    securityData: SecurityData;
    hostInfo: HostInfoData;
}

export interface PublicationDraft {
    id: string;
    data: PublicationDraftData;
    status: 'draft' | 'published';
    createdAt: string;
    lastModified: string;
}

/**
 * Hook personnalisé pour gérer les brouillons de publications
 */
export const usePublicationDraft = () => {
    /**
     * Sauvegarder un brouillon
     */
    const saveDraft = useCallback(async (draftData: PublicationDraftData): Promise<void> => {
        try {
            const draft: PublicationDraft = {
                id: draftData.publicationId,
                data: draftData,
                status: 'draft',
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
            };

            // Sauvegarder le brouillon
            await AsyncStorage.setItem(
                `${DRAFT_KEY_PREFIX}${draftData.publicationId}`,
                JSON.stringify(draft)
            );

            // Mettre à jour la liste des brouillons
            await updateDraftsList(draftData.publicationId);

            console.log('💾 Brouillon sauvegardé:', draftData.publicationId);
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde du brouillon:', error);
        }
    }, []);

    /**
     * Charger un brouillon
     */
    const loadDraft = useCallback(async (publicationId: string): Promise<PublicationDraft | null> => {
        try {
            const draftJson = await AsyncStorage.getItem(`${DRAFT_KEY_PREFIX}${publicationId}`);
            if (!draftJson) return null;

            const draft: PublicationDraft = JSON.parse(draftJson);
            console.log('📂 Brouillon chargé:', publicationId);
            return draft;
        } catch (error) {
            console.error('❌ Erreur lors du chargement du brouillon:', error);
            return null;
        }
    }, []);

    /**
     * Supprimer un brouillon
     */
    const deleteDraft = useCallback(async (publicationId: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(`${DRAFT_KEY_PREFIX}${publicationId}`);
            await removeDraftFromList(publicationId);
            console.log('🗑️ Brouillon supprimé:', publicationId);
        } catch (error) {
            console.error('❌ Erreur lors de la suppression du brouillon:', error);
        }
    }, []);

    /**
     * Lister tous les brouillons
     */
    const listDrafts = useCallback(async (): Promise<PublicationDraft[]> => {
        try {
            const draftsListJson = await AsyncStorage.getItem(DRAFTS_LIST_KEY);
            if (!draftsListJson) return [];

            const draftIds: string[] = JSON.parse(draftsListJson);
            const drafts: PublicationDraft[] = [];

            for (const id of draftIds) {
                const draft = await loadDraft(id);
                if (draft) {
                    drafts.push(draft);
                }
            }

            // Trier par dernière modification (plus récent en premier)
            return drafts.sort((a, b) =>
                new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
            );
        } catch (error) {
            console.error('❌ Erreur lors du listage des brouillons:', error);
            return [];
        }
    }, [loadDraft]);

    /**
     * Marquer un brouillon comme publié
     */
    const markAsPublished = useCallback(async (publicationId: string): Promise<void> => {
        try {
            const draft = await loadDraft(publicationId);
            if (!draft) return;

            draft.status = 'published';
            draft.lastModified = new Date().toISOString();

            await AsyncStorage.setItem(
                `${DRAFT_KEY_PREFIX}${publicationId}`,
                JSON.stringify(draft)
            );

            console.log('✅ Brouillon marqué comme publié:', publicationId);

            // Supprimer le brouillon après publication (optionnel)
            // Décommenter si tu veux supprimer automatiquement après publication
            // await deleteDraft(publicationId);
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du statut:', error);
        }
    }, [loadDraft]);

    /**
     * Nettoyer les vieux brouillons (> 30 jours)
     */
    const cleanupOldDrafts = useCallback(async (daysOld: number = 30): Promise<number> => {
        try {
            const drafts = await listDrafts();
            const now = new Date().getTime();
            const maxAge = daysOld * 24 * 60 * 60 * 1000; // jours en ms
            let deletedCount = 0;

            for (const draft of drafts) {
                const draftAge = now - new Date(draft.lastModified).getTime();
                if (draftAge > maxAge && draft.status === 'draft') {
                    await deleteDraft(draft.id);
                    deletedCount++;
                }
            }

            console.log(`🧹 ${deletedCount} brouillons supprimés (> ${daysOld} jours)`);
            return deletedCount;
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
            return 0;
        }
    }, [listDrafts, deleteDraft]);

    return {
        saveDraft,
        loadDraft,
        deleteDraft,
        listDrafts,
        markAsPublished,
        cleanupOldDrafts,
    };
};

/**
 * Mettre à jour la liste des brouillons
 */
const updateDraftsList = async (publicationId: string): Promise<void> => {
    try {
        const draftsListJson = await AsyncStorage.getItem(DRAFTS_LIST_KEY);
        const draftIds: string[] = draftsListJson ? JSON.parse(draftsListJson) : [];

        if (!draftIds.includes(publicationId)) {
            draftIds.push(publicationId);
            await AsyncStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(draftIds));
        }
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de la liste:', error);
    }
};

/**
 * Retirer un brouillon de la liste
 */
const removeDraftFromList = async (publicationId: string): Promise<void> => {
    try {
        const draftsListJson = await AsyncStorage.getItem(DRAFTS_LIST_KEY);
        if (!draftsListJson) return;

        const draftIds: string[] = JSON.parse(draftsListJson);
        const updatedIds = draftIds.filter(id => id !== publicationId);
        await AsyncStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(updatedIds));
    } catch (error) {
        console.error('❌ Erreur lors du retrait de la liste:', error);
    }
};
