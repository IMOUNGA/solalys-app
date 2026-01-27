import { useContext } from 'react';
import { AlertContext, AlertConfig } from '@/contexts/AlertContext';

export const useAlert = () => {
    const context = useContext(AlertContext);

    if (!context) {
        throw new Error('useAlert must be used within AlertProvider');
    }

    return {
        showAlert: context.showAlert,
        hideAlert: context.hideAlert,
    };
};

/**
 * Helper pour afficher une alerte d'erreur simple
 */
export const useErrorAlert = () => {
    const { showAlert } = useAlert();

    return (message: string, title: string = 'Erreur') => {
        showAlert({
            title,
            message,
            buttons: [{ text: 'OK', style: 'default' }],
        });
    };
};

/**
 * Helper pour afficher une alerte de succès
 */
export const useSuccessAlert = () => {
    const { showAlert } = useAlert();

    return (message: string, title: string = 'Succès') => {
        showAlert({
            title,
            message,
            buttons: [{ text: 'OK', style: 'default' }],
        });
    };
};

/**
 * Helper pour afficher une alerte de confirmation
 */
export const useConfirmAlert = () => {
    const { showAlert } = useAlert();

    return (
        message: string,
        onConfirm: () => void,
        title: string = 'Confirmation',
        confirmText: string = 'Confirmer',
        cancelText: string = 'Annuler'
    ) => {
        showAlert({
            title,
            message,
            buttons: [
                { text: cancelText, style: 'cancel' },
                { text: confirmText, style: 'default', onPress: onConfirm },
            ],
        });
    };
};
