import React from 'react';

export default function ViewGrades() {
  return (
    <div className="page-container">
      <h2>My Report Card</h2>
      <p>View your course marks, grades, and overall academic status.</p>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Credits</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mathematics</td>
            <td>4</td>
            <td>A</td>
          </tr>
          <tr>
            <td>Computer Science</td>
            <td>3</td>
            <td>A+</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}