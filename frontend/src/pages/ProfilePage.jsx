import { useEffect, useState } from "react";
import api from "../api/client";
import { useNotification } from "../context/NotificationContext";

const INITIAL_ADDRESS_FORM = {
  street: "",
  city: "",
  postal_code: "",
  is_default: false,
};

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

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/user/addresses/", formData);
      setAddresses((prev) => [...prev, data]);
      setFormData(INITIAL_ADDRESS_FORM);
      showSuccess("Address added successfully.");
    } catch {
      showError("Failed to add address.");
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.patch(
        `/user/addresses/${editingAddressId}/`,
        formData
      );
      setAddresses((prev) =>
        prev.map((addr) => (addr.id === editingAddressId ? data : addr))
      );
      setEditingAddressId(null);
      setFormData(INITIAL_ADDRESS_FORM);
      showSuccess("Address updated successfully.");
    } catch {
      showError("Failed to update address.");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/user/addresses/${addressId}/`);
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      showSuccess("Address deleted successfully.");
    } catch {
      showError("Failed to delete address.");
    }
  };

  const startEdit = (address) => {
    setEditingAddressId(address.id);
    setFormData({
      street: address.street,
      city: address.city,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
  };

  const cancelEdit = () => {
    setEditingAddressId(null);
    setFormData(INITIAL_ADDRESS_FORM);
  };

  if (loading) {
    return <p className="status-message">Loading profile...</p>;
  }

  return (
    <section className="profile-section">
      <h2 className="section-title">My Profile</h2>

      {user && (
        <div className="profile-info">
          <div className="info-item">
            <label>Username:</label>
            <span>{user.username}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{user.email}</span>
          </div>
          {user.is_staff && (
            <div className="info-item">
              <span className="pill">Admin</span>
            </div>
          )}
        </div>
      )}

      <div className="addresses-section">
        <h3 className="section-title">Delivery Addresses</h3>

        <div className="two-col">
          <div className="panel">
            <h4>{editingAddressId ? "Edit Address" : "Add New Address"}</h4>
            <form
              className="form-grid"
              onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress}
            >
              <div className="field">
                <label htmlFor="street">Street Address</label>
                <input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleAddressChange}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleAddressChange}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="postal_code">Postal Code</label>
                <input
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleAddressChange}
                  required
                />
              </div>

              <div className="inline-form">
                <input
                  id="is_default"
                  name="is_default"
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={handleAddressChange}
                />
                <label htmlFor="is_default">Set as default address</label>
              </div>

              <div className="btn-group">
                <button type="submit" className="btn btn-primary">
                  {editingAddressId ? "Update" : "Add"} Address
                </button>
                {editingAddressId && (
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel">
            <h4>Your Addresses</h4>
            {addresses.length === 0 ? (
              <p className="status-message">No addresses saved yet.</p>
            ) : (
              <div className="list-stack">
                {addresses.map((address) => (
                  <article key={address.id} className="panel address-item">
                    <div>
                      <strong>
                        {address.street}, {address.city}
                      </strong>
                      {address.is_default && <span className="pill">Default</span>}
                      <p>
                        <small>{address.postal_code}</small>
                      </p>
                    </div>
                    <div className="btn-group">
                      <button
                        className="btn btn-secondary"
                        onClick={() => startEdit(address)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
