import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {}
          <div className="footer__brand">
            <div className="footer__logo">
              <span>⛳</span>
              <span>Digital<span className="text-primary">Heroes</span></span>
            </div>
            <p>Play. Win. Give.<br />Golf performance meets charitable impact.</p>
          </div>

          {}
          <div className="footer__col">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/charities">Charities</Link></li>
              <li><Link to="/winners">Winners</Link></li>
              <li><Link to="/subscribe">Subscribe</Link></li>
            </ul>
          </div>

          {}
          <div className="footer__col">
            <h4>Account</h4>
            <ul>
              <li><Link to="/signup">Sign Up</Link></li>
              <li><Link to="/login">Log In</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>

          {}
          <div className="footer__col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} Digital Heroes. All rights reserved.</p>
          <p className="footer__tagline">Made with ❤️ for golf &amp; good causes</p>
        </div>
      </div>
    </footer>
  )
}
