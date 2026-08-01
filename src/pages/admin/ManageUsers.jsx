import React, { useState } from 'react';

export default function ManageUsers() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice Smith', role: 'Student' },
    { id: 2, name: 'Dr. John Doe', role: 'Teacher' },
  ]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Manage Users</h2>
      <table border="1" cellPadding="10" style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}