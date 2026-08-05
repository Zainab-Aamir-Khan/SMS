import React from 'react';

export default function ManageUsers() {
  const users = [
    { id: 1, name: 'Alice Smith', role: 'Student' },
    { id: 2, name: 'Dr. John Doe', role: 'Teacher' },
  ];

  return (
    <div className="page-container">
      <h2>Manage Users</h2>
      <p>View and manage all registered system users.</p>
      <table className="styled-table">
        <thead>
          <tr>
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