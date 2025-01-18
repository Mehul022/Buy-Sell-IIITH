import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./navbar.css";

export default function Navbar(props) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:3000/logout', {}, { withCredentials: true });
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Add search functionality here
    };

    return (
        <div>
            <nav className="navbar navbar-expand-lg bg-body-tertiary">
                <div className="container-fluid">
                    <b>{props.title}</b>
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <input
                            className="form-control me-2 search-bar"
                            type="search"
                            placeholder="Search"
                            aria-label="Search"
                            onSubmit={handleSearch}
                        />
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link
                                    className="nav-link active"
                                    to="/home"
                                >
                                    Home
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className="nav-link active"
                                    to="/profile"
                                >
                                    Profile
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className="nav-link"
                                    to="/orders"
                                >
                                    Orders
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className="nav-link"
                                    to="/deliver"
                                >
                                    Deliver Items
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className="nav-link"
                                    to="/cart"
                                >
                                    My Cart
                                </Link>
                            </li>
                            <button
                                className="btn btn-outline-success"
                                onClick={handleLogout}
                                type="button"
                            >
                                Logout
                            </button>
                        </ul>
                    </div>
                </div>
            </nav>
        </div>
    );
}