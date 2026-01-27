import React, { useState } from 'react';
import { TextInput as RNTextInput, View, Text, Pressable } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface TextInputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoComplete?: 'email' | 'password' | 'username' | 'off';
    icon?: string;
}

export const TextInput = ({
    label,
    placeholder,
    value,
    onChangeText,
    error,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    autoComplete,
    icon,
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <View className="gap-2">
            {label && (
                <Text className="text-base font-medium text-gray-700">
                    {label}
                </Text>
            )}

            <View
                className={`
                    flex-row items-center gap-3 px-4 py-3.5 rounded-xl border-2
                    ${error ? 'border-red-500 bg-red-50' : isFocused ? 'border-black bg-white' : 'border-gray-300 bg-gray-50'}
                `}
            >
                {icon && (
                    <IconSymbol
                        name={icon}
                        size={20}
                        color={error ? '#ef4444' : isFocused ? '#000' : '#9ca3af'}
                    />
                )}

                <RNTextInput
                    className="flex-1 text-base text-gray-900"
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                {secureTextEntry && (
                    <Pressable
                        onPress={togglePasswordVisibility}
                        className="active:opacity-60"
                    >
                        <IconSymbol
                            name={isPasswordVisible ? 'eye.slash' : 'eye'}
                            size={20}
                            color="#9ca3af"
                        />
                    </Pressable>
                )}
            </View>

            {error && (
                <Text className="text-sm text-red-500 ml-1">
                    {error}
                </Text>
            )}
        </View>
    );
};
