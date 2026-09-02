# Coaching booking — Appwrite setup

`schema.json` is the single source of truth for the TablesDB data model. Storage fields use `snake_case`; Svelte/TypeScript models use `camelCase` and are converted only by the service mappers. To create every missing database/table from this schema, run `APPWRITE_API_KEY=... npm run setup:schema` from the `appwrite/` directory. Existing tables are preserved and must be migrated separately before renaming columns.

## Security model

- `coaching_services`: public read, admin team write.
- `coaching_slots`: public read only. All writes go through an authenticated admin surface or Functions.
- `bookings` and `payments`: no client permissions. Functions have the required TablesDB scopes.
- Never expose `APPWRITE_FUNCTION_API_KEY` or payment-provider secrets to SvelteKit public environment variables.
- Keep the final price, slot hold, payment state and confirmation inside Functions.

## Functions

Use `appwrite/` as the root directory for both Functions, `npm install` as the build command, and the relevant `functions/.../index.js` file as each entrypoint. This keeps the booking rules shared and tested once.

### `booking-api`

- Execute permission: `any` (guest bookings are supported).
- TablesDB scopes: rows read/write and transactions read/write.
- POST `{ slotId, customerName, customerEmail, customerWhatsapp, customerTimezone }` to create an atomic hold.
- POST `{ action: "create_payment", bookingId }` to create the provider payment.

### `booking-maintenance`

- No public execute permission.
- Schedule: `*/2 * * * *`.
- TablesDB scopes: rows read/write and transactions read/write.
- It queries only pending payments and expired pending bookings (maximum 100 per run).

## Variables

Set these as Appwrite Function variables, then redeploy:

- `COACHING_DATABASE_ID=djrakademi`
- `PAYMENT_PROVIDER=<provider-name>`
- `PAYMENT_CREATE_URL=<server-to-server-create-endpoint>`
- `PAYMENT_STATUS_URL=<server-to-server-status-endpoint>`
- `PAYMENT_PROVIDER_SECRET=<secret>` (mark as secret)
- `PUBLIC_SITE_URL=https://your-domain.example`

Set `PUBLIC_APPWRITE_BOOKING_API_URL` on the SvelteKit site to the public domain of `booking-api`. When it is absent, the UI intentionally uses the local demo flow.

Appwrite injects `APPWRITE_FUNCTION_API_ENDPOINT`, `APPWRITE_FUNCTION_PROJECT_ID` and `APPWRITE_FUNCTION_API_KEY` automatically.

The provider endpoints must return:

- Create: `{ "transactionId": "...", "paymentUrl": "https://..." }`
- Status: `{ "status": "pending|paid|failed|expired" }`

Until a real payment provider is selected and these variables are configured, paid sessions intentionally fail closed rather than being confirmed.

## Admin health API

The admin health page contains no demo fallback. Set `PUBLIC_APPWRITE_ADMIN_HEALTH_API_URL` to the secured Function/API endpoint. Until it is configured or when it fails, the page displays an unavailable state and an empty log list.

The endpoint must return JSON shaped as follows:

```json
{
  "status": "operational",
  "statusCode": 200,
  "statusText": "OK",
  "checkedAt": "2026-08-29T00:00:00.000Z",
  "logs": []
}
```

Never return authorization headers, cookies, passwords, API keys, webhook signatures, or payment secrets in log payloads.

### `payment-maintenance`

- No public execute permission.
- Schedule: `*/15 * * * *`.
- TablesDB scopes: rows read/write.
- It marks pending orders older than 60 minutes as failed without calling Plopplop (up to 200 per run), then verifies up to 50 recent pending orders per run.
- Only `trans_status: "ok"` can mark an order paid and grant course/ebook access or confirm coaching.
- Access grants use the unique `(user_id,item_type,item_id)` index and an Appwrite transaction to prevent duplicates.

Required Function variables: `PAYMENTS_DATABASE_ID=djrakademi` and `PLOPPLOP_CLIENT_ID`. `PLOPPLOP_API_KEY` or `PLOPPLOP_SECRET_KEY` can optionally be added as secret variables; `PLOPPLOP_VERIFY_URL` is optional.
