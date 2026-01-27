import React, { createContext, useState, useCallback } from 'react';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
    title: string;
    message?: string;
    buttons?: AlertButton[];
}

interface AlertContextType {
    showAlert: (config: AlertConfig) => void;
    hideAlert: () => void;
    alert: AlertConfig | null;
    isVisible: boolean;
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
    const [alert, setAlert] = useState<AlertConfig | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const showAlert = useCallback((config: AlertConfig) => {
        setAlert(config);
        setIsVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => setAlert(null), 300); // Délai pour l'animation
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert, alert, isVisible }}>
            {children}
        </AlertContext.Provider>
    );
};
