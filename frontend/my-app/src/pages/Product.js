import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Components/Navbar';
import styles from './product.module.css';

const Product = () => {
    const [product, setProduct] = useState(null);
    const [seller, setSeller] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inCart, setInCart] = useState(false);
    const { id } = useParams();

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setError('Invalid product ID');
                setLoading(false);
                return;
            }
            try {
                // Fetch product details
                const productResponse = await axios.get(`/api/product/${id}`);

                // Check if product is already in cart
                const cartResponse = await axios.get('/api/cart/check', {
                    params: { productId: id }
                });

                if (productResponse.data.product && productResponse.data.seller) {
                    setProduct(productResponse.data.product);
                    setSeller(productResponse.data.seller);
                    setInCart(cartResponse.data.inCart);
                } else {
                    setError('Product or seller data missing');
                }
                setLoading(false);
            } catch (err) {
                setError('Failed to load product');
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = async () => {
        try {
            await axios.post('/api/cart/add', {
                productId: id,
                quantity: quantity
            });
            setInCart(true);
        } catch (err) {
            setError('Failed to add to cart');
        }
    };

    const handleRemoveFromCart = async () => {
        try {
            const response = await axios.delete(`/api/cart/${id}`);
            console.log(response.data.message);
            setInCart(false);
        } catch (err) {
            console.error('Remove from cart error:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to remove from cart');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!product) return <div>Product not found</div>;

    return (
        <div>
            <Navbar title="Tech Mart IIIT" />
            <div className={styles.container}>
                <div className={styles.productDetails}>
                    <h1>{product.name}</h1>
                    <p className={styles.price}>${product.price.toLocaleString()}</p>
                    <p className={styles.description}>{product.description}</p>
                    <p className={styles.category}>Category: {product.category}</p>

                    <div className={styles.sellerInfo}>
                        <h3>Seller Information</h3>
                        {seller ? (
                            <>
                                <p>Name: {seller.firstName} {seller.lastName}</p>
                                <p>Email: {seller.email}</p>

                                {/* Seller Reviews Section */}
                                <div className={styles.reviewsContainer}>
                                    <h4>Seller Reviews</h4>
                                    {seller.reviews && seller.reviews.length > 0 ? (
                                        <div className={styles.reviewsBox}>
                                            {seller.reviews.map((review, index) => (
                                                <p key={index} className={styles.review}>{review}</p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No reviews available</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p>Seller information not available</p>
                        )}
                    </div>

                    {!inCart && (
                        <div className={styles.addToCart}>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                                className={styles.quantityInput}
                            />
                            <button onClick={handleAddToCart} className={styles.addButton}>
                                Add to Cart
                            </button>
                        </div>
                    )}

                    {inCart && (
                        <div className={styles.cartActions}>
                            <button onClick={handleRemoveFromCart} className={styles.removeButton}>
                                Remove from Cart
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Product;
