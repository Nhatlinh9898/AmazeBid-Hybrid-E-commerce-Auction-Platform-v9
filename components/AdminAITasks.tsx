import React, { useState, useEffect } from 'react';

export const AdminAITasks = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => setTasks(data.jobs));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Admin AI Tasks</h2>
      <ul>
        {tasks.map((task: any) => (
          <li key={task.id}>{task.id} - {task.status}</li>
        ))}
      </ul>
    </div>
  );
};
