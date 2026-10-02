import "./globals.css";
import ThemeToggle from "../components/ThemeToggle";

export const metadata = {
  title: "WeebHQ.com - Anime and Manga Database and Community",
  description: "Welcome to WeebHQ, the ultimate anime and manga database.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <div className="header-wrapper">
          <div className="header-container">
            <a href="/" className="header-logo">WeebHQ.com</a>
            <div className="header-nav" style={{display: "flex", alignItems: "center"}}>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="sub-menu">
          <div className="sub-menu-container">
            <div className="dropdown">
              <a href="#" className="dropbtn">Anime</a>
              <div className="dropdown-content">
                <a href="/anime/search">Anime Search</a>
                <a href="/anime/top">Top Anime</a>
                <a href="#">Seasonal Anime</a>
                <a href="#">Videos</a>
                <a href="#">Reviews</a>
                <a href="#">Recommendations</a>
                <a href="#">2026 Challenge</a>
                <a href="#">Fantasy Anime League</a>
              </div>
            </div>
            <div className="dropdown">
              <a href="#" className="dropbtn">Manga</a>
              <div className="dropdown-content">
                <a href="#">Manga Search</a>
                <a href="#">Top Manga</a>
                <a href="#">Adapted to Anime <span className="tag-new">New</span></a>
                <a href="#">Manga Store</a>
                <a href="#">Reviews</a>
                <a href="#">Recommendations</a>
                <a href="#">2026 Challenge</a>
              </div>
            </div>
            <div className="dropdown">
              <a href="#" className="dropbtn">Community</a>
              <div className="dropdown-content">
                <a href="#">Forums</a>
                <a href="#">Clubs</a>
                <a href="#">Blogs</a>
                <a href="#">Users</a>
                <a href="#">Discord</a>
              </div>
            </div>
            <a href="#" className="dropbtn">Industry</a>
            <div className="dropdown">
              <a href="#" className="dropbtn">Watch</a>
              <div className="dropdown-content">
                <a href="#">Episode Videos</a>
                <a href="#">Anime Trailers</a>
              </div>
            </div>
            <a href="#" className="dropbtn">Read</a>
            <a href="#" className="dropbtn">Help</a>
          </div>
        </div>
        
        {children}
        
        <footer className="footer">
          <div className="footer-top">
            <div className="footer-container footer-cols">
              <div className="footer-col">
                <div className="footer-col-header">
                  <span>Top Anime</span>
                  <a href="#">More</a>
                </div>
                <ul className="footer-list">
                  <li><span className="footer-rank">1</span> <a href="#">Sousou no Frieren</a></li>
                  <li><span className="footer-rank">2</span> <a href="#">Re:Zero kara Hajimeru Isekai Seikatsu</a></li>
                  <li><span className="footer-rank">3</span> <a href="#">Fullmetal Alchemist: Brotherhood</a></li>
                  <li><span className="footer-rank">4</span> <a href="#">Steins;Gate</a></li>
                  <li><span className="footer-rank">5</span> <a href="#">Steel Ball Run</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <div className="footer-col-header">
                  <span>Top Airing Anime</span>
                  <a href="#">More</a>
                </div>
                <ul className="footer-list">
                  <li><span className="footer-rank">1</span> <a href="#">Steel Ball Run</a></li>
                  <li><span className="footer-rank">2</span> <a href="#">Bleach: Sennen Kessen-hen</a></li>
                  <li><span className="footer-rank">3</span> <a href="#">One Piece</a></li>
                  <li><span className="footer-rank">4</span> <a href="#">Chiikawa</a></li>
                  <li><span className="footer-rank">5</span> <a href="#">Seihantai na Kimi to Boku</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <div className="footer-col-header">
                  <span>Most Popular Characters</span>
                  <a href="#">More</a>
                </div>
                <ul className="footer-list">
                  <li><span className="footer-rank">1</span> <a href="#">Lamperouge, Lelouch</a></li>
                  <li><span className="footer-rank">2</span> <a href="#">Monkey D., Luffy</a></li>
                  <li><span className="footer-rank">3</span> <a href="#">Levi</a></li>
                  <li><span className="footer-rank">4</span> <a href="#">Lawliet, L</a></li>
                  <li><span className="footer-rank">5</span> <a href="#">Roronoa, Zoro</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-container">
              <div className="social-row-centered">
                <div className="social-links">
                  <span>Follow Us</span>
                  <div className="social-icons">
                    <a href="#" className="social-icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                    </a>
                    <a href="#" className="social-icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.231 2.227h-3.953l-6.398 7.378-5.121-7.378h-7.759l9.336 13.433-6.84 7.892h3.953l6.815-7.859 5.501 7.859h7.759l-9.845-14.167 6.552-7.158zm-5.068 18.232h-2.193l-10.05-14.475h2.274l10.048 14.475z"/></svg>
                    </a>
                    <a href="#" className="social-icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                    <a href="#" className="social-icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="footer-nav">
                <a href="#">Home</a>
                <a href="#">About</a>
                <a href="#">Press Room</a>
                <a href="#">Support</a>
                <a href="#">Advertising</a>
                <a href="#">FAQ</a>
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
                <a href="#">Privacy Settings</a>
                <a href="#">Cookie</a>
                <a href="#">Notice at Collection</a>
                <a href="#">Sitemap</a>
              </div>
              
              <div className="footer-copy">
                WeebHQ.com is a property of WeebHQ Co., Ltd. ©2026 All Rights Reserved.<br/>
                <span style={{fontSize: "10px", color: "#666"}}>This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
