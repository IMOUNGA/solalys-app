// Test script pour vérifier le chargement des tokens
import * as SecureStore from 'expo-secure-store';

async function testTokenLoad() {
    console.log('Testing token load...');
    
    // Simuler la sauvegarde
    await SecureStore.setItemAsync('atk', 'test-access-token');
    console.log('Token saved');
    
    // Simuler le chargement
    const token = await SecureStore.getItemAsync('atk');
    console.log('Token loaded:', token);
}

testTokenLoad();
