import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../Components/Navbar';
import styles from './Orders.module.css';

const Orders = () => {
  const [activeTab, setActiveTab] = useState('bought');
  const [boughtOrders, setBoughtOrders] = useState([]);
  const [soldOrders, setSoldOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState('');
  const [reviewOrderId, setReviewOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const boughtResponse = await axios.get('/api/orders/bought');
      const soldResponse = await axios.get('/api/orders/sold');

      const sortedBoughtOrders = boughtResponse.data.sort((a, b) =>
        new Date(b.orderDate) - new Date(a.orderDate)
      );

      const undeliveredOrders = sortedBoughtOrders.filter(order => !order.isDelivered);
      const deliveredOrders = sortedBoughtOrders.filter(order => order.isDelivered);

      setBoughtOrders([...undeliveredOrders, ...deliveredOrders]);
      setSoldOrders(soldResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (orderId) => {
    try {
      await axios.post('/api/reviews/add', {
        orderId,
        review
      });

      setReview('');
      setReviewOrderId(null);
      alert('Review submitted successfully!');
      fetchOrders(); // Refresh orders to update UI
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const regenerateOTP = async (orderId) => {
    try {
      const response = await axios.post(`/api/orders/${orderId}/regenerate-otp`);
      const newOtp = response.data.otp;

      // Update the order in the local state with the new OTP
      setBoughtOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, otp: newOtp } : order
        )
      );

      alert(`New OTP generated: ${newOtp}`);
    } catch (error) {
      console.error('Error regenerating OTP:', error);
      alert('Failed to regenerate OTP. Please try again.');
    }
  };

  const renderBoughtOrders = () => {
    if (boughtOrders.length === 0) {
      return (
        <div className={styles.emptyState}>
          Not bought anything yet
        </div>
      );
    }

    return (
      <div className={styles.ordersList}>
        {boughtOrders.map((order) => (
          <div
            key={order._id}
            className={`${styles.orderCard} ${order.isDelivered ? styles.deliveredOrder : styles.undeliveredOrder}`}
          >
            <div className={styles.orderHeader}>
              <h3>{order.productId.name}</h3>
              <span>{new Date(order.orderDate).toLocaleDateString()}</span>
            </div>
            <div className={styles.orderDetails}>
              <p>Name: {order.productId.name}</p>
              <p>Quantity: {order.quantity}</p>
              <p>Total Price: ${order.quantity * order.productId.price}</p>
              <p>Seller email: {order.sellerId.email}</p>
              <p>Status: {order.isDelivered ? 'Delivered' : 'Pending'}</p>

              {!order.isDelivered ? (
                <div className={styles.otpSection}>
                  <button
                    className={styles.regenerateBtn}
                    onClick={() => regenerateOTP(order._id)}
                  >
                    Regenerate OTP
                  </button>
                </div>
              ) : (
                <div className={styles.reviewSection}>
                  {reviewOrderId === order._id ? (
                    <div className={styles.reviewForm}>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Write your review here..."
                        className={styles.reviewInput}
                      />
                      <div className={styles.reviewButtons}>
                        <button
                          className={styles.submitBtn}
                          onClick={() => handleReviewSubmit(order._id)}
                        >
                          Submit Review
                        </button>
                        <button
                          className={styles.cancelBtn}
                          onClick={() => {
                            setReviewOrderId(null);
                            setReview('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className={styles.addReviewBtn}
                      onClick={() => setReviewOrderId(order._id)}
                    >
                      Add Review
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSoldOrders = () => {
    const deliveredSoldOrders = soldOrders.filter(order => order.isDelivered);

    if (deliveredSoldOrders.length === 0) {
      return (
        <div className={styles.emptyState}>
          Not sold yet
        </div>
      );
    }

    return (
      <div className={styles.ordersList}>
        {deliveredSoldOrders.map((order) => (
          <div key={order._id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <h3>{order.productId.name}</h3>
              <span>{new Date(order.orderDate).toLocaleDateString()}</span>
            </div>
            <div className={styles.orderDetails}>
              <p>Name: {order.productId.name}</p>
              <p>Quantity: {order.quantity}</p>
              <p>Buyer: {order.userId.firstName} {order.userId.lastName}</p>
              <p>Buyer Email: {order.userId.email}</p>
              <p>Total Price: ${order.quantity * order.productId.price}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.ordersPage}>
      <Navbar title="Tech Mart IIIT" />
      <div className={styles.ordersContainer}>
        <div className={styles.tabNavigation}>
          <button
            className={activeTab === 'bought' ? styles.activeTab : styles.inactiveTab}
            onClick={() => setActiveTab('bought')}
          >
            Bought Orders
          </button>
          <button
            className={activeTab === 'sold' ? styles.activeTab : styles.inactiveTab}
            onClick={() => setActiveTab('sold')}
          >
            Sold Orders
          </button>
        </div>
        <div className={styles.ordersContent}>
          {activeTab === 'bought' ? renderBoughtOrders() : renderSoldOrders()}
        </div>
      </div>
    </div>
  );
};

export default Orders;