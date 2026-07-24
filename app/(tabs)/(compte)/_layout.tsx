import React from 'react';
import {Stack} from "expo-router";

const CompteStackLayout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="index"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="account-settings"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="support"
                options={{
                    headerShown: true,
                    headerTitle: "Assistance",
                    headerBackTitle: "Retour",
                }}
            />
            <Stack.Screen
                name="privacy"
                options={{
                    headerShown: true,
                    headerTitle: "Confidentialité",
                    headerBackTitle: "Retour",
                }}
            />
            <Stack.Screen
                name="legal"
                options={{
                    headerShown: true,
                    headerTitle: "Mentions légales",
                    headerBackTitle: "Retour",
                }}
            />
        </Stack>
    );
};

export default CompteStackLayout;
