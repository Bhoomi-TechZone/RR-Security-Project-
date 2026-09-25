import { Zap, Lock, ArrowRight } from 'lucide-react'
import LoginForm from '../../components/auth/LoginForm'
import styles from './Login.module.css'

/**
 * Login Page — /login
 *
 * Layout inspired by clean SaaS HR portals:
 * - Top navbar with brand + sign-in label
 * - Centered white card with lock icon, heading, and form
 * - Bottom footer with links
 */
function Login() {
  return (
    <div className={styles.page} aria-label="NovaSpark HRMS login">

      {/* ---- Top Navbar ---- */}
      <nav className={styles.navbar} aria-label="Site navigation">
        <div className={styles.navBrand}>
          <span className={styles.navLogoIcon} aria-hidden="true">
            <Zap size={16} strokeWidth={2.5} color="#ffffff" fill="rgba(255,255,255,0.4)" />
          </span>
          <span className={styles.navBrandName}>RR Security</span>
        </div>
        {/* <span className={styles.navSignIn}>Sign In</span> */}
      </nav>

      {/* ---- Main Content ---- */}
      <main className={styles.main}>
        <div className={styles.card}>

          {/* Lock Icon */}
          <div className={styles.iconWrap} aria-hidden="true">
            <Lock size={26} strokeWidth={2} color="#2563eb" />
          </div>

          {/* Heading */}
          <h1 className={styles.heading}>Welcome Back</h1>
          <p className={styles.subheading}>
            Please sign in to access your HR dashboard
          </p>

          {/* Login Form */}
          <LoginForm />

        </div>
      </main>

      {/* ---- Bottom Footer ---- */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerLogoIcon} aria-hidden="true">
            <Zap size={13} strokeWidth={2.5} color="#6b6375" fill="rgba(107,99,117,0.3)" />
          </span>
          <span className={styles.footerBrand}>NovaSpark</span>
        </div>

        <nav className={styles.footerLinks} aria-label="Footer links">
          <a href="#" className={styles.footerLink}>Privacy Policy</a>
          <a href="#" className={styles.footerLink}>Terms of Service</a>
          <a href="#" className={styles.footerLink}>Security</a>
          <a href="#" className={styles.footerLink}>Help Center</a>
        </nav>

        <span className={styles.footerCopy}>
          © {new Date().getFullYear()} NovaSpark HRMS. All rights reserved.
        </span>
      </footer>
    </div>
  )
}

export default Login
