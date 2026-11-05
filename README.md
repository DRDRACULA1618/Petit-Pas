# Petit Pas

Habit Tracker for Little Heart & Little Angel

Application web familiale, en français, pour suivre les petits événements du quotidien de chaque enfant.

## Version 0.1.0

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

Pour l’utiliser sur téléphone depuis une URL, activer la publication web ci-dessous.

## Publication GitHub Pages

Dans le dépôt : **Settings → Pages → Build and deployment → Source → Deploy from a branch**.
Sélectionner **main**, puis **/ (root)**, et enregistrer.

L’URL proposée par GitHub sera visible sur cette page après la première publication. Ne pas considérer le site comme publié avant de vérifier cette URL.

Ce dépôt est privé. GitHub Pages sur un dépôt privé dépend de l’offre du compte ; l’option peut demander une offre payante. Ne pas rendre le dépôt public sans décision explicite du propriétaire. La confidentialité du dépôt n’est pas une authentification pour le site publié.

Documentation : https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Données

Cette version est une application statique, sans API serveur ni synchronisation entre appareils. Les données sont enregistrées dans le stockage local du navigateur, sous la clé historique `petit-a-petit-v1`, conservée pour assurer la compatibilité avec les premiers prototypes.

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
