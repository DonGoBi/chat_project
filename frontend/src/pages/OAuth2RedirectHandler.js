import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { login } from '../auth/auth';

const OAuth2RedirectHandler = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            console.log("Received token:", token);
            login(token); // Store the token in localStorage
            navigate('/', { replace: true }); // Redirect to the main page
        } else {
            console.error("No token found in URL.");
            // Handle error, maybe redirect to login page with an error message
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div>
            <p>Logging in, please wait...</p>
        </div>
    );
};

export default OAuth2RedirectHandler;
