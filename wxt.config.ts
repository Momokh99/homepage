import { defineConfig } from 'wxt'

export default defineConfig({
  manifest: ({ browser }) => ({
    name: 'My Custom Home Screen',
    description: 'Customizes the default new tab page.',
    action: { default_title: 'Customize homepage' },
    permissions: ['storage', 'tabs'],
    icons: {
      16: '/icons/icon16.png',
      48: '/icons/icon48.png',
      128: '/icons/icon128.png',
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'custom-homepage@example.com',
          strict_min_version: '109.0',
        },
      },
    }),
  }),
})