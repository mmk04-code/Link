import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateProject() {
  const [form, setForm] = useState({
    title: '', description: '', skills_required: '',
    budget_min: '', budget_max: '', duration_days: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access');
      await axios.post('http://127.0.0.1:8000/api/projects/', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Project created!');
      navigate('/projects');
    } catch (error) {
      alert('Failed to create project');
    }
  };

  return (
    <div className="create-project">
      <h2>Create Project</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea name="description" placeholder="Description" onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input name="skills_required" placeholder="Skills (comma separated)" onChange={(e) => setForm({ ...form, skills_required: e.target.value })} required />
        <input type="number" name="budget_min" placeholder="Min Budget" onChange={(e) => setForm({ ...form, budget_min: e.target.value })} required />
        <input type="number" name="budget_max" placeholder="Max Budget" onChange={(e) => setForm({ ...form, budget_max: e.target.value })} required />
        <input type="number" name="duration_days" placeholder="Duration (days)" onChange={(e) => setForm({ ...form, duration_days: e.target.value })} required />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}

export default CreateProject;
