# Structure des images sur Cloudflare R2

## 📁 Organisation des dossiers

Les images sont organisées par **type** et par **ID de ressource** :

```
images/
├── publications/
│   ├── {publicationId-1}/
│   │   ├── photo-1.jpg
│   │   ├── photo-2.jpg
│   │   └── photo-3.jpg
│   └── {publicationId-2}/
│       ├── photo-1.jpg
│       └── photo-2.jpg
└── profil/
    ├── {userId-1}/
    │   └── avatar.jpg
    └── {userId-2}/
        └── avatar.jpg
```

## 🎯 Avantages de cette structure

✅ **Facilité de recherche** : Toutes les images d'une publication sont au même endroit
✅ **Suppression facile** : Supprimer une publication = supprimer son dossier
✅ **Organisation logique** : Clair et maintenable
✅ **Permissions granulaires** : Possibilité de gérer les permissions par dossier

## 💡 Utilisation dans le formulaire de création

### 1. Générer un UUID pour la publication

Dès le **début du formulaire**, génère un UUID qui servira d'identifiant à la publication :

```typescript
import { v4 as uuidv4 } from 'uuid';

// Dans ton composant de formulaire (create-annonce.tsx)
const [publicationId] = useState(() => uuidv4());
```

### 2. Passer le publicationId à Step6Photos

```typescript
<Step6Photos
    publicationId={publicationId}
    images={formData.images}
    onImagesChange={(images) => setFormData({ ...formData, images })}
/>
```

### 3. Enregistrer la publication en base

Quand l'utilisateur soumet le formulaire, utilise le **même publicationId** :

```typescript
const handleSubmit = async () => {
    const publication = {
        id: publicationId, // ← UUID généré au début
        title: formData.title,
        description: formData.description,
        images: formData.images.map(img => img.url), // URLs R2
        // ... autres champs
    };

    await api.createPublication(publication);
};
```

## 📸 Exemple complet

```typescript
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Step6Photos from '@/components/formulaire/Step6Photos';
import { ImageUploadState } from '@/types/image';

export default function CreateAnnonceScreen() {
    // Générer l'ID de publication dès le début
    const [publicationId] = useState(() => uuidv4());

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        images: [] as ImageUploadState[],
        // ... autres champs
    });

    const handleImagesChange = (images: ImageUploadState[]) => {
        setFormData(prev => ({ ...prev, images }));
    };

    const handleSubmit = async () => {
        // Vérifier qu'on a le minimum d'images
        const successfulImages = formData.images.filter(img => img.status === 'success');
        if (successfulImages.length < 3) {
            Alert.alert('Erreur', 'Veuillez ajouter au moins 3 photos');
            return;
        }

        // Créer la publication avec le même ID
        const publication = {
            id: publicationId,
            title: formData.title,
            description: formData.description,
            imageUrls: successfulImages.map(img => img.url),
            imageKeys: successfulImages.map(img => img.key),
            // ... autres champs
        };

        try {
            await api.createPublication(publication);
            Alert.alert('Succès', 'Publication créée avec succès !');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de créer la publication');
        }
    };

    return (
        <View>
            {/* Autres steps du formulaire */}

            <Step6Photos
                publicationId={publicationId}
                images={formData.images}
                onImagesChange={handleImagesChange}
            />

            <Button onPress={handleSubmit} title="Publier" />
        </View>
    );
}
```

## 🗂️ Structure des données

### ImageUploadState

```typescript
interface ImageUploadState {
    id: string;              // UUID de l'image (local)
    localUri: string;        // URI locale (pour preview)
    fileName: string;        // Nom du fichier
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;        // 0-100
    url?: string;            // URL R2 (après upload)
    key?: string;            // Clé R2 (ex: images/publications/abc-123/photo-1.jpg)
    error?: string;          // Message d'erreur
}
```

### Sauvegarde en base de données

Tu peux stocker soit :

**Option 1 : Stocker uniquement les URLs**
```json
{
  "id": "publication-uuid",
  "imageUrls": [
    "https://pub-xxx.r2.dev/images/publications/abc-123/photo-1.jpg",
    "https://pub-xxx.r2.dev/images/publications/abc-123/photo-2.jpg"
  ]
}
```

**Option 2 : Stocker les clés (recommandé)**
```json
{
  "id": "publication-uuid",
  "imageKeys": [
    "images/publications/abc-123/photo-1.jpg",
    "images/publications/abc-123/photo-2.jpg"
  ]
}
```

L'option 2 est meilleure car :
- ✅ Tu peux changer le domaine public sans toucher à la base
- ✅ Plus facile de supprimer les images (tu as les clés)
- ✅ Indépendant de la configuration R2

## 🧹 Nettoyage des images

### Suppression d'une publication

Quand une publication est supprimée, pense à supprimer les images associées :

```typescript
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

async function deletePublicationImages(imageKeys: string[]) {
    const client = createR2Client();

    for (const key of imageKeys) {
        const command = new DeleteObjectCommand({
            Bucket: process.env.EXPO_PUBLIC_R2_BUCKET_NAME,
            Key: key,
        });

        await client.send(command);
    }
}

// Lors de la suppression
await deletePublicationImages(publication.imageKeys);
await api.deletePublication(publicationId);
```

### Images orphelines (future implémentation)

Pour le moment, le nettoyage est manuel. Dans le futur, tu pourras créer un script de cleanup :

```typescript
// Script à exécuter périodiquement
async function cleanupOrphanedImages() {
    // 1. Lister tous les dossiers dans images/publications/
    // 2. Pour chaque dossier, vérifier si la publication existe en base
    // 3. Si la publication n'existe pas, supprimer le dossier
}
```

## 🔮 Photo de profil (à venir)

Pour les photos de profil, la logique sera similaire :

```typescript
<ProfilePhotoUpload
    userId={currentUser.id}
    currentPhoto={user.avatarUrl}
    onPhotoChange={(url) => updateUserPhoto(url)}
/>
```

Structure R2 :
```
images/profil/{userId}/avatar.jpg
```

## ❓ FAQ

### Que se passe-t-il si l'utilisateur abandonne le formulaire ?

Les images resteront sur R2. Pour le MVP, nettoyage manuel. Pour la prod, tu pourras implémenter :
- Un système de "soft delete" côté backend
- Un cleanup job qui supprime les dossiers sans publication associée après X jours

### Peut-on réorganiser l'ordre des photos ?

Oui ! Les photos sont nommées `photo-1.jpg`, `photo-2.jpg`, etc. selon leur index. Pour réorganiser :
1. L'utilisateur déplace les photos dans l'UI
2. Tu renommes les fichiers sur R2 ou
3. Tu stockes l'ordre dans la base (plus simple)

```json
{
  "imageUrls": ["url-3", "url-1", "url-2"] // L'ordre définit l'affichage
}
```

### Que faire si l'upload échoue ?

Le composant gère déjà les erreurs :
- Affichage d'un overlay rouge
- Message d'erreur stocké dans `ImageUploadState.error`
- L'utilisateur peut supprimer et réessayer
