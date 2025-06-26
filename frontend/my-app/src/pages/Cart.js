import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../Components/Navbar.js';
import styles from './Cart.module.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cartItems]);

  const fetchCartItems = async () => {
    try {
      const response = await axios.get('/api/cart');
      setCartItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const totalAmount = cartItems.reduce((sum, item) =>
      sum + (item.product.price * item.quantity), 0);
    setTotal(totalAmount);
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const response = await axios.put(`/api/cart/update`, {
        productId: productId, // Use the product's _id from the product object
        quantity: newQuantity
      }, {
        withCredentials: true
      });

      // Update local state directly
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      await axios.delete(`/api/cart/${productId}`);

      // Remove item from local state
      setCartItems(prevItems =>
        prevItems.filter(item => item.productId !== productId)
      );
    } catch (error) {
      console.error('Error removing item:', error.response?.data || error.message);
      alert('Failed to remove item');
    }
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      const response = await axios.post('/api/orders', { cartItems });

      // Clear cart and reset total
      setCartItems([]);
      setTotal(0);

      alert('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);

      // Detailed error handling
      if (error.response) {
        alert(error.response.data.message || 'Failed to place order');
      } else if (error.request) {
        alert('No response from server');
      } else {
        alert('Error preparing order');
      }
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.cartPage}>
      <Navbar title="Tech Mart IIIT" />
      <div className={styles.cartContainer}>
        <h1>Your Cart</h1>
        {cartItems.length === 0 ? (
          <p className={styles.emptyCart}>Your cart is empty</p>
        ) : (
          <div className={styles.cartContent}>
            <div className={styles.cartItemsList}>
              {cartItems.map((item) => (
                <div key={item._id} className={styles.cartItem}>
                  <div className={styles.itemDetails}>
                    <h3>{item.product.name}</h3>
                    <p>Price: ${item.product.price}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.quantityControl}>
                      <button
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeItem(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                  <p className={styles.subtotal}>
                    Subtotal: ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className={styles.cartSummary}>
              <h2>Total: ${total.toFixed(2)}</h2>
              <button className={styles.placeOrderButton} onClick={placeOrder}>
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;