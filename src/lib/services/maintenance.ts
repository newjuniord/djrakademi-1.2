export interface MaintenanceStatus {
	enabled: boolean;
	message: string;
}

export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
	const response = await fetch('/api/maintenance', { cache: 'no-store' });
	if (!response.ok) return { enabled: false, message: '' };
	return response.json();

}
