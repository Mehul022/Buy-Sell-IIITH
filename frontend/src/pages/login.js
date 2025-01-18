import React from 'react';
import styles from './login.module.css';

export default function Login() {
    return (
        <div className={styles.container}>
            <form className={styles.formWrapper}>
                <div>
                    <label className={styles.formLabel} htmlFor="exampleInputEmail1">
                        Email (Only IIIT)*
                    </label>
                    <input
                        type="email"
                        className={styles.formInput}
                        placeholder="email.iiit.ac.in"
                        id="exampleInputEmail1"
                        aria-describedby="emailHelp"
                    />
                </div>

                <div>
                    <label className={styles.formLabel} htmlFor="exampleInputPassword1">
                        Password
                    </label>
                    <input
                        type="password"
                        className={styles.formInput}
                        id="exampleInputPassword1"
                    />
                </div>

                <div>
                    <button type="submit" className={styles.submitButton}>
                        LOGIN
                    </button>
                </div>

                <div className={styles.loginLink}>
                    <a href="/">Don't have an account</a>
                </div>
            </form>
        </div>
    );
}