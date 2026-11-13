# Activer le partage familial

Le module est livré, mais aucune base de données distante n’est encore connectée. Le thème terracotta reste une proposition séparée, à valider.

1. Créer un projet sur https://supabase.com/dashboard. Garder le mot de passe de la base dans son gestionnaire de mots de passe.
2. Dans SQL Editor, exécuter `setup.sql` une seule fois. Le script crée les tables privées, les droits d’accès par famille et les fonctions de modification, puis active les événements Realtime.
3. Dans Authentication → URL Configuration, ajouter l’URL du site Petit Pas dans Site URL et Redirect URLs. Pour ce dépôt : `https://drdracula1618.github.io/Petit-Pas/` si Pages est bien publié à cette adresse.
4. Configurer l’envoi des e-mails de connexion dans les réglages SMTP de Supabase avant d’inviter les deux parents. Le service e-mail de démonstration peut restreindre les destinataires : ne pas le considérer comme prêt pour toute la famille.
5. Dans Petit Pas → Partage en famille, saisir l’URL du projet et sa clé **publique publishable ou anon**. Ne jamais utiliser de clé `service_role`, de clé secrète, ni le mot de passe de la base.
6. Se connecter par lien e-mail sur le premier appareil. Cliquer sur « Créer notre espace avec mes données ». Les données de cet appareil deviennent celles de l’espace familial.
7. Créer un code d’invitation et le transmettre au conjoint. Sur son appareil : saisir la même URL et clé publique, se connecter avec sa propre adresse, puis rejoindre avec le code. Exporter d’abord ses éventuelles données locales : rejoindre affiche les données de l’espace partagé, sans importer automatiquement les données locales du deuxième appareil.

Le code d’invitation est à usage unique et expire après 7 jours. Un nouveau code invalide le précédent. Chaque compte appartient à un espace. Les données ne sont lisibles que par les membres authentifiés ; les écritures passent par une fonction qui contrôle l’appartenance à la famille et verrouille la ligne pendant la mise à jour.

Les modifications sont envoyées par enregistrement. Deux ajouts simultanés sont conservés. En cas de modification simultanée du même événement, la dernière écriture reçue gagne. Les changements non envoyés sont gardés dans une file locale et réessayés à la reconnexion. Le thème, le menu et l’enfant sélectionné restent propres à l’appareil.

La synchronisation distante doit encore être testée avec deux comptes sur un vrai projet Supabase après configuration. Les contrôles locaux couvrent les opérations concurrentes et l’interface, sans remplacer ce test.

## Récaps par e-mail

« E-mails et récaps » permet d’ajouter plusieurs adresses et de préparer le récapitulatif de la date sélectionnée. Le bouton d’envoi ouvre la messagerie avec le texte prérempli ; l’utilisateur confirme l’envoi. Les notifications et récaps automatiques ne sont pas activés. Ils nécessitent un service d’envoi et une tâche serveur planifiée, à configurer séparément.

## Documentation

- https://supabase.com/docs/guides/realtime/postgres-changes
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/reference/javascript/auth-signinwithotp
