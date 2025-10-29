import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

interface UserInfo {
  sub: string;
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}


// We'll pass userInfo via search params temporarily
export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return search;
  },
})

function RouteComponent() {
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/user-info')
      .then(res => res.json())
      .then(data => {
        setUserInfo(data.userInfo);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch user info:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="nhsuk-heading-l">Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div>
        <h1 className="nhsuk-heading-l">Dashboard</h1>
        <p>No user information available. Please <a href="/auth/login">log in</a>.</p>
        <p style={{ marginTop: '1rem' }}>
          <small style={{ color: '#768692' }}>
            Debug: If you just logged in and see this message, the cookie may not have been set properly.
            Check the browser console and network tab for errors.
          </small>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="nhsuk-heading-l">Dashboard</h1>
      <h2 className="nhsuk-heading-m">Welcome, {userInfo.name || 'User'}!</h2>

      <div className="nhsuk-card">
        <div className="nhsuk-card__content">
          <h3 className="nhsuk-card__heading">User Information</h3>
          <dl className="nhsuk-summary-list">
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key">Name</dt>
              <dd className="nhsuk-summary-list__value">{userInfo.name || 'N/A'}</dd>
            </div>
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key">Email</dt>
              <dd className="nhsuk-summary-list__value">{userInfo.email || 'N/A'}</dd>
            </div>
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key">Given Name</dt>
              <dd className="nhsuk-summary-list__value">{userInfo.given_name || 'N/A'}</dd>
            </div>
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key">Family Name</dt>
              <dd className="nhsuk-summary-list__value">{userInfo.family_name || 'N/A'}</dd>
            </div>
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key">User ID (sub)</dt>
              <dd className="nhsuk-summary-list__value">{userInfo.sub}</dd>
            </div>
          </dl>
        </div>
      </div>

      <a href="/auth/logout" className="nhsuk-button nhsuk-button--secondary">
        Log out
      </a>
    </div>
  );
}

