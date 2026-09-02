export interface ToastItem {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
}

class ToastState {
	items = $state<ToastItem[]>([]);
	private nextId = 1;

	show(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3500) {
		const id = this.nextId++;
		this.items = [...this.items, { id, message, type }];
		setTimeout(() => {
			this.remove(id);
		}, duration);
	}

	success(message: string, duration = 3500) {
		this.show(message, 'success', duration);
	}

	error(message: string, duration = 4500) {
		this.show(message, 'error', duration);
	}

	info(message: string, duration = 3500) {
		this.show(message, 'info', duration);
	}

	remove(id: number) {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

export const toast = new ToastState();
