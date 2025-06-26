import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Homenavbar(props) {
    const [userName, setUserName] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/user/me', {
                    withCredentials: true,
                });
                setUserName(response.data.firstName + " " + response.data.lastName);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };
        fetchUserData();
    }, []);

    // Fetch initial products or search results
    const fetchSearchResults = async (query = '') => {
        try {
            const response = query.length > 0
                ? await axios.get(`http://localhost:3000/api/products/search`, {
                    params: { q: query }
                })
                : await axios.get(`http://localhost:3000/api/products/initial`);

            setSearchResults(response.data.slice(0, 18)); // Limit to 18 results
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        }
    };

    // Trigger search on first modal open or when query changes
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        fetchSearchResults(query);
    };

    // Show initial products when search modal is opened
    const handleSearchClick = () => {
        setShowSearchModal(true);
        if (searchResults.length === 0) {
            fetchSearchResults();
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:3000/logout', {}, { withCredentials: true });
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    };

    const handleSearchItemClick = (productId) => {
        navigate(`/product/${productId}`);
        setShowSearchModal(false);
        setSearchQuery('');
    };

    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
                <div className="container-fluid px-4">
                    <Link to="/home" className="navbar-brand fw-bold">
                        {props.title}
                    </Link>

                    <div className="d-flex align-items-center">
                        {userName && (
                            <div className="me-3">
                                <span className="fw-semibold">{userName}</span>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="me-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search products..."
                                value={searchQuery}
                                onClick={handleSearchClick}
                                onChange={handleSearchChange}
                                style={{ width: '250px' }}
                            />
                        </div>

                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarContent"
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>
                    </div>

                    <div className="collapse navbar-collapse" id="navbarContent">
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link className="nav-link" to="/home">Home</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/profile">Profile</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/orders">Orders</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/sell">Sell</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/deliver">Deliver Items</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/cart">My Cart</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/chatbot">Chatbot</Link>
                            </li>
                            <li className="nav-item">
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Search Modal */}
            {showSearchModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        paddingTop: '10vh'
                    }}
                    onClick={() => setShowSearchModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            width: '500px',
                            maxHeight: '70vh',
                            overflowY: 'auto',
                            borderRadius: '10px',
                            padding: '20px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {searchResults.length > 0 ? (
                            <div>
                                {searchResults.map((product) => (
                                    <div
                                        key={product._id}
                                        onClick={() => handleSearchItemClick(product._id)}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '10px',
                                            borderBottom: '1px solid #eee',
                                            transition: 'background-color 0.3s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        {product.name}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted">
                                {searchQuery.length > 0
                                    ? 'No products available matching your search'
                                    : 'Start typing to search products'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}