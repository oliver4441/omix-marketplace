import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Chepseon SMS',
    short_name: 'CCHS',
    description: 'Chepseon Complex High School - School Management System',
    start_url: '/login',
    display: 'standalone',
    background_color: '#1e3a8a',
    theme_color: '#1e3a8a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    categories: ['education', 'business'],
    shortcuts: [
      {
        name: 'Login to Portal',
        url: '/login',
      },
    ],
  }
}