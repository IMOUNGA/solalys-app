import React, { useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, Dimensions, SafeAreaView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { mmkv } from '@/lib/mmkv';

const { width } = Dimensions.get('window');

interface Slide {
  key: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  colors: [string, string];
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    icon: 'person.3.fill',
    colors: ['#3B82F6', '#8B5CF6'],
    title: 'Bienvenue sur Solalys',
    description: "Le réseau qui fait grandir votre business. Rejoignez des groupes d'entrepreneurs qui se recommandent vraiment.",
  },
  {
    key: 'exclusivite',
    icon: 'lock.fill',
    colors: ['#8B5CF6', '#EC4899'],
    title: 'Des groupes exclusifs',
    description: 'Un seul membre par métier et par groupe, et une adhésion uniquement sur invitation. Votre business, sans concurrence directe.',
  },
  {
    key: 'opportunites',
    icon: 'lightbulb.fill',
    colors: ['#F59E0B', '#EC4899'],
    title: 'Annuaire & opportunités',
    description: 'Trouvez vos prochains clients, partenaires ou recrues entre deux événements, grâce au réseau de vos groupes.',
  },
  {
    key: 'ca',
    icon: 'chart.line.uptrend.xyaxis',
    colors: ['#10B981', '#3B82F6'],
    title: 'Recommandations & CA',
    description: 'Recommandez, soyez recommandé, et mesurez ce que votre réseau vous rapporte vraiment — en euros.',
  },
  {
    key: 'gratuit',
    icon: 'gift.fill',
    colors: ['#F59E0B', '#10B981'],
    title: "Gratuit jusqu'au 1ᵉʳ octobre",
    description: "Testez toutes les fonctionnalités sans engagement pendant l'été. Les abonnements Pro et Organisateur ouvriront à la rentrée, le 1ᵉʳ octobre 2026.",
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const finish = () => {
    mmkv.set('onboarding_completed', true);
    router.replace('/(tabs)/(trouver)');
  };

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <LinearGradient
            colors={item.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width, flex: 1 }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View className="flex-1 items-center justify-center px-8">
                <View className="bg-white/15 rounded-full p-8 mb-8">
                  <IconSymbol name={item.icon} size={56} color="#fff" />
                </View>
                <Text className="text-white text-3xl font-bold text-center mb-4">
                  {item.title}
                </Text>
                <Text className="text-white/85 text-base text-center leading-6">
                  {item.description}
                </Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        )}
      />

      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        {!isLast && (
          <Pressable onPress={finish} className="self-end m-4 px-4 py-2 active:opacity-70">
            <Text className="text-white/90 font-semibold text-sm">Passer</Text>
          </Pressable>
        )}
      </SafeAreaView>

      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <View className="px-8 pb-6">
          <View className="flex-row justify-center gap-2 mb-6">
            {SLIDES.map((slide, i) => (
              <View
                key={slide.key}
                className={`h-1.5 rounded-full ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </View>

          <Pressable
            onPress={goNext}
            className="bg-white rounded-2xl py-4 active:opacity-90"
          >
            <Text className="text-center font-bold text-base" style={{ color: SLIDES[index].colors[0] }}>
              {isLast ? 'Commencer' : 'Suivant'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
