import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../auth/auth';

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // If not authenticated, redirect to the login page.
    // The 'replace' prop is used to replace the current entry in the history stack,
    // so the user can't click "back" to get to the protected page.
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child components that were passed in.
  return children;
};

export default ProtectedRoute;
