import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) navigate("/");
    else fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access');
      const userRes = await axios.get('http://127.0.0.1:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileRes = await axios.get('http://127.0.0.1:8000/api/users/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);
      setProfile(profileRes.data);
      setFormData(profileRes.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access');
      await axios.patch('http://127.0.0.1:8000/api/users/profile/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      alert('Profile update failed. Please try again.');
      console.error('Update error:', error);
    }
  };

  const handleBack = () => {
    if (user?.role === 'CLIENT') {
      navigate('/client-dashboard');
    } else if (user?.role === 'FREELANCER') {
      navigate('/freelancer-dashboard');
    } else {
      navigate(-1);
    }
  };

  if (!profile || !user) return <div style={{ textAlign: "center", padding: "50px" }}>Loading profile...</div>;

  const displayInitial = (formData.full_name || user.username || "?").charAt(0).toUpperCase();

  return (
    <div className="profile-page-container">
      <div className="profile-card">

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {displayInitial}
          </div>
          <h2 className="profile-name">{formData.full_name || user.username}</h2>
          <div className="profile-role">{user.role} Member</div>
        </div>

        {/* Profile Body */}
        <div className="profile-body">
          {!isEditing ? (
            /* VIEW MODE */
            <div>
              <div className="profile-info-grid">
                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{user.email}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Bio / About</span>
                  <span className="info-value">
                    {profile.bio || <em style={{ color: "#aaa" }}>No bio provided yet.</em>}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">
                    {profile.location || <em style={{ color: "#aaa" }}>Location not specified.</em>}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">Skills</span>
                  {profile.skills ? (
                    <div className="skills-wrapper">
                      {profile.skills.split(',').map((skill, idx) => (
                        <span key={idx} className="profile-skill-tag">{skill.trim()}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="info-value"><em style={{ color: "#aaa" }}>No skills listed.</em></span>
                  )}
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn-profile-secondary" onClick={handleBack}>← Dashboard</button>
                <button className="btn-profile-primary" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
              </div>
            </div>
          ) : (
            /* EDIT MODE (COMPACT FORM) */
            <form className="profile-edit-form" onSubmit={handleSubmit}>
              <div className="edit-group">
                <label className="edit-label">Full Name</label>
                <input
                  className="edit-input"
                  name="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="edit-group">
                <label className="edit-label">Location</label>
                <input
                  className="edit-input"
                  name="location"
                  placeholder="City, Country"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="edit-group">
                <label className="edit-label">Skills (Comma Separated)</label>
                <input
                  className="edit-input"
                  name="skills"
                  placeholder="e.g. React, Python, Design"
                  value={formData.skills || ''}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />
              </div>

              <div className="edit-group">
                <label className="edit-label">Bio</label>
                <textarea
                  className="edit-textarea"
                  name="bio"
                  placeholder="Tell us a little bit about yourself..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="profile-actions" style={{ marginTop: "10px" }}>
                <button type="button" className="btn-profile-secondary" onClick={() => {
                  setFormData(profile); // Reset form
                  setIsEditing(false);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-profile-primary">
                  💾 Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
