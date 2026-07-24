import {Redirect} from 'expo-router';
import {mmkv} from '@/lib/mmkv';

export default function Index() {
  const hasSeenOnboarding = mmkv.getBoolean('onboarding_completed');
  return <Redirect href={hasSeenOnboarding ? '/(tabs)/(trouver)' : '/onboarding'} />
}

