import { useEffect, useState } from "react";
import api from "../api/client";
import { useNotification } from "../context/NotificationContext";

const INITIAL_ADDRESS_FORM = { street: "", city: "", postal_code: "", is_default: false };

/* ── shared input style ── */
const inputStyle = {
  width: "100%",
  padding: ".7rem 1rem",
  border: "1.5px solid #e8d5b7",
  borderRadius: ".75rem",
  background: "white",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: ".9rem",
  color: "#1a0f0a",
  outline: "none",
  transition: "border-color .22s, box-shadow .22s",
  boxSizing: "border-box",
};

function BrewInput({ label, id, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor={id} style={{
        display: "block", fontSize: ".78rem", fontWeight: 500,
        letterSpacing: ".05em", textTransform: "uppercase",
        color: "#9a7060", marginBottom: ".4rem",
      }}>{label}</label>
      <input
        id={id}
        {...props}
        style={{
          ...inputStyle,
          borderColor: focused ? "#c17f3e" : "#e8d5b7",
          boxShadow: focused ? "0 0 0 3px rgba(193,127,62,.12)" : "none",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: ".5rem", padding: "5rem" }}>
      {[0, 0.15, 0.3].map((d, i) => (
        <span key={i} style={{
          display: "block", width: 8, height: 8, borderRadius: "50%",
          background: "#c17f3e",
          animation: `brewBounce .9s ${d}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_ADDRESS_FORM);
  const { showError, showSuccess } = useNotification();

  const fetchUserProfile = async () => {
    try {
      const { data } = await api.get("/user/profile/");
      setUser(data);
      setAddresses(data.delivery_addresses || []);
    } catch {
      showError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUserProfile(); }, []);

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/user/addresses/", formData);
      setAddresses((prev) => [...prev, data]);
      setFormData(INITIAL_ADDRESS_FORM);
      showSuccess("Address added successfully.");
    } catch { showError("Failed to add address."); }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.patch(`/user/addresses/${editingAddressId}/`, formData);
      setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? data : a)));
      setEditingAddressId(null);
      setFormData(INITIAL_ADDRESS_FORM);
      showSuccess("Address updated.");
    } catch { showError("Failed to update address."); }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/user/addresses/${addressId}/`);
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      showSuccess("Address deleted.");
    } catch { showError("Failed to delete address."); }
  };

  const startEdit = (address) => {
    setEditingAddressId(address.id);
    setFormData({ street: address.street, city: address.city, postal_code: address.postal_code, is_default: address.is_default });
  };

  const cancelEdit = () => { setEditingAddressId(null); setFormData(INITIAL_ADDRESS_FORM); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes brewBounce { 0%,100%{transform:scale(.7);opacity:.4} 50%{transform:scale(1.2);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        .addr-card { transition: transform .25s, box-shadow .25s; }
        .addr-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,15,10,.08); }
        .brew-del-btn:hover { background: #a83232 !important; color: white !important; }
        .brew-edit-btn:hover { border-color: #c17f3e !important; color: #c17f3e !important; }
      `}</style>

      <section style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "3.5rem 2rem 5rem",
        fontFamily: "'DM Sans', sans-serif",
        animation: "fadeUp .7s ease both",
      }}>
        {/* page header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontSize: ".72rem", letterSpacing: ".13em", textTransform: "uppercase", color: "#c17f3e", fontWeight: 500, marginBottom: ".6rem" }}>
            Account
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 700, color: "#1a0f0a", margin: 0 }}>
            My Profile
          </h2>
        </div>

        {loading ? <LoadingDots /> : (
          <>
            {/* ── user info card ── */}
            {user && (
              <div style={{
                background: "white", border: "1px solid rgba(193,127,62,.14)", borderRadius: "1.25rem",
                padding: "1.75rem", marginBottom: "2.5rem",
                display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap",
              }}>
                {/* avatar */}
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg,#3d1f10,#c17f3e)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ color: "white", fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>
                    {user.username?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.15rem", fontWeight: 700, color: "#1a0f0a" }}>
                      {user.username}
                    </span>
                    {user.is_staff && (
                      <span style={{
                        fontSize: ".68rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
                        padding: ".25rem .7rem", borderRadius: "2rem",
                        background: "rgba(193,127,62,.12)", color: "#8a4f15",
                        border: "1px solid rgba(193,127,62,.25)",
                      }}>Admin</span>
                    )}
                  </div>
                  <span style={{ fontSize: ".88rem", color: "#9a7060", fontWeight: 300 }}>{user.email}</span>
                </div>
              </div>
            )}

            {/* ── addresses ── */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: ".72rem", letterSpacing: ".13em", textTransform: "uppercase", color: "#c17f3e", fontWeight: 500, marginBottom: ".5rem" }}>
                Delivery
              </div>
              <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.5rem", fontWeight: 700, color: "#1a0f0a", margin: "0 0 1.5rem" }}>
                Saved Addresses
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem" }}>

              {/* ── form panel ── */}
              <div style={{ background: "white", border: "1px solid rgba(193,127,62,.14)", borderRadius: "1.25rem", padding: "1.5rem" }}>
                <h4 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.1rem", fontWeight: 700, color: "#1a0f0a", marginBottom: "1.25rem" }}>
                  {editingAddressId ? "Edit Address" : "Add New Address"}
                </h4>

                <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress}>
                  <BrewInput label="Street Address" id="street" name="street" value={formData.street} onChange={handleAddressChange} required />
                  <BrewInput label="City"           id="city"   name="city"   value={formData.city}   onChange={handleAddressChange} required />
                  <BrewInput label="Postal Code"    id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleAddressChange} required />

                  {/* checkbox */}
                  <label style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: "1.25rem", cursor: "pointer" }}>
                    <input
                      id="is_default" name="is_default" type="checkbox"
                      checked={formData.is_default} onChange={handleAddressChange}
                      style={{ width: 16, height: 16, accentColor: "#c17f3e" }}
                    />
                    <span style={{ fontSize: ".85rem", color: "#6b3a20", fontWeight: 400 }}>Set as default address</span>
                  </label>

                  <button type="submit" style={{
                    width: "100%", padding: ".8rem",
                    background: "#3d1f10", color: "#faf6f0",
                    border: "none", borderRadius: "2rem",
                    fontFamily: "'DM Sans',sans-serif", fontSize: ".88rem", fontWeight: 500,
                    cursor: "pointer", letterSpacing: ".03em",
                    transition: "background .25s",
                    marginBottom: editingAddressId ? ".6rem" : 0,
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#c17f3e"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#3d1f10"; }}
                  >
                    {editingAddressId ? "Update Address" : "Add Address"}
                  </button>

                  {editingAddressId && (
                    <button type="button" onClick={cancelEdit} style={{
                      width: "100%", padding: ".8rem",
                      background: "transparent", color: "#6b3a20",
                      border: "1.5px solid #e8d5b7", borderRadius: "2rem",
                      fontFamily: "'DM Sans',sans-serif", fontSize: ".88rem",
                      cursor: "pointer", transition: "border-color .25s, color .25s",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c17f3e"; e.currentTarget.style.color = "#c17f3e"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8d5b7"; e.currentTarget.style.color = "#6b3a20"; }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>

              {/* ── saved addresses list ── */}
              <div style={{ background: "white", border: "1px solid rgba(193,127,62,.14)", borderRadius: "1.25rem", padding: "1.5rem" }}>
                <h4 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.1rem", fontWeight: 700, color: "#1a0f0a", marginBottom: "1.25rem" }}>
                  Your Addresses
                </h4>

                {addresses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#9a7060", fontWeight: 300, lineHeight: 1.7 }}>
                    <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📍</div>
                    No addresses saved yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                    {addresses.map((address) => (
                      <article key={address.id} className="addr-card" style={{
                        border: "1px solid rgba(193,127,62,.14)",
                        borderRadius: "1rem", padding: "1rem",
                        background: address.is_default ? "rgba(193,127,62,.04)" : "transparent",
                      }}>
                        <div style={{ marginBottom: ".75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 500, color: "#1a0f0a", fontSize: ".92rem" }}>
                              {address.street}, {address.city}
                            </span>
                            {address.is_default && (
                              <span style={{
                                fontSize: ".62rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
                                padding: ".2rem .6rem", borderRadius: "2rem",
                                background: "rgba(193,127,62,.12)", color: "#8a4f15",
                                border: "1px solid rgba(193,127,62,.25)",
                              }}>Default</span>
                            )}
                          </div>
                          <div style={{ fontSize: ".8rem", color: "#9a7060", marginTop: ".2rem", fontWeight: 300 }}>
                            {address.postal_code}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: ".6rem" }}>
                          <button className="brew-edit-btn" onClick={() => startEdit(address)} style={{
                            flex: 1, padding: ".5rem .75rem",
                            background: "transparent", border: "1.5px solid #e8d5b7",
                            borderRadius: "2rem", color: "#6b3a20",
                            fontFamily: "'DM Sans',sans-serif", fontSize: ".78rem", fontWeight: 500,
                            cursor: "pointer", transition: "all .22s",
                          }}>Edit</button>
                          <button className="brew-del-btn" onClick={() => handleDeleteAddress(address.id)} style={{
                            flex: 1, padding: ".5rem .75rem",
                            background: "transparent", border: "1.5px solid rgba(168,50,50,.3)",
                            borderRadius: "2rem", color: "#a83232",
                            fontFamily: "'DM Sans',sans-serif", fontSize: ".78rem", fontWeight: 500,
                            cursor: "pointer", transition: "all .22s",
                          }}>Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </section>
    </>
  );
}