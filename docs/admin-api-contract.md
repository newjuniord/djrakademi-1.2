# Contrat API de l’administration

Le frontend utilise par défaut le préfixe local `/api/admin`. Il peut être remplacé par
`PUBLIC_ADMIN_API_PATH`, qui doit rester un chemin du même domaine commençant par `/`.

Toutes les routes doivent vérifier la session côté serveur et le rôle administrateur avant
d’accéder à Appwrite. Une réponse d’erreur utilise `{ "message": "..." }`. Les dates sont au
format ISO 8601 et les montants sont des entiers en HTG.

## Routes

- `GET /session` → `{ id, name, email }`
- `GET /overview` → `{ revenue, paidOrders, totalUsers, totalBookings, recentOrders, recentUsers, upcomingBookings }`
- `GET /users?page&limit&search&status` → `{ items, total }`
- `GET /users/:id` → utilisateur avec `courseCount`, `ebookCount` et `whatsapp`
- `PATCH /users/:id/status` avec `{ status: "active" | "disabled" }` → utilisateur mis à jour
- `GET /products` → `[{ id, title, type: "course" | "ebook" }]`
- `POST /access-grants` avec `{ userId, itemType, itemId }` → `{ created: boolean }`
- `GET /orders?page&limit&search&status&type` → `{ items, total, summary: { paid, pending, failed, expired } }`; chaque commande fournit `accessGranted`
- `GET /settings` → `{ siteName, tagline, contactEmail, whatsappNumber, timezone, currency: "HTG", logoUrl? }`
- `PUT /settings` en `multipart/form-data` : champ `settings` contenant le JSON précédent et champ `logo` optionnel → paramètres enregistrés

## Règles importantes

- `POST /access-grants` doit être idempotent grâce à l’index unique `(user_id,item_type,item_id)`.
- La désactivation doit être appliquée par l’API à Appwrite Auth et à `profiles.status`, pas seulement à l’affichage.
- Les statistiques et les totaux sont calculés côté serveur sur l’ensemble des lignes, pas uniquement la page courante.
- Le logo est validé à nouveau côté serveur (PNG/JPG/WEBP/SVG, 2 Mo maximum), stocké dans Appwrite Storage, puis son identifiant est persisté avec les paramètres.
- Le remplacement du logo supprime l’ancien fichier seulement après la réussite de la mise à jour.
- Les routes ne doivent jamais envoyer de clé API Appwrite au navigateur.
