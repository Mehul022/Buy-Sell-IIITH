import React, { useState, useEffect, useRef } from 'react';
import styles from './DeliverItems.module.css';
import Navbar from '../Components/Navbar';

export default function DeliverItems() {
  const [orders, setOrders] = useState([]);
  const [otpInputs, setOtpInputs] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const orderListRef = useRef(null);

  useEffect(() => {
    fetchUndeliveredOrders();
  }, []);

  const fetchUndeliveredOrders = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3000/api/seller/undelivered-orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch undelivered orders');
      }

      const data = await response.json();
      setOrders(data);

      const initialOtpInputs = data.reduce((acc, order) => {
        acc[order._id] = '';
        return acc;
      }, {});

      setOtpInputs(initialOtpInputs);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching undelivered orders:', error);
      setErrors({ fetch: error.message });
      setIsLoading(false);
    }
  };

  const handleOtpChange = (orderId, value) => {
    const numericValue = value.replace(/\D/g, '');

    setOtpInputs(prev => ({
      ...prev,
      [orderId]: numericValue
    }));

    if (errors[orderId]) {
      const newErrors = { ...errors };
      delete newErrors[orderId];
      setErrors(newErrors);
    }
  };

  const handleDeliveryConfirmation = async (orderId) => {
    const enteredOtp = otpInputs[orderId];

    if (!enteredOtp || enteredOtp.length !== 6) {
      setErrors(prev => ({
        ...prev,
        [orderId]: 'OTP must be 6 digits'
      }));
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/seller/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          otp: enteredOtp
        })
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(prev => prev.filter(order => order._id !== orderId));

        setOtpInputs(prev => {
          const newInputs = { ...prev };
          delete newInputs[orderId];
          return newInputs;
        });
      } else {
        setErrors(prev => ({
          ...prev,
          [orderId]: data.message || 'Delivery confirmation failed'
        }));
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      setErrors(prev => ({
        ...prev,
        [orderId]: 'Network error. Please try again.'
      }));
    }
  };

  const scrollToBottom = () => {
    if (orderListRef.current) {
      orderListRef.current.scrollTop = orderListRef.current.scrollHeight;
    }
  };

  const scrollToTop = () => {
    if (orderListRef.current) {
      orderListRef.current.scrollTop = 0;
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar title="Tech Mart IIIT" />
        <div className={styles.container}>
          <p>Loading orders...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Tech Mart IIIT" />
      <div className={styles.container}>
        <h2>Undelivered Orders</h2>

        {orders.length > 5 && (
          <div className={styles.scrollControls}>
            <button onClick={scrollToTop}>↑ Scroll to Top</button>
            <button onClick={scrollToBottom}>↓ Scroll to Bottom</button>
          </div>
        )}

        {errors.fetch && (
          <div className={styles.errorMessage}>
            {errors.fetch}
          </div>
        )}

        {orders.length === 0 ? (
          <p>No undelivered orders</p>
        ) : (
          <div
            ref={orderListRef}
            className={styles.orderList}
          >
            {orders.map(order => (
              <div key={order._id} className={styles.orderCard}>
                <div className={styles.orderDetails}>
                  <p>Product: {order.productId.name}</p>
                  <p>Description: {order.productId.description}</p>
                  <p>Quantity: {order.quantity}</p>
                  <p>Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                  <p>Buyer Name: {order.userId.firstName}</p>
                  <p>Buyer Email: {order.userId.email}</p>
                  <p>Buyer Contact Number: {order.userId.contactNumber}</p>

                </div>

                <div className={styles.otpSection}>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otpInputs[order._id] || ''}
                    onChange={(e) => handleOtpChange(order._id, e.target.value)}
                    maxLength={6}
                    className={styles.otpInput}
                  />
                  <button
                    onClick={() => handleDeliveryConfirmation(order._id)}
                    className={styles.confirmButton}
                  >
                    Confirm Delivery
                  </button>
                  {errors[order._id] && (
                    <div className={styles.errorMessage}>
                      {errors[order._id]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}