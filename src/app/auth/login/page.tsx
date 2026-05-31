export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "400px", fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", textAlign: "center", marginBottom: "8px" }}>Welcome back</h1>
        <p style={{ color: "#666", textAlign: "center", marginBottom: "24px" }}>Sign in to your Omix account</p>
        <form method="post" action="/api/auth" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "4px" }}>Email</label>
            <input name="email" type="email" required style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "0.875rem" }} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "4px" }}>Password</label>
            <input name="password" type="password" required style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "0.875rem" }} />
          </div>
          <button type="submit" style={{ width: "100%", padding: "10px", background: "#047857", color: "white", borderRadius: "8px", fontWeight: "500", border: "none", cursor: "pointer" }}>Sign In</button>
        </form>
      </div>
    </div>
  );
}
