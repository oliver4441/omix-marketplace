const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Clothing', 'Services', 'Vehicles'];
const LOCATIONS = ['CBD', 'Litein', 'Kapsoit', 'Brooke', 'Sosiot'];

const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'MacBook Pro M1 2020',
    price: 85000,
    category: 'Electronics',
    condition: 'Used - Like New',
    location: 'CBD',
    sellerName: 'Kiprono',
    description: 'Barely used MacBook Pro M1. Battery health at 98%. Comes with original charger and box. Need to sell urgently to upgrade.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-06-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Modern L-Shaped Sofa',
    price: 45000,
    category: 'Furniture',
    condition: 'New',
    location: 'Litein',
    sellerName: 'Kericho Furnitures',
    description: 'Brand new L-shaped sofa, gray fabric. Very comfortable and durable. Free delivery within Litein.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-06-02T14:30:00Z'
  },
  {
    id: '3',
    title: 'Vintage Denim Jacket',
    price: 1500,
    category: 'Clothing',
    condition: 'Used - Good',
    location: 'Kapsoit',
    sellerName: 'Chebet',
    description: 'Authentic Levi vintage denim jacket. Size Medium. No tears, just natural fade.',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-06-03T09:15:00Z'
  },
  {
    id: '4',
    title: 'Plumbing Services',
    price: 500,
    category: 'Services',
    condition: 'N/A',
    location: 'CBD',
    sellerName: 'John The Plumber',
    description: 'Expert plumbing services in Kericho. Base consultation fee is 500 KES. Fast response for leaks and pipe bursts.',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-06-04T08:00:00Z'
  },
  {
    id: '5',
    title: 'Toyota Probox 2014',
    price: 650000,
    category: 'Vehicles',
    condition: 'Used',
    location: 'Brooke',
    sellerName: 'Auto Dealer',
    description: 'Clean Toyota Probox, 2014 model. Accident free, well maintained. Logbook ready for transfer.',
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-05-28T11:20:00Z'
  },
  {
    id: '6',
    title: 'Samsung 43" Smart TV',
    price: 32000,
    category: 'Electronics',
    condition: 'New',
    location: 'CBD',
    sellerName: 'TechHub',
    description: 'Brand new sealed Samsung 43 inch Smart TV. 1 year warranty included.',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-05-30T16:45:00Z'
  }
];

// Helper to format currency
const formatKES = (amount) => {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
};