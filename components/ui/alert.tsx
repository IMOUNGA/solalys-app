import React, { useContext, useEffect } from 'react';
import { Modal, View, Text, Pressable, Animated } from 'react-native';
import { AlertContext } from '@/contexts/AlertContext';

export const Alert = () => {
    const context = useContext(AlertContext);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

    if (!context) {
        throw new Error('Alert must be used within AlertProvider');
    }

    const { alert, isVisible, hideAlert } = context;

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isVisible]);

    if (!alert) return null;

    const buttons = alert.buttons || [{ text: 'OK', style: 'default' as const }];

    const handleButtonPress = (button: typeof buttons[0]) => {
        button.onPress?.();
        hideAlert();
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            onRequestClose={hideAlert}
        >
            <Pressable
                className="flex-1 bg-black/50 items-center justify-center px-8"
                onPress={hideAlert}
            >
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    }}
                    className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
                >
                    <Pressable>
                        {/* Contenu */}
                        <View className="p-6 gap-3">
                            <Text className="text-xl font-bold text-gray-900">
                                {alert.title}
                            </Text>
                            {alert.message && (
                                <Text className="text-base text-gray-600 leading-6">
                                    {alert.message}
                                </Text>
                            )}
                        </View>

                        {/* Boutons */}
                        <View className="border-t border-gray-200">
                            {buttons.map((button, index) => {
                                const isDestructive = button.style === 'destructive';
                                const isCancel = button.style === 'cancel';
                                const isLast = index === buttons.length - 1;

                                return (
                                    <React.Fragment key={index}>
                                        <Pressable
                                            className={`py-4 px-6 active:bg-gray-100 ${
                                                !isLast ? 'border-b border-gray-200' : ''
                                            }`}
                                            onPress={() => handleButtonPress(button)}
                                        >
                                            <Text
                                                className={`text-center text-base font-semibold ${
                                                    isDestructive
                                                        ? 'text-red-600'
                                                        : isCancel
                                                        ? 'text-gray-600'
                                                        : 'text-black'
                                                }`}
                                            >
                                                {button.text}
                                            </Text>
                                        </Pressable>
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};
