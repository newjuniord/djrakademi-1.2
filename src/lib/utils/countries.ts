export interface Country {
	code: string;
	name: string;
	nameHt?: string;
	dialCode: string;
	flag: string;
}

export const COUNTRIES: Country[] = [
	{ code: 'HT', name: 'Haïti', nameHt: 'Ayiti', dialCode: '+509', flag: '🇭🇹' },
	{ code: 'US', name: 'États-Unis', nameHt: 'Etazini', dialCode: '+1', flag: '🇺🇸' },
	{ code: 'CA', name: 'Canada', nameHt: 'Kanada', dialCode: '+1', flag: '🇨🇦' },
	{ code: 'FR', name: 'France', nameHt: 'Frans', dialCode: '+33', flag: '🇫🇷' },
	{ code: 'DO', name: 'République Dominicaine', nameHt: 'Repiblik Dominikèn', dialCode: '+1', flag: '🇩🇴' },
	{ code: 'CL', name: 'Chili', nameHt: 'Chili', dialCode: '+56', flag: '🇨🇱' },
	{ code: 'BR', name: 'Brésil', nameHt: 'Brezil', dialCode: '+55', flag: '🇧🇷' },
	{ code: 'GP', name: 'Guadeloupe', nameHt: 'Gwadloup', dialCode: '+590', flag: '🇬🇵' },
	{ code: 'MQ', name: 'Martinique', nameHt: 'Matinik', dialCode: '+596', flag: '🇲🇶' },
	{ code: 'GF', name: 'Guyane française', nameHt: 'Giyàn franse', dialCode: '+594', flag: '🇬🇫' },
	{ code: 'MX', name: 'Mexique', nameHt: 'Meksik', dialCode: '+52', flag: '🇲🇽' },
	{ code: 'CO', name: 'Colombie', nameHt: 'Kolonbi', dialCode: '+57', flag: '🇨🇴' },
	{ code: 'AR', name: 'Argentine', nameHt: 'Ajantin', dialCode: '+54', flag: '🇦🇷' },
	{ code: 'PE', name: 'Pérou', nameHt: 'Pewou', dialCode: '+51', flag: '🇵🇪' },
	{ code: 'EC', name: 'Équateur', nameHt: 'Ekwatè', dialCode: '+593', flag: '🇪🇨' },
	{ code: 'ES', name: 'Espagne', nameHt: 'Espay', dialCode: '+34', flag: '🇪🇸' },
	{ code: 'GB', name: 'Royaume-Uni', nameHt: 'Rwayom-Ini', dialCode: '+44', flag: '🇬🇧' },
	{ code: 'DE', name: 'Allemagne', nameHt: 'Almay', dialCode: '+49', flag: '🇩🇪' },
	{ code: 'BE', name: 'Belgique', nameHt: 'Bèljik', dialCode: '+32', flag: '🇧🇪' },
	{ code: 'CH', name: 'Suisse', nameHt: 'Swis', dialCode: '+41', flag: '🇨🇭' },
	{ code: 'CI', name: 'Côte d\'Ivoire', nameHt: 'Kòt divwar', dialCode: '+225', flag: '🇨🇮' },
	{ code: 'SN', name: 'Sénégal', nameHt: 'Senegal', dialCode: '+221', flag: '🇸🇳' },
	{ code: 'CM', name: 'Cameroun', nameHt: 'Kamewoun', dialCode: '+237', flag: '🇨🇲' },
	{ code: 'CD', name: 'RDC (Congo)', nameHt: 'RDC (Kongo)', dialCode: '+243', flag: '🇨🇩' },
	{ code: 'CG', name: 'Congo-Brazzaville', nameHt: 'Kongo', dialCode: '+242', flag: '🇨🇬' },
	{ code: 'GA', name: 'Gabon', nameHt: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
	{ code: 'MA', name: 'Maroc', nameHt: 'Maròk', dialCode: '+212', flag: '🇲🇦' },
	{ code: 'DZ', name: 'Algérie', nameHt: 'Aljeri', dialCode: '+213', flag: '🇩🇿' },
	{ code: 'TN', name: 'Tunisie', nameHt: 'Tinizi', dialCode: '+216', flag: '🇹🇳' },
	{ code: 'JM', name: 'Jamaïque', nameHt: 'Jamayik', dialCode: '+1', flag: '🇯🇲' },
	{ code: 'TT', name: 'Trinité-et-Tobago', nameHt: 'Trinite ak Tobago', dialCode: '+1', flag: '🇹🇹' },
	{ code: 'BS', name: 'Bahamas', nameHt: 'Bahamas', dialCode: '+1', flag: '🇧🇸' },
	{ code: 'BB', name: 'Barbade', nameHt: 'Barbad', dialCode: '+1', flag: '🇧🇧' },
	{ code: 'SX', name: 'Saint-Martin', nameHt: 'Sen Marten', dialCode: '+1', flag: '🇸🇽' },
	{ code: 'AW', name: 'Aruba', nameHt: 'Aruba', dialCode: '+297', flag: '🇦🇼' },
	{ code: 'CW', name: 'Curaçao', nameHt: 'Kirasao', dialCode: '+599', flag: '🇨🇼' },
	{ code: 'SR', name: 'Suriname', nameHt: 'Sirinam', dialCode: '+597', flag: '🇸🇷' },
	{ code: 'GY', name: 'Guyana', nameHt: 'Giyana', dialCode: '+592', flag: '🇬🇾' },
	{ code: 'IT', name: 'Italie', nameHt: 'Itali', dialCode: '+39', flag: '🇮🇹' },
	{ code: 'PT', name: 'Portugal', nameHt: 'Pòtigal', dialCode: '+351', flag: '🇵🇹' },
	{ code: 'NL', name: 'Pays-Bas', nameHt: 'Peyi-Ba', dialCode: '+31', flag: '🇳🇱' },
	{ code: 'SE', name: 'Suède', nameHt: 'Syèd', dialCode: '+46', flag: '🇸🇪' },
	{ code: 'NO', name: 'Norvège', nameHt: 'Nòvèj', dialCode: '+47', flag: '🇳🇴' },
	{ code: 'DK', name: 'Danemark', nameHt: 'Danmak', dialCode: '+45', flag: '🇩🇰' },
	{ code: 'FI', name: 'Finlande', nameHt: 'Fenlann', dialCode: '+358', flag: '🇫🇮' },
	{ code: 'IE', name: 'Irlande', nameHt: 'Irlann', dialCode: '+353', flag: '🇮🇪' },
	{ code: 'PL', name: 'Pologne', nameHt: 'Polòy', dialCode: '+48', flag: '🇵🇱' },
	{ code: 'RO', name: 'Roumanie', nameHt: 'Woumani', dialCode: '+40', flag: '🇷🇴' },
	{ code: 'TR', name: 'Turquie', nameHt: 'Turki', dialCode: '+90', flag: '🇹🇷' },
	{ code: 'AE', name: 'Émirats Arabes Unis', nameHt: 'Emira Arab Ini', dialCode: '+971', flag: '🇦🇪' },
	{ code: 'SA', name: 'Arabie Saoudite', nameHt: 'Arabi Saoudit', dialCode: '+966', flag: '🇸🇦' },
	{ code: 'IN', name: 'Inde', nameHt: 'Enn', dialCode: '+91', flag: '🇮🇳' },
	{ code: 'CN', name: 'Chine', nameHt: 'Lachin', dialCode: '+86', flag: '🇨🇳' },
	{ code: 'JP', name: 'Japon', nameHt: 'Japon', dialCode: '+81', flag: '🇯🇵' },
	{ code: 'AU', name: 'Australie', nameHt: 'Ostrali', dialCode: '+61', flag: '🇦🇺' },
	{ code: 'ZA', name: 'Afrique du Sud', nameHt: 'Afrik disid', dialCode: '+27', flag: '🇿🇦' },
	{ code: 'NG', name: 'Nigeria', nameHt: 'Nijerya', dialCode: '+234', flag: '🇳🇬' },
	{ code: 'GH', name: 'Ghana', nameHt: 'Gana', dialCode: '+233', flag: '🇬🇭' },
	{ code: 'KE', name: 'Kenya', nameHt: 'Kenya', dialCode: '+254', flag: '🇰🇪' }
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Haiti (+509)

export function parsePhoneNumber(phone: string): { country: Country; nationalNumber: string } {
	if (!phone) {
		return { country: DEFAULT_COUNTRY, nationalNumber: '' };
	}
	const clean = phone.trim();
	if (!clean.startsWith('+')) {
		return { country: DEFAULT_COUNTRY, nationalNumber: clean.replace(/\D/g, '') };
	}

	// Try to match longest dialCode from COUNTRIES
	const sortedByCodeLen = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
	for (const country of sortedByCodeLen) {
		if (clean.startsWith(country.dialCode)) {
			const rest = clean.slice(country.dialCode.length).replace(/\D/g, '');
			return { country, nationalNumber: rest };
		}
	}

	return { country: DEFAULT_COUNTRY, nationalNumber: clean.replace(/[^\d]/g, '') };
}
