import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profileImageError, setProfileImageError] = useState(false);
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState("");
  const profileFileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const [userRes, profileRes] = await Promise.allSettled([
        axios.get("http://127.0.0.1:8000/api/users/me/", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }),
        axios.get("http://127.0.0.1:8000/api/users/profile/", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }),
      ]);

      if (userRes.status === "fulfilled") {
        setUser(userRes.value.data);
      }

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data);
        setFormData(profileRes.value.data);
        const name = profileRes.value.data.full_name || '';
        localStorage.setItem("full_name", name);
        localStorage.setItem("profile_image", profileRes.value.data.profile_image || profileRes.value.data.profile_image_url || "");
        window.dispatchEvent(new CustomEvent("profile-updated", { detail: { full_name: name } }));
        setProfilePreviewUrl("");
        setSelectedProfileFile(null);
      } else if (userRes.status === "fulfilled") {
        const fallbackProfile = {
          full_name: userRes.value.data.username || "",
          bio: "",
          skills: "",
          location: "",
          profile_image_url: "",
          github_url: "",
          linkedin_url: "",
          company_name: "",
          company_logo_url: "",
          company_website: "",
          company_description: "",
          company_social_links: "",
        };
        setProfile(fallbackProfile);
        setFormData(fallbackProfile);
        setProfilePreviewUrl("");
        setSelectedProfileFile(null);
      }

      if (userRes.status !== "fulfilled" && profileRes.status !== "fulfilled") {
        setMessage("Unable to load profile right now. Please refresh and try again.");
      }
    } catch (error) {
      setMessage("Unable to load profile right now. Please refresh and try again.");
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage("");
      const token = localStorage.getItem("access");

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === "profile_image") return;
        if (key === "id" || key === "created_at") return;
        payload.append(key, value);
      });
      if (selectedProfileFile) {
        payload.set("profile_image", selectedProfileFile);
      }

      const response = await axios.patch("http://127.0.0.1:8000/api/users/profile/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedName = response.data.full_name || "";
      localStorage.setItem("full_name", updatedName);
      localStorage.setItem("profile_image", response.data.profile_image || response.data.profile_image_url || "");
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: { full_name: updatedName } }));

      setMessage("Profile updated successfully.");
      setIsEditing(false);
      setSelectedProfileFile(null);
      setProfilePreviewUrl("");
      fetchProfile();
    } catch (error) {
      const apiError = error?.response?.data;
      const firstError = apiError && typeof apiError === "object"
        ? Object.values(apiError)[0]
        : null;
      const errorText = Array.isArray(firstError) ? firstError[0] : firstError;
      setMessage(errorText || "Profile update failed. Please try again.");
      console.error("Update error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (user?.role === "CLIENT") {
      navigate("/client-dashboard");
    } else if (user?.role === "FREELANCER") {
      navigate("/freelancer-dashboard");
    } else {
      navigate(-1);
    }
  };

  const handleProfileImagePick = () => {
    if (!isEditing) return;
    profileFileInputRef.current?.click();
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      return;
    }
    setSelectedProfileFile(file);
    setProfileImageError(false);
    setProfilePreviewUrl(URL.createObjectURL(file));
  };

  if (loading) {
    return (
      <div className="profile-page-container">
        <div style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "40px" }}>Loading profile...</div>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="profile-page-container">
        <div className="profile-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          {message || "Unable to load profile."}
        </div>
      </div>
    );
  }

  const isClient = user.role === "CLIENT";
  const displayInitial = (formData.full_name || user.username || "?").charAt(0).toUpperCase();
  const profileImage = profilePreviewUrl || profile.profile_image || profile.profile_image_url;
  const companySocialLinks = (profile.company_social_links || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        <div className="profile-header">
          <input
            ref={profileFileInputRef}
            type="file"
            accept="image/*"
            className="profile-file-input"
            onChange={handleProfileImageChange}
          />
          {profileImage && !profileImageError ? (
            <button
              type="button"
              className={`profile-avatar-trigger ${isEditing ? "is-editing" : ""}`}
              onClick={handleProfileImagePick}
              disabled={!isEditing}
              title={isEditing ? "Click to upload profile image" : "Profile image"}
            >
              <img
                className="profile-avatar profile-avatar-img"
                src={profileImage}
                alt="Profile"
                loading="lazy"
                decoding="async"
                onError={() => setProfileImageError(true)}
              />
              {isEditing && <span className="profile-avatar-upload-icon" aria-hidden="true">📷</span>}
            </button>
          ) : (
            <button
              type="button"
              className={`profile-avatar-trigger ${isEditing ? "is-editing" : ""}`}
              onClick={handleProfileImagePick}
              disabled={!isEditing}
              title={isEditing ? "Click to upload profile image" : "Profile image"}
            >
              <div className="profile-avatar">{displayInitial}</div>
              {isEditing && <span className="profile-avatar-upload-icon" aria-hidden="true">📷</span>}
            </button>
          )}
          <h2 className="profile-name">{profile.full_name || user.username}</h2>
          <div className="profile-role">{user.role} Member</div>
          {isEditing && <div className="profile-upload-hint">Click upload icon on avatar to choose image</div>}
        </div>

        <div className="profile-body">
          {message && <p style={{ marginTop: 0, marginBottom: "20px", color: "var(--brand)", fontSize: "14px", fontWeight: "500", textAlign: "center" }}>{message}</p>}

          {!isEditing ? (
            <div>
              <div className="profile-info-grid">
                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{user.email}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">{profile.location || <em style={{ color: "var(--text-faint)" }}>Location not specified</em>}</span>
                </div>

                {isClient ? (
                  <>
                    <div className="info-item">
                      <span className="info-label">Company Name</span>
                      <span className="info-value">{profile.company_name || <em style={{ color: "var(--text-faint)" }}>Not set</em>}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Company Description</span>
                      <span className="info-value">{profile.company_description || <em style={{ color: "var(--text-faint)" }}>No company description yet.</em>}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Company Website</span>
                      <span className="info-value link-wrap">
                        {profile.company_website ? (
                          <a href={profile.company_website} target="_blank" rel="noreferrer">{profile.company_website}</a>
                        ) : (
                          <em style={{ color: "var(--text-faint)" }}>Not set</em>
                        )}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Social Media Links</span>
                      {companySocialLinks.length ? (
                        <div className="profile-links-list">
                          {companySocialLinks.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer">{link}</a>
                          ))}
                        </div>
                      ) : (
                        <span className="info-value"><em style={{ color: "var(--text-faint)" }}>No social media links added.</em></span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="info-item">
                      <span className="info-label">Skills</span>
                      {profile.skills ? (
                        <div className="skills-wrapper">
                          {profile.skills.split(",").map((skill, idx) => (
                            <span key={idx} className="profile-skill-tag">{skill.trim()}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="info-value"><em style={{ color: "var(--text-faint)" }}>No skills listed.</em></span>
                      )}
                    </div>

                    <div className="info-item">
                      <span className="info-label">Bio / About</span>
                      <span className="info-value">{profile.bio || <em style={{ color: "var(--text-faint)" }}>No bio provided yet.</em>}</span>
                    </div>
                  </>
                )}

                {!isClient && (
                  <div className="info-item">
                    <span className="info-label">GitHub Repository Link</span>
                    <span className="info-value link-wrap">
                      {profile.github_url ? (
                        <a href={profile.github_url} target="_blank" rel="noreferrer">{profile.github_url}</a>
                      ) : (
                        <em style={{ color: "var(--text-faint)" }}>Not set</em>
                      )}
                    </span>
                  </div>
                )}

                <div className="info-item">
                  <span className="info-label">LinkedIn Link</span>
                  <span className="info-value link-wrap">
                    {profile.linkedin_url ? (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer">{profile.linkedin_url}</a>
                    ) : (
                      <em style={{ color: "var(--text-faint)" }}>Not set</em>
                    )}
                  </span>
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn-profile-secondary btn-back-left" onClick={handleBack}>Back to Dashboard</button>
                <button className="btn-profile-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
              </div>
            </div>
          ) : (
            <form className="profile-edit-form" onSubmit={handleSubmit}>
              <div className="edit-group">
                <label className="edit-label">Full Name</label>
                <input
                  className="edit-input"
                  name="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name || ""}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="edit-group">
                <label className="edit-label">Location</label>
                <input
                  className="edit-input"
                  name="location"
                  placeholder="City, Country"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {!isClient && (
                <div className="edit-group">
                  <label className="edit-label">GitHub Repository Link</label>
                  <input
                    className="edit-input"
                    name="github_url"
                    placeholder="https://github.com/username"
                    value={formData.github_url || ""}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  />
                </div>
              )}

              <div className="edit-group">
                <label className="edit-label">LinkedIn Link</label>
                <input
                  className="edit-input"
                  name="linkedin_url"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin_url || ""}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                />
              </div>

              {isClient ? (
                <>
                  <div className="edit-group">
                    <label className="edit-label">Company Name</label>
                    <input
                      className="edit-input"
                      name="company_name"
                      placeholder="Your company name"
                      value={formData.company_name || ""}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>

                  <div className="edit-group">
                    <label className="edit-label">Company Website</label>
                    <input
                      className="edit-input"
                      name="company_website"
                      placeholder="https://yourcompany.com"
                      value={formData.company_website || ""}
                      onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                    />
                  </div>

                  <div className="edit-group">
                    <label className="edit-label">Company Social Media Links</label>
                    <textarea
                      className="edit-textarea"
                      name="company_social_links"
                      placeholder="One link per line or comma separated"
                      value={formData.company_social_links || ""}
                      onChange={(e) => setFormData({ ...formData, company_social_links: e.target.value })}
                    />
                  </div>

                  <div className="edit-group">
                    <label className="edit-label">Company Description</label>
                    <textarea
                      className="edit-textarea"
                      name="company_description"
                      placeholder="Describe your company"
                      value={formData.company_description || ""}
                      onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="edit-group">
                    <label className="edit-label">Skills (Comma Separated)</label>
                    <input
                      className="edit-input"
                      name="skills"
                      placeholder="e.g. React, Python, UI Design"
                      value={formData.skills || ""}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    />
                  </div>

                  <div className="edit-group">
                    <label className="edit-label">Bio / About</label>
                    <textarea
                      className="edit-textarea"
                      name="bio"
                      placeholder="Tell us a little bit about yourself..."
                      value={formData.bio || ""}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="profile-actions">
                <button
                  type="button"
                  className="btn-profile-secondary btn-back-left"
                  onClick={() => {
                    setFormData(profile);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-profile-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
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
