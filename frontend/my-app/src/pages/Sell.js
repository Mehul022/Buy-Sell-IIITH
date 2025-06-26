import React, { useState } from 'react';
import axios from 'axios';
import styles from './Sell.module.css';
import Navbar from '../Components/Navbar';

const ProductForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form fields
        for (const field in formData) {
            if (!formData[field].trim()) {
                setError(`Please fill in the ${field} field.`);
                return;
            }
        }

        try {
            const response = await axios.post('/api/sell', formData, {
                withCredentials: true, // Include session cookie
            });
            setMessage(response.data.message || 'Product added successfully!');
            setError(''); // Clear any previous error
            setFormData({ name: '', price: '', description: '', category: '' }); // Clear form
        } catch (error) {
            console.error('Error adding product:', error);
            setError(error.response?.data?.message || 'An error occurred. Please try again.');
        }
    };

    return (
        <>
            <Navbar title="Tech Mart IIIT" />
            <div className={styles.container}>
                <h1>Add New Product</h1>
                {message && <p className={styles.message}>{message}</p>}
                {error && <p className={styles.error}>{error}</p>}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="price">Price</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="category">Category</label>
                        <input
                            type="text"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.button}>Add Product</button>
                </form>
            </div>
        </>
    );
};

export default ProductForm;
