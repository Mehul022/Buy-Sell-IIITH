import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './home.module.css';
import Homenavbar from '../Components/homenavbar.js';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const itemsPerPage = 6; // Show 6 items per page

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/home?page=${currentPage}&limit=${itemsPerPage}&category=${category}&priceRange=${priceRange}`
        );
        setProducts(response.data.products);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage, category, priceRange]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        // Assuming categories are returned as an array of strings
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]); // Fallback to an empty array
      }
    };
    fetchCategories();
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (e) => {
    setPriceRange(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #325672, #d9e3f0)', minHeight: '100vh' }}>
      <Homenavbar title="Tech Mart IIIT" />
      <div className={styles.container}>
        {/* Filters */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
          <select onChange={handleCategoryChange} value={category}>
            <option value="all">All Categories</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select onChange={handlePriceRangeChange} value={priceRange}>
            <option value="all">All Prices</option>
            <option value="0-100">$0 - $100</option>
            <option value="101-500">$101 - $500</option>
            <option value="501-1000">$501 - $1000</option>
            <option value="1001+">$1000+</option>
          </select>
        </div>

        {/* Products */}
        <div className={styles.scrollableGrid}>
          {products.map((product) => (
            <Link to={`/product/${product._id}`} key={product.id} className={styles.card}>
              <h3>{product.name}</h3>
              <p>Price: ${product.price.toLocaleString()}</p>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          {currentPage > 1 && currentPage !== 2 && (
            <button onClick={() => handlePageChange(1)}>First</button>
          )}
          {currentPage > 1 && (
            <button onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
          )}
          {currentPage < totalPages && (
            <button onClick={() => handlePageChange(currentPage + 1)}>Next</button>
          )}
          {currentPage < totalPages - 1 && (
            <button onClick={() => handlePageChange(totalPages)}>Last</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
