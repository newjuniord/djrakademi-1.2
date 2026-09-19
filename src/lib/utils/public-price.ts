const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const useHTG = timezone === 'America/Port-au-Prince';

export function formatPublicPrice(price: number, priceUsd?: number): string {
	if (useHTG) return `${price.toLocaleString('fr-FR')} HTG`;
	return priceUsd && priceUsd > 0 ? `$${priceUsd.toLocaleString('en-US')} USD` : '';
}
