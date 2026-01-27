import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface UploadResult {
    success: boolean;
    url?: string;
    key?: string;
    error?: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

// Configuration R2
const R2_CONFIG = {
    accountId: process.env.EXPO_PUBLIC_R2_ACCOUNT_ID || '',
    accessKeyId: process.env.EXPO_PUBLIC_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EXPO_PUBLIC_R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.EXPO_PUBLIC_R2_BUCKET_NAME || 'pillowa-images',
    region: process.env.EXPO_PUBLIC_R2_REGION || 'auto',
    publicUrl: process.env.EXPO_PUBLIC_R2_PUBLIC_URL || '',
};

// Initialisation du client S3 pour R2
const createR2Client = () => {
    if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
        console.warn('⚠️ R2 credentials not configured. Please set up your .env file.');
        return null;
    }

    return new S3Client({
        region: R2_CONFIG.region,
        endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_CONFIG.accessKeyId,
            secretAccessKey: R2_CONFIG.secretAccessKey,
        },
    });
};

/**
 * Génère un nom de fichier unique pour l'image
 * Format: images/{type}/{resourceId}/{uuid}.{extension}
 *
 * Exemples:
 * - images/publications/abc-123/photo-1.jpg
 * - images/profil/user-456/avatar.jpg
 */
const generateUniqueFileName = (
    originalName: string,
    type: 'publications' | 'profil',
    resourceId: string,
    index?: number
): string => {
    // Extraire l'extension du fichier original
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';

    // Générer un nom de fichier
    let fileName: string;
    if (type === 'profil') {
        fileName = `avatar.${extension}`;
    } else {
        // Pour les publications, utiliser un index ou UUID
        fileName = index !== undefined ? `photo-${index + 1}.${extension}` : `${uuidv4()}.${extension}`;
    }

    return `images/${type}/${resourceId}/${fileName}`;
};

/**
 * Détermine le Content-Type basé sur l'extension du fichier
 */
const getContentType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: { [key: string]: string } = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        heic: 'image/heic',
        heif: 'image/heif',
    };

    return mimeTypes[extension || 'jpg'] || 'image/jpeg';
};

/**
 * Upload une image vers Cloudflare R2
 * @param uri - URI locale de l'image (depuis expo-image-picker)
 * @param type - Type d'image ('publications' ou 'profil')
 * @param resourceId - ID de la ressource (publicationId ou userId)
 * @param fileName - Nom du fichier (optionnel)
 * @param index - Index de l'image (pour les publications, permet d'avoir photo-1, photo-2, etc.)
 * @param onProgress - Callback pour suivre la progression (optionnel)
 * @returns Promise<UploadResult>
 */
export const uploadImageToR2 = async (
    uri: string,
    type: 'publications' | 'profil',
    resourceId: string,
    fileName?: string,
    index?: number,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
    try {
        const client = createR2Client();

        if (!client) {
            return {
                success: false,
                error: 'R2 client not configured. Please check your environment variables.',
            };
        }

        // Générer un nom de fichier unique
        const originalName = fileName || 'image.jpg';
        const key = generateUniqueFileName(originalName, type, resourceId, index);

        // Lire le fichier depuis l'URI
        const response = await fetch(uri);
        const blob = await response.blob();

        // Convertir le blob en buffer
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Préparer la commande d'upload
        const command = new PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key,
            Body: buffer,
            ContentType: getContentType(originalName),
            ContentLength: buffer.length,
        });

        // Simuler la progression (R2 ne supporte pas nativement le suivi de progression)
        if (onProgress) {
            onProgress({ loaded: 0, total: buffer.length, percentage: 0 });
        }

        // Upload vers R2
        await client.send(command);

        // Progression complète
        if (onProgress) {
            onProgress({ loaded: buffer.length, total: buffer.length, percentage: 100 });
        }

        // Construire l'URL publique
        const publicUrl = R2_CONFIG.publicUrl
            ? `${R2_CONFIG.publicUrl}/${key}`
            : `https://pub-${R2_CONFIG.accountId}.r2.dev/${key}`;

        return {
            success: true,
            url: publicUrl,
            key: key,
        };
    } catch (error) {
        console.error('❌ Error uploading to R2:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};

/**
 * Upload plusieurs images en parallèle
 * @param uris - Liste des URIs d'images à uploader
 * @param type - Type d'image ('publications' ou 'profil')
 * @param resourceId - ID de la ressource (publicationId ou userId)
 * @param onProgress - Callback pour suivre la progression globale (optionnel)
 * @returns Promise<UploadResult[]>
 */
export const uploadMultipleImagesToR2 = async (
    uris: string[],
    type: 'publications' | 'profil',
    resourceId: string,
    onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    let completed = 0;

    for (let i = 0; i < uris.length; i++) {
        const uri = uris[i];
        const result = await uploadImageToR2(uri, type, resourceId, undefined, i);
        results.push(result);
        completed++;

        if (onProgress) {
            onProgress(completed, uris.length);
        }
    }

    return results;
};

/**
 * Valide la configuration R2
 * @returns true si la configuration est valide, false sinon
 */
export const isR2Configured = (): boolean => {
    return !!(
        R2_CONFIG.accountId &&
        R2_CONFIG.accessKeyId &&
        R2_CONFIG.secretAccessKey &&
        R2_CONFIG.bucketName
    );
};
