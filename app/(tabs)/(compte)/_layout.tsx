import React from 'react';
import {Stack} from "expo-router";

const CompteStackLayout = () => {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
            <Stack.Screen
                name="index"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="account-settings"
                options={{ headerShown: false }}
            />
        </Stack>
    );
};

export default CompteStackLayout;
