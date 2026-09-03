<script lang="ts">
	import { Mail } from 'lucide-svelte';
</script>

<footer class="bg-zinc-950 text-white border-t border-zinc-800 pt-16 pb-6 overflow-hidden relative">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
		<!-- Top Row: Brand & Quick Nav -->
		<div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-zinc-800/80">
			<!-- Platform Brand Logo & Tagline -->
			<div class="space-y-3 max-w-sm">
				<a href="/" class="flex items-center gap-3 group">
					<img src="/logo.png" alt="DJR Akademi" class="h-9 w-auto object-contain" />
					<span class="font-black text-lg text-white uppercase tracking-wider group-hover:text-amber-400 transition-colors">
						DJR AKADEMI
					</span>
				</a>
				<p class="text-xs text-zinc-400 font-medium leading-relaxed">
					Platfòm aprantisaj modèn pou mèt tout konpetans dijital epi akselere siksè ou nan peyi Ayiti.
				</p>
			</div>

			<!-- Navigation Links -->
			<div class="flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-bold text-zinc-300">
				<a href="/" class="hover:text-amber-400 transition-colors">Akèy</a>
				<a href="/catalogue" class="hover:text-amber-400 transition-colors">Katalòg</a>
				<a href="/verify" class="hover:text-amber-400 transition-colors">Verifye Peman</a>
				<a href="/about" class="hover:text-amber-400 transition-colors">Konsènan nou</a>
				<a href="/contact" class="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
					<Mail size={14} class="text-amber-400" />
					<span>Kontak</span>
				</a>
			</div>
		</div>

		<!-- Middle Row: Rights & Legal -->
		<div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
			<p class="flex items-center gap-1.5">
				<span>© 2026 DJR Akademi. Tout dwa rezève.</span>
			</p>

			<div class="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
				<span>Pòtoprens, Ayiti</span>
				<span>·</span>
				<span>Peman MonCash ak Natcash</span>
			</div>
		</div>
	</div>

	<!-- Massive Agency Typography Watermark Banner at Bottom -->
	<div class="py-[10px] overflow-hidden pointer-events-none select-none">
		<h2 class="text-[12vw] sm:text-[14vw] font-black tracking-tighter leading-none uppercase text-center text-white opacity-95 whitespace-nowrap">
			DJR AKADEMI
		</h2>
	</div>
</footer>
