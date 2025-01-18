import React, { useState, useEffect } from 'react';
import Navbar from '../Components/Navbar';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';
import axios from 'axios';

const UserProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    contactNumber: '',
  });

  // Configure axios to include credentials
  axios.defaults.withCredentials = true;

  // Fetch user details using session
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/profile');
        setUserData(response.data);
        setFormData(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          // Redirect to login if not authenticated
          navigate('/login');
        } else {
          setError('Failed to fetch user data. Please try again later.');
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset form data to current user data when entering edit mode
      setFormData(userData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.put('http://localhost:3000/profile', formData);
      setIsEditing(false);
      setUserData(response.data.user);
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating user data:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  };

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  if (!userData) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <div>
        <Navbar title="Tech Mart IIIT" />
      </div>
      <div className={styles.container}>
        <h1>User Profile</h1>

        <div className={styles.userDetails}>
          <div>
            <strong>First Name:</strong>{' '}
            {isEditing ? (
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              userData.firstName
            )}
          </div>

          <div>
            <strong>Last Name:</strong>{' '}
            {isEditing ? (
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              userData.lastName
            )}
          </div>

          <div>
            <strong>Email:</strong>{' '}
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              userData.email
            )}
          </div>

          <div>
            <strong>Age:</strong>{' '}
            {isEditing ? (
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              userData.age
            )}
          </div>

          <div>
            <strong>Contact Number:</strong>{' '}
            {isEditing ? (
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              userData.contactNumber
            )}
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleEditToggle}
              className={styles.button}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            {isEditing && (
              <button
                onClick={handleSubmit}
                className={`${styles.button} ${styles.saveButton}`}
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;