<template>
<footer class="main-footer">
  <div class="container">
    <!-- Main Footer Content -->
    <div class="footer-content">
      <!-- Brand Section -->
      <div class="footer-brand">
        <div class="brand-logo">
          <!-- <img src="/src/assets/logo/1.png" alt="Your Dreams Academy" class="logo"> -->
          <span class="brand-name">Your Dreams Academy</span>
        </div>
        <p class="brand-tagline">Building Wealth And A Healthy Mind, Brick by Brick</p>
        <p class="brand-description">
          Empowering individuals with financial literacy, discipline, and entrepreneurial skills
          to transform lives and create lasting impact.
        </p>
        <div class="social-links">
          <a href="https://facebook.com" class="social-link" aria-label="Facebook" target="_blank" rel="noopener">
            <i class="fab fa-facebook-f"></i>
          </a>
          <a href="https://twitter.com" class="social-link" aria-label="Twitter" target="_blank" rel="noopener">
            <i class="fab fa-twitter"></i>
          </a>
          <a href="https://instagram.com" class="social-link" aria-label="Instagram" target="_blank" rel="noopener">
            <i class="fab fa-instagram"></i>
          </a>
          <a href="https://linkedin.com" class="social-link" aria-label="LinkedIn" target="_blank" rel="noopener">
            <i class="fab fa-linkedin-in"></i>
          </a>
          <a href="https://youtube.com" class="social-link" aria-label="YouTube" target="_blank" rel="noopener">
            <i class="fab fa-youtube"></i>
          </a>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="footer-section">
        <h4 class="footer-section-title">Quick Links</h4>
        <ul class="footer-links">
          <li><router-link to="/" class="footer-link">Home</router-link></li>
          <li><router-link to="/courses" class="footer-link">All Courses</router-link></li>
          <li><router-link to="/courses/popular" class="footer-link">Popular Courses</router-link></li>
          <li><router-link to="/courses/new" class="footer-link">New Courses</router-link></li>
          <li><router-link to="/lessons" class="footer-link">Lessons</router-link></li>
        </ul>
      </div>

      <!-- Courses -->
      <div class="footer-section">
        <h4 class="footer-section-title">Our Courses</h4>
        <ul class="footer-links">
          <li><router-link to="/courses" class="footer-link">Financial Literacy</router-link></li>
          <li><router-link to="/courses" class="footer-link">Discipline & Habits</router-link></li>
          <li><router-link to="/courses" class="footer-link">Entrepreneurship</router-link></li>
          <li><router-link to="/courses" class="footer-link">Personal Development</router-link></li>
          <li><router-link to="/courses" class="footer-link">Mindfulness</router-link></li>
        </ul>
      </div>

      <!-- Support -->
      <div class="footer-section">
        <h4 class="footer-section-title">Support</h4>
        <ul class="footer-links">
          <li><router-link to="/help" class="footer-link">Help Center</router-link></li>
          <li><router-link to="/faq" class="footer-link">FAQ</router-link></li>
          <li><router-link to="/contact" class="footer-link">Contact Us</router-link></li>
          <li><router-link to="/privacy" class="footer-link">Privacy Policy</router-link></li>
          <li><router-link to="/terms" class="footer-link">Terms of Service</router-link></li>
        </ul>
      </div>

      <!-- Contact Info -->
      <div class="footer-section">
        <h4 class="footer-section-title">Contact Us</h4>
        <div class="contact-info">
          <div class="contact-item">
            <i class="fas fa-envelope"></i>
            <div>
              <p class="contact-label">Email</p>
              <a href="mailto:yourdreamsacademy@gmail.com" class="contact-link">yourdreamsacademy@gmail.com</a>
            </div>
          </div>
          <div class="contact-item">
            <i class="fas fa-clock"></i>
            <div>
              <p class="contact-label">Support Hours</p>
              <p class="contact-text">Mon - Fri: 9AM - 6PM</p>
            </div>
          </div>
          <div class="contact-item">
            <i class="fas fa-globe"></i>
            <div>
              <p class="contact-label">Based In</p>
              <p class="contact-text">South Africa</p>
            </div>
          </div>
        </div>

        <!-- Newsletter Subscription -->
        <div class="newsletter">
          <h5 class="newsletter-title">Stay Updated</h5>
          <p class="newsletter-text">Get the latest course updates and tips</p>
          <div class="newsletter-form">
            <input
              type="email"
              v-model="email"
              placeholder="Enter your email"
              class="newsletter-input"
              @keyup.enter="subscribeNewsletter"
            >
            <button class="newsletter-btn" @click="subscribeNewsletter">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Bottom -->
    <div class="footer-bottom">
      <div class="footer-bottom-content">
        <p class="copyright">&copy; 2025 Your Dreams Academy. All rights reserved.</p>
        <div class="footer-bottom-links">
          <router-link to="/privacy" class="bottom-link">Privacy</router-link>
          <span class="separator">|</span>
          <router-link to="/terms" class="bottom-link">Terms</router-link>
          <span class="separator">|</span>
          <router-link to="/sitemap" class="bottom-link">Sitemap</router-link>
        </div>
      </div>
    </div>
  </div>
</footer>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')

const subscribeNewsletter = () => {
if (email.value && validateEmail(email.value)) {
  alert(`Thank you for subscribing with: ${email.value}`)
  email.value = ''
} else {
  alert('Please enter a valid email address')
}
}

const validateEmail = (email) => {
const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
return re.test(email)
}
</script>

<style scoped>
.main-footer {
background: linear-gradient(135deg, #06677e 0%, #087990 100%);
color: white;
padding: 3rem 0 0;
margin-top: auto;
position: relative;
overflow: hidden;
}

.main-footer::before {
content: '';
position: absolute;
top: 0;
left: 0;
right: 0;
height: 1px;
background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
}

.container {
max-width: 1200px;
margin: 0 auto;
padding: 0 1rem;
position: relative;
z-index: 1;
}

.footer-content {
display: grid;
grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
gap: 2rem;
padding-bottom: 2rem;
}

/* Brand Section */
.footer-brand {
display: flex;
flex-direction: column;
gap: 1rem;
align-items: flex-start;
text-align: start;
}

.brand-logo {
display: flex;
align-items: center;
gap: 0.75rem;
margin-bottom: 0.5rem;
}

.logo {
width: 40px;
height: 40px;
object-fit: contain;
}

.brand-name {
font-size: var(--fs-lg);
font-weight: 700;
color: white;
}

.brand-tagline {
font-size: var(--fs-sm);
font-weight: 600;
color: rgba(255, 255, 255, 0.9);
line-height: 1.4;
text-align: start;
}

.brand-description {
font-size: var(--fs-sm);
color: rgba(255, 255, 255, 0.8);
line-height: 1.6;
margin-bottom: 1rem;
text-align: start;
}

.social-links {
display: flex;
gap: 0.75rem;
justify-content: flex-start;
}

.social-link {
display: flex;
align-items: center;
justify-content: center;
width: 36px;
height: 36px;
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 8px;
color: white;
text-decoration: none;
transition: all 0.3s ease;
backdrop-filter: blur(10px);
}

.social-link:hover {
background: rgba(255, 255, 255, 0.2);
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Footer Sections */
.footer-section {
display: flex;
flex-direction: column;
gap: 1rem;
align-items: flex-start;
text-align: start;
}

.footer-section-title {
font-size: var(--fs-base);
font-weight: 700;
color: white !important;
margin-bottom: 0.5rem;
position: relative;
text-align: start;
}

.footer-section-title::after {
content: '';
position: absolute;
bottom: -0.5rem;
left: 0;
width: 30px;
height: 2px;
background: rgba(255, 255, 255, 0.5);
border-radius: 1px;
}

.footer-links {
list-style: none;
padding: 0;
margin: 0;
display: flex;
flex-direction: column;
gap: 0.75rem;
align-items: flex-start;
}

.footer-link {
color: rgba(255, 255, 255, 0.8);
text-decoration: none;
font-size: var(--fs-sm);
transition: all 0.3s ease;
display: inline-flex;
align-items: center;
gap: 0.5rem;
text-align: start;
}

.footer-link::before {
content: '›';
font-weight: bold;
opacity: 0;
transform: translateX(-5px);
transition: all 0.3s ease;
}

.footer-link:hover {
color: white;
transform: translateX(5px);
}

.footer-link:hover::before {
opacity: 1;
transform: translateX(0);
}

/* Contact Info */
.contact-info {
display: flex;
flex-direction: column;
gap: 1rem;
align-items: flex-start;
}

.contact-item {
display: flex;
align-items: flex-start;
gap: 0.75rem;
text-align: start;
}

.contact-item i {
color: rgba(255, 255, 255, 0.7);
margin-top: 0.125rem;
width: 16px;
}

.contact-label {
font-size: var(--fs-xs);
color: rgba(255, 255, 255, 0.7);
margin-bottom: 0.25rem;
text-align: start;
}

.contact-link {
color: rgba(255, 255, 255, 0.9);
text-decoration: none;
font-size: var(--fs-sm);
transition: color 0.3s ease;
text-align: start;
}

.contact-link:hover {
color: white;
}

.contact-text {
color: rgba(255, 255, 255, 0.9);
font-size: var(--fs-sm);
margin: 0;
text-align: start;
}

/* Newsletter */
.newsletter {
margin-top: 1.5rem;
padding-top: 1.5rem;
border-top: 1px solid rgba(255, 255, 255, 0.1);
text-align: start;
}

.newsletter-title {
font-size: var(--fs-sm);
font-weight: 600;
color: white !important;
margin-bottom: 0.5rem;
text-align: start;
}

.newsletter-text {
font-size: var(--fs-xs);
color: rgba(255, 255, 255, 0.8);
margin-bottom: 1rem;
line-height: 1.4;
text-align: start;
}

.newsletter-form {
display: flex;
gap: 0.5rem;
}

.newsletter-input {
flex: 1;
padding: 0.75rem;
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 6px;
background: rgba(255, 255, 255, 0.1);
color: white;
font-size: var(--fs-sm);
backdrop-filter: blur(10px);
transition: all 0.3s ease;
text-align: start;
}

.newsletter-input::placeholder {
color: rgba(255, 255, 255, 0.6);
}

.newsletter-input:focus {
outline: none;
border-color: rgba(255, 255, 255, 0.4);
background: rgba(255, 255, 255, 0.15);
}

.newsletter-btn {
padding: 0.75rem;
background: rgba(255, 255, 255, 0.2);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 6px;
color: white;
cursor: pointer;
transition: all 0.3s ease;
display: flex;
align-items: center;
justify-content: center;
min-width: 44px;
}

.newsletter-btn:hover {
background: rgba(255, 255, 255, 0.3);
transform: translateY(-1px);
}

/* Footer Bottom */
.footer-bottom {
border-top: 1px solid rgba(255, 255, 255, 0.1);
padding: .5rem;
background: rgba(0, 0, 0, 0.1);
}

.footer-bottom-content {
display: flex;
justify-content: space-between;
align-items: center;
flex-wrap: wrap;
gap: 1rem;
}

.copyright {
font-size: var(--fs-sm);
color: rgba(255, 255, 255, 0.7);
margin: 0;
}

.footer-bottom-links {
display: flex;
align-items: center;
gap: 0.5rem;
}

.bottom-link {
color: rgba(255, 255, 255, 0.7);
text-decoration: none;
font-size: var(--fs-sm);
transition: color 0.3s ease;
}

.bottom-link:hover {
color: white;
}

.separator {
color: rgba(255, 255, 255, 0.4);
font-size: var(--fs-sm);
}

/* Responsive Design */
@media (max-width: 1024px) {
.footer-content {
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2rem;
}

.footer-brand {
  grid-column: 1 / -1;
  align-items: flex-start;
  text-align: start;
}

.footer-section {
  align-items: flex-start;
  text-align: start;
}

.social-links {
  justify-content: flex-start;
}
}

/* Tablets - Quick Links, Courses, Support on same line; Contact Us on right side */
@media (max-width: 768px) {
.main-footer {
  padding: 2rem 0 0;
}

.footer-content {
  grid-template-columns: 1fr 1fr 1fr 1.5fr;
  gap: 1.5rem;
}

.footer-brand {
  grid-column: 1 / -1;
  align-items: flex-start;
  text-align: start;
}

.footer-section {
  align-items: flex-start;
  text-align: start;
}

.footer-section:last-child {
  grid-column: 4 / 5;
}

.contact-item i {
display:none !important;
}

.social-links {
  justify-content: flex-start;
}

.footer-bottom-content {
  flex-direction: column;
  align-items: flex-start;
  text-align: start;
  gap: 1rem;
}

.footer-bottom-links {
  justify-content: flex-start;
}
}

/* Small Tablets - Quick Links & Courses on first line; Support & Contact Us on second line */
@media (max-width: 640px) {
.footer-content {
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.footer-brand {
  grid-column: 1 / -1;
  align-items: flex-start;
  text-align: start;
}

.footer-section {
  align-items: flex-start;
  text-align: start;
}

.footer-section:last-child {
  grid-column: auto;
}

.social-links {
  justify-content: flex-start;
}
}

/* Mobile - Everything centered and stacked */
@media (max-width: 480px) {
.footer-content {
  grid-template-columns: 1fr;
  gap: 2rem;
}

.contact-item i {
display:none !important;
}

.footer-brand {
  align-items: center;
  text-align: center;
}

.brand-logo {
  justify-content: center;
}

.brand-tagline,
.brand-description {
  text-align: center;
}

.footer-section {
  text-align: center;
  align-items: center;
}

.footer-section-title {
  text-align: center;
}

.footer-section-title::after {
  left: 50%;
  transform: translateX(-50%);
}

.footer-links {
  align-items: center;
}

.footer-link {
  text-align: center;
}

.social-links {
  justify-content: center;
}

.contact-info {
  align-items: center;
}

.contact-item {
  justify-content: center;
  text-align: center;
}

.contact-label,
.contact-link,
.contact-text {
  text-align: center;
}

.newsletter {
  text-align: center;
}

.newsletter-title,
.newsletter-text {
  text-align: center;
}

.newsletter-form {
  flex-direction: column;
}

.newsletter-input {
  text-align: center;
}

.footer-bottom-content {
  align-items: center;
  text-align: center;
}

.footer-bottom-links {
  justify-content: center;
  flex-wrap: wrap;
}
}

/* Animation for footer entrance */
.main-footer {
animation: slideUpFadeIn 0.8s ease-out;
}

@keyframes slideUpFadeIn {
from {
  opacity: 0;
  transform: translateY(20px);
}
to {
  opacity: 1;
  transform: translateY(0);
}
}

/* Enhanced focus states for accessibility */
.footer-link:focus-visible,
.bottom-link:focus-visible,
.social-link:focus-visible,
.newsletter-btn:focus-visible {
outline: 2px solid rgba(255, 255, 255, 0.8);
outline-offset: 2px;
border-radius: 4px;
}

.newsletter-input:focus-visible {
outline: 2px solid rgba(255, 255, 255, 0.8);
outline-offset: 0;
}
</style>