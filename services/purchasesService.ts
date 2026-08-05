import Purchases, { PurchasesPackage, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

let configured = false;

/**
 * À appeler une fois au démarrage de l'app (avant tout logIn). Pas de clé
 * Android pour l'instant, l'app n'est distribuée que sur iOS.
 */
export function initPurchases() {
  if (configured || Platform.OS !== 'ios') return;

  const apiKey = Constants.expoConfig?.extra?.revenueCatApiKey as string | undefined;
  if (!apiKey) {
    console.warn('⚠️ REVENUECAT_API_KEY manquant, IAP désactivé');
    return;
  }

  Purchases.configure({ apiKey });
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  configured = true;
}

/**
 * Associe le compte Solalys (userId interne) à RevenueCat, pour que les
 * webhooks (app_user_id) correspondent directement à notre User.id.
 */
export async function loginPurchasesUser(userId: number) {
  if (!configured) return;
  try {
    await Purchases.logIn(String(userId));
  } catch (error) {
    console.warn('⚠️ Purchases.logIn a échoué', error);
  }
}

export async function logoutPurchasesUser() {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    console.warn('⚠️ Purchases.logOut a échoué', error);
  }
}

/**
 * Packages disponibles dans l'offering courant (configuré côté dashboard
 * RevenueCat), typiquement un pour Pro et un pour Organisateur.
 */
export async function getAvailablePackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

/**
 * Déclenche l'achat natif. Renvoie les entitlements actifs après achat —
 * le palier réel est de toute façon synchronisé côté serveur via le
 * webhook RevenueCat, ceci sert juste au retour visuel immédiat.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<string[]> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return Object.keys(customerInfo.entitlements.active);
}

export async function restorePurchases(): Promise<string[]> {
  const customerInfo = await Purchases.restorePurchases();
  return Object.keys(customerInfo.entitlements.active);
}
