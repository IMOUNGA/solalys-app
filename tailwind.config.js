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
      colors: {
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
