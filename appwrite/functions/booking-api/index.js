// Legacy endpoint retained only to return an explicit migration response.
// Dynamic booking creation is handled by the authenticated SvelteKit /api/bookings route.
export default async ({ res }) => res.json({
  message: 'Cette Function a été remplacée par l’API de réservation dynamique.'
}, 410);
