/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Mode clair forcé (décision produit du 2026-09-10) : 'class' au lieu du
  // défaut 'media' empêche les classes dark: de suivre le thème système —
  // elles ne s'appliquent que si quelque chose bascule explicitement en
  // 'dark', ce que l'app ne fait jamais.
  darkMode: 'class',
  theme: {
    extend: {
      // Bleu roi et or soleil (logo provisoire), voir lib/brand.ts.
      colors: {
        brand: {
          DEFAULT: '#2345C2',
          50: '#EEF2FF',
          100: '#DDE5FF',
          300: '#8EA6F5',
          400: '#5C7CEB',
          500: '#2345C2',
          600: '#1E3A9E',
          700: '#182F80',
          950: '#0F1D52',
        },
        gold: {
          DEFAULT: '#F2B632',
          50: '#FFF6E0',
          600: '#9A6A00',
        },
      },
      /*fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },*/
    },
  },
  corePlugins: {
    borderOpacity: true,
  },
  plugins: []
}
