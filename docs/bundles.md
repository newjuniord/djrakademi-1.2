# Bundles

Les bundles regroupent 2 à 30 formations et/ou e-books publiés. Ils sont créés depuis `/admin/bundles`, affichés sur l’accueil, le catalogue et `/bundles`, puis achetés depuis `/bundles/[id]`.

## Préparer Appwrite

La migration ciblée `appwrite/migrate-bundles.js` ajoute le schéma des bundles, les variantes Lemon Squeezy des cours et ebooks, les valeurs `USD` et `lemonsqueezy` des commandes, ainsi que la table `verification_logs`. Elle ne modifie pas les commandes existantes. Avant d’activer la fonctionnalité dans un environnement, exécuter :

```bash
node --env-file=.env appwrite/migrate-bundles.js
```

Le contenu du bundle est copié dans la commande au début du paiement. Après confirmation, chaque formation ou e-book reçoit un accès individuel dans `access_grants`. La bibliothèque peut restaurer ces accès depuis une commande payée.

## Paiement par carte

MonCash et Natcash utilisent le prix HTG du bundle. Pour proposer aussi le paiement par carte, renseigner une variante Lemon Squeezy propre au bundle et son prix USD dans l’administration. Vérifier que le montant configuré dans Lemon Squeezy correspond au prix USD affiché : le fournisseur facture selon sa variante. Sans ces deux champs, l’option carte est masquée pour le bundle.

Les bundles publiés n’apparaissent que si tous leurs produits sont eux-mêmes publiés. Les produits déjà achetés séparément conservent leurs accès ; une commande de bundle n’ajoute que les droits manquants.
