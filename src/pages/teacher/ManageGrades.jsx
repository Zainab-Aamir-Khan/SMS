import React from 'react';

export default function ManageGrades() {
  return (
    <div className="page-container">
      <h2>Grade Entry Portal</h2>
      <p>Input exam marks, assignments, and practical grades.</p>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Subject</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>John Doe</td>
            <td>Mathematics</td>
            <td>A</td>
          </tr>
          <tr>
            <td>Jane Smith</td>
            <td>Physics</td>
            <td>B+</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}