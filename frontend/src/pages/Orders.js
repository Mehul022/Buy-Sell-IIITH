import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../Components/Navbar';
import styles from './Orders.module.css';

const Orders = () => {
  const [activeTab, setActiveTab] = useState('bought');
  const [boughtOrders, setBoughtOrders] = useState([]);
  const [soldOrders, setSoldOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const boughtResponse = await axios.get('/api/orders/bought');
      const soldResponse = await axios.get('/api/orders/sold');

      // Sort bought orders by date (most recent first)
      const sortedBoughtOrders = boughtResponse.data.sort((a, b) =>
        new Date(b.orderDate) - new Date(a.orderDate)
      );

      // Separate undelivered and delivered bought orders
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
            className={`${styles.orderCard} ${order.isDelivered ? styles.deliveredOrder : styles.undeliveredOrder
              }`}
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

              {!order.isDelivered && (
                <div className={styles.otpHighlight}>
                  <strong>OTP: {order.otp}</strong>
                  <p className={styles.otpWarning}>
                    Note: Provide this OTP to seller for order verification
                  </p>
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