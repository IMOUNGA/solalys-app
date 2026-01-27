# Configuration des Services Externes - Solalys MVP

Ce document explique comment configurer tous les services externes nécessaires pour le MVP Solalys.

---

## 🔥 Firebase (Notifications Push)

### 1. Créer le projet Firebase
1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur "Ajouter un projet"
3. Nom du projet : `Solalys`
4. Activer Google Analytics (optionnel pour MVP)

### 2. Ajouter les applications
**iOS :**
- Bundle ID : `com.lilvinssou.solalysapp`
- Télécharger `GoogleService-Info.plist`
- Placer dans le dossier racine de l'app

**Android :**
- Package name : `com.lilvinssou.solalysapp`
- Télécharger `google-services.json`
- Placer dans le dossier racine de l'app

### 3. Activer Firebase Cloud Messaging (FCM)
1. Dans Firebase Console → Project Settings → Cloud Messaging
2. Activer "Cloud Messaging API (Legacy)"
3. Copier la "Server Key"

### 4. Configuration App Mobile
```bash
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

Ajouter dans `.env.development` et `.env.production` :
```env
FIREBASE_SERVER_KEY=votre_server_key_ici
```

### 5. Configuration Backend
Dans `solalys-api/.env` :
```env
FIREBASE_SERVER_KEY=votre_server_key_ici
```

---

## ☁️ Cloudflare R2 (Stockage Images)

### 1. Créer le bucket R2
1. Aller sur [Cloudflare Dashboard](https://dash.cloudflare.com)
2. R2 → Create bucket
3. Nom : `solalys-images`
4. Région : Automatic

### 2. Créer API Token
1. R2 → Manage R2 API Tokens → Create API Token
2. Nom : `solalys-upload-token`
3. Permissions : Object Read & Write
4. Apply to bucket : `solalys-images`
5. Copier **Access Key ID** et **Secret Access Key**

### 3. Configuration
**Backend (`solalys-api/.env`)** :
```env
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key_id
R2_SECRET_ACCESS_KEY=votre_secret_access_key
R2_BUCKET_NAME=solalys-images
R2_PUBLIC_URL=
R2_REGION=auto
```

**Mobile (`.env.development` et `.env.production`)** :
```env
EXPO_PUBLIC_R2_ACCOUNT_ID=votre_account_id
EXPO_PUBLIC_R2_ACCESS_KEY_ID=votre_access_key_id
EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=votre_secret_access_key
EXPO_PUBLIC_R2_BUCKET_NAME=solalys-images
EXPO_PUBLIC_R2_PUBLIC_URL=
EXPO_PUBLIC_R2_REGION=auto
```

### 4. (Optionnel) Domaine personnalisé
1. R2 → Bucket Settings → Connect Domain
2. Ajouter : `images.solalys.com`
3. Configurer le DNS
4. Mettre à jour `R2_PUBLIC_URL` avec `https://images.solalys.com`

---

## 📧 SendGrid / Resend (Emails Transactionnels)

### Option 1 : SendGrid (10k emails/mois gratuits)

1. Créer compte sur [SendGrid](https://sendgrid.com)
2. Aller dans Settings → API Keys
3. Créer une clé API avec Full Access
4. Vérifier un domaine (ex: `solalys.com`)

Configuration Backend :
```env
SENDGRID_API_KEY=votre_api_key_ici
SENDGRID_FROM_EMAIL=noreply@solalys.com
SENDGRID_FROM_NAME=Solalys
```

### Option 2 : Resend (3k emails/mois gratuits) - RECOMMANDÉ

1. Créer compte sur [Resend](https://resend.com)
2. Aller dans API Keys → Create API Key
3. Copier la clé

Configuration Backend :
```env
RESEND_API_KEY=votre_api_key_ici
RESEND_FROM_EMAIL=noreply@solalys.com
```

### Installation Backend
```bash
cd solalys-api
yarn add @sendgrid/mail
# OU
yarn add resend
```

---

## 💳 Stripe (Paiements) - Pour plus tard

### Configuration (quand prêt)
1. Créer compte sur [Stripe](https://stripe.com)
2. Dashboard → Developers → API Keys
3. Copier **Publishable key** (pk_...) et **Secret key** (sk_...)

Configuration :
```env
# Backend
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mobile
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🗄️ Supabase (Base de données) - DÉJÀ CONFIGURÉ ✅

La base de données est déjà configurée dans `solalys-api/.env` :
```env
DATABASE_URL="postgresql://postgres.amviqohbllmjagyqznob:..."
DIRECT_URL="postgresql://postgres.amviqohbllmjagyqznob:..."
```

---

## 🚀 Checklist de Déploiement

### Backend API
- [ ] Configurer Cloudflare R2
- [ ] Configurer SendGrid ou Resend
- [ ] Changer les secrets JWT en production
- [ ] Lancer les seeds : `yarn seed`
- [ ] Build : `yarn build`
- [ ] Déployer avec PM2 : `./scripts/deploy_fresh.sh`

### App Mobile
- [ ] Configurer Firebase (iOS + Android)
- [ ] Configurer Cloudflare R2
- [ ] Tester l'auth avec les comptes seed
- [ ] Build EAS : `eas build --platform all`
- [ ] Soumettre aux stores

### Tests MVP
- [ ] Inscription / Connexion
- [ ] Liste des événements
- [ ] Participer à un événement
- [ ] Liste des groupes
- [ ] Rejoindre un groupe
- [ ] Voir les membres d'un groupe

---

## 📝 Comptes de Démo (Seeds)

Email : `alice@solalys.com` | Password : `password123`
Email : `bob@solalys.com` | Password : `password123`
Email : `charlie@solalys.com` | Password : `password123`
Email : `diana@solalys.com` | Password : `password123`

---

## 🆘 En cas de problème

**API ne démarre pas :**
```bash
cd solalys-api
yarn install
npx prisma generate
yarn build
yarn start:dev
```

**App mobile ne build pas :**
```bash
cd solalys-app
yarn install
yarn start
```

**Base de données vide :**
```bash
cd solalys-api
yarn seed
```
