# Cloudflare Pages Environment Variables
# Add these in Cloudflare Pages Dashboard -> Settings -> Environment variables

# JWT Secret for authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>

# These are automatically available when using D1 binding:
# - DB binding is accessible in API routes via Cloudflare runtime
