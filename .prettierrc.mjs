/** @type {import("prettier").Config} */
export default {
  plugins: ['prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro'
      }
    }
  ],
  bracketSameLine: true,
  printWidth: 120,
  singleQuote: true,
  semi: false,
  trailingComma: 'none'
}
