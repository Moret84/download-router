# AMO listing content

Copy-paste material for the addons.mozilla.org listing. Not shipped in the
extension.

## Name

Download Router

## Summary (max 250 chars)

**EN:** Route your downloads into any folder automatically, like email filters.
Match by domain, URL, filename, extension or MIME type. Requires a small
open-source helper (one-click install, runs only while a download is routed).

**FR:** Range automatiquement tes téléchargements dans n'importe quel dossier,
comme des filtres e-mail. Critères : domaine, URL, nom, extension, type MIME.
Nécessite un petit helper open-source (installation en un clic).

## Description

**EN:**

Firefox only lets you pick one fixed download folder or asks every time.
Download Router sorts downloads automatically with rules, the way email filters
sort mail.

- Match on domain (and subdomains), full URL (regex), filename (regex),
  extension or MIME type. The first matching rule wins.
- Send files to any folder, not just subfolders of Downloads, using absolute or
  ~ paths and variables like {domain}, {year}, {month}.
- A rule tester previews where a download would go before you rely on it.
- Rules sync across your devices; export/import them as JSON.
- 100% local. No account, no server, no tracking.

Why a helper app? Firefox cannot move files on disk by itself, so Download
Router uses a small native helper (open source, MIT). It runs only when a
download is routed and only writes to folders you allow.

**FR:**

Firefox ne propose qu'un seul dossier de téléchargement fixe, ou la question à
chaque fois. Download Router range tes téléchargements automatiquement avec des
règles, comme des filtres e-mail.

- Critères : domaine (et sous-domaines), URL complète (regex), nom de fichier
  (regex), extension ou type MIME. La première règle qui correspond gagne.
- Destination vers n'importe quel dossier (pas seulement sous Téléchargements),
  en chemin absolu ou ~, avec des variables {domain}, {year}, {month}.
- Un testeur de règles montre où irait un téléchargement avant de t'y fier.
- Les règles se synchronisent entre tes appareils ; export/import en JSON.
- 100% local. Aucun compte, aucun serveur, aucun tracking.

Pourquoi un helper ? Firefox ne peut pas déplacer de fichiers lui-même ;
Download Router utilise donc un petit programme natif (open source, MIT) qui ne
s'exécute que pendant un routage et n'écrit que dans les dossiers autorisés.

## Permissions justification (for reviewers)

- **downloads** — detect when a download completes and read its URL/filename to
  match rules.
- **storage** — store the user's rules and the recent-downloads history locally
  (storage.sync for rules, storage.local for history).
- **nativeMessaging** — talk to the companion native host that moves the
  finished file. WebExtensions cannot move files on disk; this is the only way
  to route into arbitrary folders.

## Note to reviewers

The extension is non-functional without the companion native host (it only
moves files when the host is present). The host is open source and built from
this repository (see `host/`); installers are published on the project's GitHub
releases. With no host installed, the extension does nothing harmful — downloads
simply stay in their default location.

The extension is bundled with esbuild; build from source with:

```
cd extension && npm ci && npm run build
```

## Privacy policy

Download Router collects no data. Everything stays on your device: rules and
history are kept in the browser's local/sync storage, and the native helper only
moves files locally into folders you have allowed. No data is sent to any server
and there is no tracking or analytics.

## Suggested categories

Productivity / Download Management

## Support

Project repository and issues: https://github.com/Moret84/download-router
