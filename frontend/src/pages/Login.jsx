import { Link } from 'react-router-dom';

function Login() {
  return (
    <section className="card login-card">
      <h2>Login</h2>
      <p>This is a placeholder login screen for Day 1 structure setup.</p>
      <Link className="inline-link" to="/dashboard">
        Go to Dashboard
      </Link>
    </section>
  );
}

export default Login;
