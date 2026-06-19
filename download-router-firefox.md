# Download Router for Firefox

## Contexte

Créer une extension Firefox permettant de router automatiquement les téléchargements vers des sous-dossiers du dossier de téléchargement en fonction de règles définies par l'utilisateur.

Firefox permet uniquement :
- un dossier fixe ;
- demander à chaque téléchargement.

L'objectif est d'obtenir un fonctionnement proche des filtres e-mail.

---

## Fonctionnalités MVP

### Interception des téléchargements

Utiliser l'API :

```js
browser.downloads.onDeterminingFilename
```

afin de modifier dynamiquement le chemin de destination.

### Gestion des règles

```typescript
interface Rule {
  id: string;
  enabled: boolean;
  priority: number;

  domain?: string;
  urlRegex?: string;
  filenameRegex?: string;
  extension?: string;
  mimeType?: string;

  destination: string;
}
```

### Critères supportés

- Domaine
- URL complète (regex)
- Nom de fichier (regex)
- Extension
- MIME type

### Priorités

Première règle gagnante.

Exemple :

```text
10 -> GitHub Releases
20 -> GitHub
30 -> PDF
40 -> Images
```

### Destination

Chemins relatifs au dossier de téléchargement Firefox.

Exemples :

```text
GitHub
GitHub/Releases
PDF
Images
Administratif
```

---

## Interface utilisateur

### Page Options

- Ajouter une règle
- Modifier une règle
- Supprimer une règle
- Activer / désactiver
- Déplacer haut / bas

### Testeur de règles

Entrée :

```text
URL:
https://github.com/foo/bar/releases/download/v1/app.zip

Nom:
app.zip

Mime:
application/zip
```

Résultat :

```text
Matched rule:
GitHub Releases

Destination:
GitHub/Releases
```

---

## Historique

```typescript
interface DownloadLog {
  timestamp: number;
  filename: string;
  sourceUrl: string;
  matchedRule?: string;
  destination: string;
}
```

Conserver localement les 100 derniers téléchargements routés.

---

## Stockage

Utiliser :

```js
browser.storage.local
```

pour :
- règles ;
- préférences ;
- historique.

---

## Exemples de règles par défaut

```yaml
- name: GitHub Releases
  domain: github.com
  urlRegex: "/releases/"
  destination: GitHub/Releases

- name: PDF
  extension: pdf
  destination: PDF

- name: Images
  extension: jpg|jpeg|png|webp
  destination: Images

- name: Archives
  extension: zip|tar.gz|7z
  destination: Archives

- name: Installers
  extension: dmg|exe|msi|apk
  destination: Installers
```

---

## Bonus V2

### Variables

```text
Sites/{domain}
Archives/{year}/{month}
```

Variables disponibles :

```text
{domain}
{filename}
{extension}
{year}
{month}
```

### Export / Import

```json
{
  "rules": []
}
```

### Synchronisation Firefox

```js
browser.storage.sync
```

---

## Contraintes techniques

- TypeScript
- Manifest V3
- Firefox Desktop
- Aucun backend
- Aucun tracking
- Aucun service externe
- Open source
- Licence MIT

---

## Vision

Une extension légère permettant d'organiser automatiquement les téléchargements comme on organise ses e-mails avec des filtres.

Exemple :

```text
github.com      -> GitHub/
*.gouv.fr       -> Administratif/
*.pdf           -> PDF/
*.zip           -> Archives/
```
