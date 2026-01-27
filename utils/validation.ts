/**
 * Utilitaires de validation pour les formulaires
 */

/**
 * Valide un prénom
 */
export const validateFirstName = (firstName: string): string | undefined => {
    if (!firstName.trim()) {
        return 'Le prénom est requis';
    }

    if (firstName.trim().length < 2) {
        return 'Le prénom doit contenir au moins 2 caractères';
    }

    return undefined;
};

/**
 * Valide un nom de famille
 */
export const validateLastName = (lastName: string): string | undefined => {
    if (!lastName.trim()) {
        return 'Le nom est requis';
    }

    if (lastName.trim().length < 2) {
        return 'Le nom doit contenir au moins 2 caractères';
    }

    return undefined;
};

/**
 * Valide le format d'un email
 */
export const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
        return 'L\'email est requis';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Format d\'email invalide';
    }

    return undefined;
};

/**
 * Valide un mot de passe
 * @param password - Le mot de passe à valider
 * @param minLength - Longueur minimale requise (défaut: 6)
 */
export const validatePassword = (
    password: string,
    minLength: number = 6
): string | undefined => {
    if (!password) {
        return 'Le mot de passe est requis';
    }

    if (password.length < minLength) {
        return `Le mot de passe doit contenir au moins ${minLength} caractères`;
    }

    return undefined;
};

/**
 * Valide la confirmation du mot de passe
 */
export const validatePasswordConfirmation = (
    password: string,
    confirmation: string
): string | undefined => {
    if (!confirmation) {
        return 'La confirmation du mot de passe est requise';
    }

    if (password !== confirmation) {
        return 'Les mots de passe ne correspondent pas';
    }

    return undefined;
};

/**
 * Valide un champ requis générique
 */
export const validateRequired = (
    value: string,
    fieldName: string = 'Ce champ'
): string | undefined => {
    if (!value.trim()) {
        return `${fieldName} est requis`;
    }

    return undefined;
};

/**
 * Valide un numéro de téléphone français
 */
export const validatePhoneNumber = (phone: string): string | undefined => {
    if (!phone.trim()) {
        return 'Le numéro de téléphone est requis';
    }

    // Format français : 0X XX XX XX XX ou +33 X XX XX XX XX
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return 'Format de numéro invalide';
    }

    return undefined;
};

/**
 * Valide une longueur minimale
 */
export const validateMinLength = (
    value: string,
    minLength: number,
    fieldName: string = 'Ce champ'
): string | undefined => {
    if (value.length < minLength) {
        return `${fieldName} doit contenir au moins ${minLength} caractères`;
    }

    return undefined;
};

/**
 * Valide une longueur maximale
 */
export const validateMaxLength = (
    value: string,
    maxLength: number,
    fieldName: string = 'Ce champ'
): string | undefined => {
    if (value.length > maxLength) {
        return `${fieldName} ne peut pas dépasser ${maxLength} caractères`;
    }

    return undefined;
};
