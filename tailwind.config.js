/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#3C50E0",
        stroke: '#E2E8F0',
        gray: '#EFF4FB',
        'gray-2': '#F7F9FC',
        boxdark: '#24303F',
        'boxdark-2': '#1A222C',
        strokedark: '#2E3A47',
        'form-strokedark': '#3d4d60',
        'form-input': '#1d2a39',
        'meta-4': '#313D4A',
        success: '#219653',
        danger: '#D34053',
        warning: '#FFA70B',
      },
    },
  },
  plugins: [forms],
}