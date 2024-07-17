/** @type {import('tailwindcss').Config} */
const {
  iconsPlugin,
  getIconCollections,
} = require('@egoist/tailwindcss-icons');

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    iconsPlugin({
      collections: getIconCollections(['material-symbols']),
    }),
  ],
};
