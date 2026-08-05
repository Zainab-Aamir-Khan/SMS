import React from 'react';

export default function Schedule() {
  return (
    <div className="page-container">
      <h2>Class Timetable</h2>
      <p>Weekly lecture timetable and classroom assignments.</p>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Subject</th>
            <th>Room</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>09:00 AM - 10:30 AM</td>
            <td>Mathematics</td>
            <td>Room 301</td>
          </tr>
          <tr>
            <td>11:00 AM - 12:30 PM</td>
            <td>Computer Science</td>
            <td>Lab 2</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}