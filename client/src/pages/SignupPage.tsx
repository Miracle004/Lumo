import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .max(20, 'Must be 20 characters or less')
        .required('Required'),
      email: Yup.string().email('Invalid email address').required('Required'),
      password: Yup.string()
        .min(8, 'Must be at least 8 characters')
        .required('Required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await axios.post('/user/signup', {
          username: values.username,
          email: values.email,
          password: values.password,
        });
        if (response.status === 201) { // Assuming 201 Created for successful signup
          navigate('/login'); // Redirect to login page
        } else {
          setError(response.data.message || 'Signup failed');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'An unexpected error occurred');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join the Lumo community today</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="auth-form">
          {error && <div className="error-text auth-error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
              className={formik.touched.username && formik.errors.username ? 'error-input' : ''}
              placeholder="johndoe"
            />
            {formik.touched.username && formik.errors.username ? (
              <div className="error-message">{formik.errors.username}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              className={formik.touched.email && formik.errors.email ? 'error-input' : ''}
              placeholder="you@example.com"
            />
            {formik.touched.email && formik.errors.email ? (
              <div className="error-message">{formik.errors.email}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
              className={formik.touched.password && formik.errors.password ? 'error-input' : ''}
              placeholder="••••••••"
            />
            {formik.touched.password && formik.errors.password ? (
              <div className="error-message">{formik.errors.password}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.confirmPassword}
              className={formik.touched.confirmPassword && formik.errors.confirmPassword ? 'error-input' : ''}
              placeholder="••••••••"
            />
            {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
              <div className="error-message">{formik.errors.confirmPassword}</div>
            ) : null}
          </div>

          <button type="submit" className="btn btn-primary btn-block auth-btn" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;