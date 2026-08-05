import React from 'react';

export default function ClassAttendance() {
  return (
    <div className="page-container">
      <h2>Class Attendance Tracker</h2>
      <p>Mark daily student attendance for your active subjects.</p>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Roll No</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>John Doe</td>
            <td>101</td>
            <td><span style={{ color: 'green', fontWeight: 'bold' }}>Present</span></td>
          </tr>
          <tr>
            <td>Jane Smith</td>
            <td>102</td>
            <td><span style={{ color: 'red', fontWeight: 'bold' }}>Absent</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}