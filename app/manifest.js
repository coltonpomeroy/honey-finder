export default function manifest() {
    return {
      name: 'PantryPal',
      short_name: 'PantryPal',
      description: 'Reduce Waste, Save Money, and Eat Better with One Simple App.',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ffffff',
      icons: [
        {
          src: '/pantry-paul-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pantry-paul-logo',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    };
  }