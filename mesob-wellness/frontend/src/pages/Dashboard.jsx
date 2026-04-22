import { useEffect, useState } from 'react';
import { fetchHealth } from '../services/healthService';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHealth() {
      try {
        setLoading(true);
        const result = await fetchHealth();
        setHealth(result);
      } catch (err) {
        setError('Failed to reach backend /api/health endpoint.');
      } finally {
        setLoading(false);
      }
    }

    loadHealth();
  }, []);

  return (
    <section className="card">
      <h2>Dashboard</h2>
      <p>App running</p>

      {loading && <p className="status-text">Checking backend health...</p>}

      {!loading && error && <p className="error-text">{error}</p>}

      {!loading && health && (
        <div className="status-box">
          <h3>Health Response</h3>
          <pre>{JSON.stringify(health, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
