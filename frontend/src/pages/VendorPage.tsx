import React, { useState, useEffect } from 'react';
import { getVendors, addVendor, getToken } from '../api';
import type { Vendor, CreateVendor } from '../api';

const VendorPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = getToken();

  useEffect(() => {
    if (token) {
      fetchVendors();
    }
  }, [token]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await getVendors(token!);
      setVendors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and Email are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const newVendor: CreateVendor = { name, email };
      await addVendor(token!, newVendor);
      setName('');
      setEmail('');
      fetchVendors();
    } catch (err: any) {
      setError(err.message || 'Failed to add vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-page" style={{ padding: '2rem' }}>
      <h2>Vendor Management</h2>

      <form onSubmit={handleAddVendor} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block' }}>Vendor Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Enter vendor name"
            required
          />
        </div>
        <div>
          <label style={{ display: 'block' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Enter vendor email"
            required
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Adding...' : 'Add Vendor'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Vendor List</h3>
      {loading && vendors.length === 0 ? (
        <p>Loading vendors...</p>
      ) : (
        <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center' }}>No vendors found.</td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>{vendor.id}</td>
                  <td>{vendor.name}</td>
                  <td>{vendor.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VendorPage;
