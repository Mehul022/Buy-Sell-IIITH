import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './login.module.css';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const navigate = useNavigate();

    // Clear any existing CAS session on component mount
    useEffect(() => {
        const clearSession = async () => {
            try {
                await fetch('http://localhost:3000/api/clear-session', {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.error('Failed to clear session:', error);
            }
        };
        clearSession();
    }, []);

    const handleRecaptchaChange = (token) => {
        setRecaptchaToken(token);
    };

    const handleCASLogin = async () => {
        try {
            // First clear the session
            await fetch('http://localhost:3000/api/clear-session', {
                method: 'POST',
                credentials: 'include'
            });

            // Then redirect to CAS
            const casURL = 'https://login.iiit.ac.in/cas/login';
            const serviceURL = encodeURIComponent('http://localhost:3000/api/cas/validate');
            window.location.href = `${casURL}?service=${serviceURL}`;
        } catch (error) {
            console.error('Failed to initiate CAS login:', error);
            setErrors({ submit: 'Failed to initiate login. Please try again.' });
        }
    };

    const validateField = (name, value) => {
        switch (name) {
            case 'email':
                const emailRegex = /^[a-zA-Z0-9._%+-@]*[a-zA-Z0-9.-@]+\.iiit\.ac\.in$/;
                return emailRegex.test(value.trim());
            case 'password':
                return value.length >= 8;
            default:
                return value.trim() !== '';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!recaptchaToken) {
            setErrors(prev => ({ ...prev, submit: 'Please complete the reCAPTCHA' }));
            return;
        }

        const newErrors = {};
        Object.keys(formData).forEach((key) => {
            if (!validateField(key, formData[key])) {
                newErrors[key] = getErrorMessage(key, formData[key]);
            }
        });

        if (Object.keys(newErrors).length === 0) {
            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        ...formData,
                        recaptchaToken,
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else {
                        alert(data.message);
                        setFormData({
                            email: '',
                            password: '',
                        });
                        setRecaptchaToken(null);
                    }
                } else {
                    setErrors({ submit: data.message || 'Failed to login. Please try again.' });
                    setFormData({
                        email: '',
                        password: '',
                    });
                    setRecaptchaToken(null);
                }
            } catch (error) {
                console.error('Login error:', error);
                setErrors({ submit: 'Failed to Login. Please try again.' });
                setFormData({
                    email: '',
                    password: '',
                });
                setRecaptchaToken(null);
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
                        placeholder="example@iiit.ac.in"
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
                <div className={styles.recaptchaContainer}>
                    <ReCAPTCHA
                        sitekey="6Lc5z7oqAAAAAO6FPsxuAg88x_aR7b64KQTKYxtf"
                        onChange={handleRecaptchaChange}
                    />
                </div>
                {errors.submit && <div className={styles.errorMessage}>{errors.submit}</div>}
                <div>
                    <button type="submit" className={styles.submitButton}>
                        LOGIN
                    </button>
                </div>
                <div className={styles.loginLink}>
                    <Link to="/register">Don't have an account? Register here</Link>
                </div>
            </form>
        </div>
    );
}