/**
 * Types pour la gestion des images dans l'application Pillowa
 */

/**
 * Représente une image uploadée ou en cours d'upload
 */
export interface UploadedImage {
    /** Identifiant unique de l'image */
    id: string;
    /** URL de l'image une fois uploadée sur R2 */
    url: string;
    /** Clé R2 de l'image (chemin dans le bucket) */
    key: string;
    /** URI locale de l'image (avant upload) */
    localUri?: string;
    /** Nom du fichier original */
    fileName?: string;
    /** Type MIME de l'image */
    mimeType?: string;
    /** Taille du fichier en octets */
    size?: number;
    /** Largeur de l'image en pixels */
    width?: number;
    /** Hauteur de l'image en pixels */
    height?: number;
    /** Date de création/upload */
    createdAt: Date;
}

/**
 * Représente l'état d'upload d'une image
 */
export interface ImageUploadState {
    /** Identifiant unique */
    id: string;
    /** URI locale de l'image */
    localUri: string;
    /** Nom du fichier */
    fileName: string;
    /** Statut de l'upload */
    status: 'pending' | 'uploading' | 'success' | 'error';
    /** Progression de l'upload (0-100) */
    progress: number;
    /** URL une fois uploadée */
    url?: string;
    /** Clé R2 une fois uploadée */
    key?: string;
    /** Message d'erreur en cas d'échec */
    error?: string;
}

/**
 * Contraintes pour les images d'annonces
 */
export interface ImageConstraints {
    /** Nombre minimum d'images requises */
    minImages: number;
    /** Nombre maximum d'images autorisées */
    maxImages: number;
    /** Taille maximale par image (en octets) */
    maxFileSize: number;
    /** Types MIME acceptés */
    acceptedFormats: string[];
}

/**
 * Contraintes par défaut pour les images d'annonces Pillowa
 */
export const DEFAULT_IMAGE_CONSTRAINTS: ImageConstraints = {
    minImages: 3,
    maxImages: 15,
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
};

/**
 * Type pour les informations d'une image sélectionnée depuis expo-image-picker
 */
export interface SelectedImage {
    uri: string;
    width?: number;
    height?: number;
    type?: 'image' | 'video';
    fileName?: string;
    fileSize?: number;
}
