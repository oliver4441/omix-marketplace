export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "16px" }}>Omix Marketplace</h1>
      <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "24px" }}>Buy & Sell in Kericho, Kenya</p>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
        <p style={{ margin: 0, color: "#166534" }}>Site is live and working.</p>
      </div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "12px" }}>Quick Links</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li style={{ marginBottom: "8px" }}><a href="/auth/login" style={{ color: "#047857" }}>Sign In</a></li>
        <li style={{ marginBottom: "8px" }}><a href="/auth/register" style={{ color: "#047857" }}>Create Account</a></li>
        <li style={{ marginBottom: "8px" }}><a href="/sell" style={{ color: "#047857" }}>Sell an Item</a></li>
        <li style={{ marginBottom: "8px" }}><a href="/services" style={{ color: "#047857" }}>Browse Services</a></li>
      </ul>
    </div>
  );
}
