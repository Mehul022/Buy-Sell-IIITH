import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './login.module.css';
// import { Link } from 'react-router-dom';
export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();


    const validateField = (name,value) => {
        switch (name) {
            case 'email':
                const emailRegex = /^[a-zA-Z0-9._%+-]*[a-zA-Z0-9.-]+\.iiit\.ac\.in$/;
                return emailRegex.test(value.trim());
            case 'password':
                return value.length >= 8;
            default:
                return value.trim() !== '';
        }
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (!value.trim()) {
            setErrors(prev => ({
                ...prev,
                [name]: 'This field is required',
            }));
        } else {
            const isValid = validateField(name, value);
            setErrors(prev => {
                const newErrors = { ...prev };
                if (isValid) {
                    delete newErrors[name];
                } else {
                    newErrors[name] = getErrorMessage(name, value);
                }
                return newErrors;
            });
        }
    };
    const getErrorMessage = (name, value) => {
        switch (name) {
            case 'email':
                return value.trim()
                    ? 'Email must be a valid IIIT domain (e.g., user@iiit.ac.in).'
                    : 'Email is required.';
            case 'password':
                return value.trim()
                    ? 'Password must be at least 8 characters.'
                    : 'Password is required.';
            default:
                return `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        Object.keys(formData).forEach((key) => {
            if (!validateField(key, formData[key])) {
                newErrors[key] = getErrorMessage(key, formData[key]);
            }
        });
        // If there are validation errors, set them and stop
        if (Object.keys(newErrors).length === 0) {
            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...formData,
                        // captchaToken: recaptchaToken,
                    }),
                });

                if (response.ok) {
                    navigate('/home');
                } else {
                    const errorData = await response.json();
                    if (errorData.message === 'User not found' || errorData.message === 'Invalid credentials') {
                        alert('Invalid credentials');
                        setFormData({
                            email: '',
                            password: '',
                        });
                        // setRecaptchaToken(null);
                        // setRecaptchaKey(prev => prev + 1);
                    } else {
                        setErrors({ submit: errorData.message || 'Failed to login. Please try again.' });
                        // setRecaptchaToken(null);
                        // setRecaptchaKey(prev => prev + 1);
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                setErrors({ submit: 'Failed to Login. Please try again.' });
                // setRecaptchaToken(null);
                // setRecaptchaKey(prev => prev + 1);
            }
        } else {
            setErrors(newErrors);
        }
    };


    return (
        <div className={styles.container}>
            <form className={styles.formWrapper} onSubmit={handleSubmit}>
                <div>
                    <label className={styles.formLabel}>IIIT Email Address*</label>
                    <input
                        type="text"
                        className={`${styles.formInput} ${errors.email ? styles.invalidInput : ''}`}
                        placeholder="example.iiit.ac.in"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
                </div>
                <div>
                    <label className={styles.formLabel}>Password* (minimum 8 characters)</label>
                    <input
                        type="password"
                        className={`${styles.formInput} ${errors.password ? styles.invalidInput : ''}`}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
                </div>
                {errors.submit && <div className={styles.errorMessage}>{errors.submit}</div>}
                <div>
                    <button type="submit" className={styles.submitButton}>
                        LOGIN
                    </button>
                </div>
                <div className={styles.loginLink}>
                    <Link to="/">Don't have an account</Link>
                </div>
            </form>
        </div>
    );
}