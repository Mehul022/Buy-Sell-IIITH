import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from './SignUp.module.css';
import { Link } from 'react-router-dom';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default function SignUp() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        age: '',
        contactNumber: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const navigate = useNavigate();
    const handleRecaptchaChange = (token) => {
        setRecaptchaToken(token);
    };
    const validateField = (name, value) => {
        switch (name) {
            case 'email':
                const emailRegex = /^[a-zA-Z0-9._%+-@]*[a-zA-Z0-9.-@]+\.iiit\.ac\.in$/;
                return emailRegex.test(value.trim());
            case 'contactNumber':
                const phoneRegex = /^\d{10}$/;
                return phoneRegex.test(value.trim());
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
            case 'contactNumber':
                return value.trim()
                    ? 'Contact number must be 10 digits.'
                    : 'Contact number is required.';
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
                const response = await fetch('http://localhost:3000/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
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
                    const errorData = await response.json();
                    if (errorData.message === 'Email is already registered.') {
                        alert('User already exists with this email.');
                        setFormData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            age: '',
                            contactNumber: '',
                            password: '',
                        });
                        setRecaptchaToken(null);
                        // setRecaptchaKey(prev => prev + 1);
                    } else {
                        setErrors({ submit: errorData.message || 'Failed to sign up. Please try again.' });
                        setRecaptchaToken(null);
                        // setRecaptchaKey(prev => prev + 1);
                    }
                }
            } catch (error) {
                console.error('Signup error:', error);
                setErrors({ submit: 'Failed to sign up. Please try again.' });
                setRecaptchaToken(null);
                // setRecaptchaKey(prev => prev + 1);
            }
        } else {
            setErrors(newErrors);
        }
    };

    // const handleRecaptchaChange = (value) => {
    //     setRecaptchaToken(value);
    //     if (!value) {
    //         setErrors(prev => ({ ...prev, recaptcha: 'Please complete the reCAPTCHA.' }));
    //     } else {
    //         setErrors(prev => {
    //             const newErrors = { ...prev };
    //             delete newErrors.recaptcha;
    //             return newErrors;
    //         });
    //     }
    // };

    return (
        <div className={styles.container}>
            <form className={styles.formWrapper} onSubmit={handleSubmit}>
                <div>
                    <label className={styles.formLabel}>First Name*</label>
                    <input
                        type="text"
                        className={`${styles.formInput} ${errors.firstName ? styles.invalidInput : ''}`}
                        placeholder="First name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                    />
                    {errors.firstName && <div className={styles.errorMessage}>{errors.firstName}</div>}
                </div>

                <div>
                    <label className={styles.formLabel}>Last Name*</label>
                    <input
                        type="text"
                        className={`${styles.formInput} ${errors.lastName ? styles.invalidInput : ''}`}
                        placeholder="Last name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                    />
                    {errors.lastName && <div className={styles.errorMessage}>{errors.lastName}</div>}
                </div>

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
                    <label className={styles.formLabel}>Age*</label>
                    <input
                        type="number"
                        className={`${styles.formInput} ${errors.age ? styles.invalidInput : ''}`}
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                    />
                    {errors.age && <div className={styles.errorMessage}>{errors.age}</div>}
                </div>

                <div>
                    <label className={styles.formLabel}>Contact Number* (10 digits)</label>
                    <input
                        type="tel"
                        className={`${styles.formInput} ${errors.contactNumber ? styles.invalidInput : ''}`}
                        placeholder="1234567890"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        maxLength="10"
                    />
                    {errors.contactNumber && <div className={styles.errorMessage}>{errors.contactNumber}</div>}
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
                        Sign Up
                    </button>
                </div>

                <div className={styles.loginLink}>
                    <Link to="/login">Already have an account</Link>
                </div>
            </form>
        </div>
    );
}