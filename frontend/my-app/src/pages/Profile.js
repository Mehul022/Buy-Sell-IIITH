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
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    contactNumber: '',
  });

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/profile');
        setUserData(response.data);
        setFormData(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to fetch user data. Please try again later.');
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const validateField = (name, value) => {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;

    switch (name) {
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]*[a-zA-Z0-9.-]+\.iiit\.ac\.in$/;
        return emailRegex.test(trimmedValue);
      case 'contactNumber':
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(trimmedValue);
      case 'age':
        return Number(trimmedValue) > 0;
      default:
        return trimmedValue !== '';
    }
  };

  const getErrorMessage = (name, value) => {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;

    switch (name) {
      case 'email':
        return trimmedValue
          ? 'Email must be a valid IIIT domain (e.g., example.iiit.ac.in).'
          : 'Email is required.';
      case 'contactNumber':
        return trimmedValue
          ? 'Contact number must be 10 digits.'
          : 'Contact number is required.';
      case 'age':
        return 'Age must be a positive number.';
      default:
        return `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    const isValid = validateField(name, value);

    setFormErrors((prev) => {
      const newErrors = { ...prev };
      if (isValid) {
        delete newErrors[name];
      } else {
        newErrors[name] = getErrorMessage(name, value);
      }
      return newErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      if (!validateField(key, formData[key])) {
        newErrors[key] = getErrorMessage(key, formData[key]);
      }
    });

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await axios.put('http://localhost:3000/api/profile', formData);
        setIsEditing(false);
        setUserData(response.data.user);
        alert('Profile updated successfully!');
      } catch (error) {
        console.error('Error updating user data:', error);
        setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
      }
    } else {
      setFormErrors(newErrors);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setFormData(userData);
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
      <Navbar title="Tech Mart IIIT" />
      <div className={styles.container}>
        <h1>User Profile</h1>
        <div className={styles.userDetails}>
          {['firstName', 'lastName', 'email', 'age', 'contactNumber'].map((field) => (
            <div key={field}>
              <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>{' '}
              {isEditing ? (
                <>
                  <input
                    type={field === 'age' ? 'number' : field === 'contactNumber' ? 'tel' : 'text'}
                    name={field}
                    value={formData[field]}
                    onChange={handleInputChange}
                    className={`${styles.input} ${formErrors[field] ? styles.invalidInput : ''}`}
                  />
                  {formErrors[field] && <p className={styles.errorText}>{formErrors[field]}</p>}
                </>
              ) : (
                userData[field]
              )}
            </div>
          ))}

          <div className={styles.actions}>
            <button onClick={handleEditToggle} className={styles.button}>
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            {isEditing && (
              <button onClick={handleSubmit} className={`${styles.button} ${styles.saveButton}`}>
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
