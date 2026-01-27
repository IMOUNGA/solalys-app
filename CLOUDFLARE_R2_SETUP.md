# Configuration de Cloudflare R2 pour Solalys

Ce guide vous explique comment configurer Cloudflare R2 pour l'upload d'images dans l'application Solalys.

## 📋 Prérequis

- Un compte Cloudflare
- Accès au dashboard Cloudflare R2

## 🚀 Étapes de configuration

### 1. Créer un bucket R2

1. Connectez-vous à votre [dashboard Cloudflare](https://dash.cloudflare.com)
2. Dans la barre latérale, cliquez sur **R2**
3. Cliquez sur **Create bucket**
4. Nommez votre bucket : `solalys-images` (ou un autre nom de votre choix)
5. Choisissez la région (laisser **Automatic** est recommandé)
6. Cliquez sur **Create bucket**

### 2. Créer un API Token R2

1. Dans la page R2, cliquez sur **Manage R2 API Tokens**
2. Cliquez sur **Create API Token**
3. Donnez un nom à votre token : `solalys-upload-token`
4. **Permissions** :
   - Sélectionnez **Object Read & Write**
   - Appliquez à : **Specific bucket** → sélectionnez `solalys-images`
5. **TTL** : Laisser vide pour un token permanent
6. Cliquez sur **Create API Token**

⚠️ **IMPORTANT** : Copiez immédiatement les informations suivantes (elles ne seront plus affichées) :
- **Access Key ID**
- **Secret Access Key**

### 3. Récupérer votre Account ID

1. Toujours sur le dashboard Cloudflare
2. Dans la barre latérale, cliquez sur **R2**
3. Votre **Account ID** est affiché en haut de la page R2
4. Copiez-le

### 4. Configurer les variables d'environnement

1. Créez un fichier `.env` à la racine de votre projet :
   ```bash
   cp .env.example .env
   ```

2. Ouvrez le fichier `.env` et remplissez les valeurs :
   ```env
   # Cloudflare R2 Configuration
   EXPO_PUBLIC_R2_ACCOUNT_ID=votre_account_id_ici
   EXPO_PUBLIC_R2_ACCESS_KEY_ID=votre_access_key_id_ici
   EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=votre_secret_access_key_ici
   EXPO_PUBLIC_R2_BUCKET_NAME=solalys-images
   EXPO_PUBLIC_R2_REGION=auto
   ```

   ⚠️ **Note** : Dans Expo, les variables d'environnement doivent commencer par `EXPO_PUBLIC_` pour être accessibles côté client.

3. **N'oubliez pas** d'ajouter `.env` dans votre `.gitignore` :
   ```bash
   echo ".env" >> .gitignore
   ```

### 5. (Optionnel) Configurer un domaine personnalisé

Pour utiliser votre propre domaine au lieu de l'URL R2 par défaut :

1. Dans votre bucket R2, allez dans **Settings**
2. Cliquez sur **Connect Domain**
3. Entrez votre domaine personnalisé (ex: `images.solalys.com`)
4. Suivez les instructions pour configurer le DNS
5. Une fois configuré, ajoutez cette ligne à votre `.env` :
   ```env
   EXPO_PUBLIC_R2_PUBLIC_URL=https://images.solalys.com
   ```

### 6. Tester la configuration

1. Redémarrez votre serveur Expo :
   ```bash
   yarn start
   ```

2. Dans l'app, allez dans la création d'annonce → Étape 6 (Photos)
3. Si R2 est correctement configuré, vous ne verrez plus le message d'avertissement orange
4. Essayez d'ajouter une photo pour tester l'upload

## 📁 Structure des images sur R2

Les images sont organisées de manière logique pour faciliter la gestion :

```
images/
├── publications/
│   ├── {publicationId}/
│   │   ├── photo-1.jpg
│   │   ├── photo-2.jpg
│   │   └── photo-3.jpg
└── profil/
    └── {userId}/
        └── avatar.jpg
```

**Avantages** :
- ✅ Facile de retrouver toutes les images d'une publication
- ✅ Suppression simple (supprimer le dossier)
- ✅ Organisation claire et maintenable

📖 Pour plus de détails, consulte `IMAGES_STRUCTURE.md`

## 📊 Limites et coûts

### Limites de l'application
- **Minimum** : 3 photos par annonce
- **Maximum** : 15 photos par annonce
- **Taille max** : 10 MB par image

### Tarification Cloudflare R2 (2024)
- ✅ **GRATUIT** jusqu'à 100 000 images stockées
- **5$/mois** par tranche de 100 000 images supplémentaires
- **1$/mois** par 100 000 images servies
- **Pas de frais de sortie** (egress) - contrairement à AWS S3

**Exemple de coûts** :
- 1 000 annonces × 10 photos = 10 000 images → **GRATUIT** 🎉
- 10 000 annonces × 10 photos = 100 000 images → **toujours GRATUIT**

## 🔒 Sécurité

- ✅ Les credentials R2 sont stockés uniquement dans `.env` (non versionné)
- ✅ Chaque image a un nom unique (UUID) pour éviter les collisions
- ✅ Les images sont organisées par date : `images/2024/12/uuid.jpg`
- ✅ Les permissions R2 sont limitées au bucket spécifique

## 🔄 Migration vers AWS S3 (si nécessaire)

Grâce à la compatibilité S3 de R2, migrer vers AWS S3 est simple :

1. Changez l'endpoint dans `r2UploadService.ts` :
   ```typescript
   endpoint: `https://s3.${region}.amazonaws.com`
   ```

2. Mettez à jour vos credentials avec ceux d'AWS

3. Le reste du code reste identique !

## 📞 Support

Pour toute question :
- Documentation R2 : https://developers.cloudflare.com/r2/
- Documentation expo-image-picker : https://docs.expo.dev/versions/latest/sdk/imagepicker/

## ✅ Checklist de vérification

- [ ] Bucket R2 créé
- [ ] API Token créé et copié
- [ ] Account ID copié
- [ ] Fichier `.env` créé et rempli
- [ ] `.env` ajouté au `.gitignore`
- [ ] Application redémarrée
- [ ] Upload testé avec succès
