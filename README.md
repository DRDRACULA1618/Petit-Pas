# Petit Pas

Habit Tracker for Little Heart & Little Angel

Application web familiale, en français, pour suivre les petits événements du quotidien de chaque enfant.

## Version 0.2.0

- Barre latérale repliable sur ordinateur, menu vertical sur mobile avec bouton en haut à droite.
- Crayon à côté de chaque enfant pour corriger directement son prénom.
- E-mails et récaps : plusieurs adresses, récapitulatif du jour sélectionné, ouverture de la messagerie pour envoi manuel.
- Module de partage familial Supabase préparé : **non actif tant que le projet distant n’est pas configuré**. Suivre [le guide de connexion](supabase/README.md).
- Proposition terracotta soumise à validation ; le thème courant reste inchangé.

Vérifications locales : `node scripts/check.cjs` et `node scripts/check-sync.mjs`.
Le test navigateur `scripts/check-ui.cjs` nécessite Playwright, Chromium et un serveur local sur le port 8765 servant le dossier parent du dépôt sous `/Petit-Pas/`. Il n’a pas pu être exécuté dans l’environnement de création : lancement de Chromium bloqué. Le partage doit encore être vérifié avec deux vrais comptes après configuration de Supabase.

## Fonctions initiales

- Frise hebdomadaire : une ligne par habitude et une colonne par jour.
- Bouton « Maintenant » : enregistrement immédiat de la date et de l’heure.
- Ajout rétroactif : date seule ou date et heure, avec notes facultatives.
- Modification et suppression des marqueurs.
- Achats de lait, achats de couches, selles, nuits difficiles, rendez-vous médicaux et vaccins.
- Suivis personnalisés : nom, couleur et icône.
- Profils séparés pour plusieurs enfants.
- Calendrier, journal et historique santé.
- Thèmes clair et sombre noir avec boutons aux contours bleus.
- Logo : empreinte de bébé à la place du « e » de Petit ; même symbole pour l’accueil.
- Sauvegarde et restauration au format JSON.

## Utilisation

Ouvrir `index.html` dans un navigateur moderne autorisant JavaScript. Aucun serveur, paquet ou compte supplémentaire n’est nécessaire pour la version locale.

Pour utiliser le partage, ouvrir le site publié via HTTPS. Le fichier local reste utilisable pour les fonctions de suivi sans synchronisation.

## Publication GitHub Pages

Dans le dépôt : **Settings → Pages → Build and deployment → Source → Deploy from a branch**.
Sélectionner **main**, puis **/ (root)**, et enregistrer.

L’URL proposée par GitHub sera visible sur cette page après la première publication. Ne pas considérer le site comme publié avant de vérifier cette URL.

Le dépôt est public. Les données familiales ne doivent jamais être ajoutées aux fichiers du dépôt. Le partage Supabase utilise une authentification et des droits privés propres à chaque famille.

Documentation : https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Données

L’interface est statique. Sans configuration du partage, elle fonctionne uniquement sur cet appareil. Avec un projet Supabase configuré, les membres d’une même famille partagent les données en temps réel. Les données sont enregistrées dans le stockage local du navigateur, sous la clé historique `petit-a-petit-v1`, conservée pour assurer la compatibilité avec les premiers prototypes.

Les informations saisies et les sauvegardes familiales ne sont pas envoyées dans ce dépôt. Utiliser « Exporter » pour conserver une sauvegarde JSON et « Importer » pour la restaurer après confirmation.

Les données du fichier local et celles d’un futur site en ligne sont dans des espaces de stockage différents : exporter depuis l’ancienne version puis importer sur le site pour les transférer.

## Mises à jour et retours en arrière

`main` contient la version courante. Le fichier `VERSION` et `CHANGELOG.md` identifient les changements.

La branche `versions/v0.1.0` conserve la première version complète. Lors de prochaines versions stables, créer une nouvelle branche `versions/vX.Y.Z` à partir du commit publié et conserver les précédentes.

Pour revenir à une version, restaurer ses fichiers dans un nouveau commit sur `main`, puis republier. L’historique reste intact. On peut demander : « Remets Petit Pas en version 0.1.0 ».

Un retour en arrière du code ne restaure pas les données familiales. Exporter une sauvegarde avant une mise à jour qui change leur format.

## Vérification

Avec Node.js installé :

```sh
node scripts/check.cjs
```

Ces contrôles vérifient la logique de saisie instantanée, la date sans heure, la modification, les profils séparés, la personnalisation, les thèmes, la sauvegarde et les actions des menus dans un environnement DOM simulé. Ils ne remplacent pas un test visuel dans Safari ou Chrome.
