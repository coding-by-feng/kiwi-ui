<template>
  <div class="about-container">
    <el-card class="about-card">
      <div slot="header" class="card-header">
        <h3 class="card-title">
          <i class="el-icon-info"></i>
          {{ $t('about.title') }}
        </h3>
      </div>

      <!-- Quick Actions (Guided Tour button removed) -->
      <div class="about-actions">
        <!-- Guided Tour button removed -->
      </div>

      <!-- App Description Section -->
      <div class="about-section">
        <h4 class="section-title">
          <i class="el-icon-reading"></i>
          {{ $t('about.kasonTools') }}
        </h4>
        <div class="description-card">
          <p class="description-text">{{ $t('about.description') }}</p>
          <div class="version-info">
            <el-tag type="success" class="version-tag">{{ $t('about.version') }}</el-tag>
          </div>
        </div>
      </div>

      <el-divider class="custom-divider"></el-divider>

      <!-- Download Clients Section -->
      <div class="download-section">
        <h4 class="section-title">
          <i class="el-icon-download"></i>
          {{ $t('about.downloads') }}
        </h4>
        <div class="download-grid">
          <!-- macOS -->
          <div class="download-item mac-item">
            <div class="download-header">
              <i class="el-icon-monitor"></i>
              <span class="download-title">{{ $t('about.mac') }}</span>
            </div>
            <div class="download-content">
              <a :href="downloadLinks.mac" target="_blank" rel="noopener" class="download-link">
                <div class="download-button mac">
                  <i class="el-icon-download"></i>
                  <span class="download-text">{{ $t('about.downloadForMac') }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- Windows -->
          <div class="download-item windows-item">
            <div class="download-header">
              <i class="el-icon-monitor"></i>
              <span class="download-title">{{ $t('about.windows') }}</span>
            </div>
            <div class="download-content">
              <a :href="downloadLinks.windows" target="_blank" rel="noopener" class="download-link">
                <div class="download-button windows">
                  <i class="el-icon-download"></i>
                  <span class="download-text">{{ $t('about.downloadForWindows') }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- Linux -->
          <div class="download-item linux-item">
            <div class="download-header">
              <i class="el-icon-monitor"></i>
              <span class="download-title">{{ $t('about.linux') }}</span>
            </div>
            <div class="download-content">
              <a :href="downloadLinks.linux" target="_blank" rel="noopener" class="download-link">
                <div class="download-button linux">
                  <i class="el-icon-download"></i>
                  <span class="download-text">{{ $t('about.downloadForLinux') }}</span>
                </div>
              </a>
            </div>
          </div>
        </div>
        <p class="download-note">{{ $t('about.gdriveNote') }}</p>
      </div>

      <el-divider class="custom-divider"></el-divider>

      <!-- Contact Information Section -->
      <div class="contact-section">
        <h4 class="section-title">
          <i class="el-icon-message"></i>
          {{ $t('about.contact') }}
        </h4>
        <div class="contact-grid">
          <!-- Instagram -->
          <div class="contact-item instagram-item">
            <div class="contact-header">
              <i class="el-icon-camera"></i>
              <span class="contact-title">{{ $t('about.instagram') }}</span>
            </div>
            <div class="contact-content">
              <a href="https://www.instagram.com/coding_by_feng/" target="_blank" class="social-link instagram-link">
                <div class="social-button">
                  <i class="el-icon-camera"></i>
                  <span class="social-text">{{ $t('about.followOnInstagram') }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- Facebook -->
          <div class="contact-item facebook-item">
            <div class="contact-header">
              <i class="el-icon-share"></i>
              <span class="contact-title">{{ $t('about.facebook') }}</span>
            </div>
            <div class="contact-content">
              <a href="https://www.facebook.com/shifeng.zhan" target="_blank" class="social-link facebook-link">
                <div class="social-button">
                  <i class="el-icon-share"></i>
                  <span class="social-text">{{ $t('about.followOnFacebook') }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- LinkedIn -->
          <div class="contact-item linkedin-item">
            <div class="contact-header">
              <i class="el-icon-user"></i>
              <span class="contact-title">{{ $t('about.linkedin') }}</span>
            </div>
            <div class="contact-content">
              <a href="https://www.linkedin.com/in/kason-zhan-b73237274/" target="_blank" class="social-link linkedin-link">
                <div class="social-button">
                  <i class="el-icon-user"></i>
                  <span class="social-text">{{ $t('about.followOnLinkedIn') }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- GitHub -->
          <div class="contact-item github-item">
            <div class="contact-header">
              <i class="el-icon-link"></i>
              <span class="contact-title">{{ $t('about.github') }}</span>
            </div>
            <div class="contact-content">
              <a href="https://github.com/coding-by-feng" target="_blank" class="social-link github-link">
                <div class="social-button">
                  <i class="el-icon-link"></i>
                  <span class="social-text">{{ $t('about.followOnGitHub') }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- Discord -->
          <div class="contact-item discord-item">
            <div class="contact-header">
              <i class="el-icon-chat-dot-round"></i>
              <span class="contact-title">{{ $t('about.discord') }}</span>
            </div>
            <div class="contact-content">
              <a href="https://discord.gg/E8yvMZkA" target="_blank" class="social-link discord-link">
                <div class="social-button">
                  <i class="el-icon-chat-dot-round"></i>
                  <span class="social-text">{{ $t('about.joinDiscord') }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- WeChat QR -->
          <div class="contact-item wechat-item">
            <div class="contact-header">
              <i class="el-icon-chat-line-round"></i>
              <span class="contact-title">{{ $t('about.wechatQR') }}</span>
            </div>
            <div class="contact-content">
              <div class="wechat-qr-container">
                <img src="/wechat.png"
                     :alt="$t('about.wechatQR')"
                     class="wechat-qr-image">
                <p class="wechat-instruction">{{ $t('about.scanToAdd') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Keep a single divider between Contact and Copyright -->
      <el-divider class="custom-divider"></el-divider>

      <!-- Copyright Section -->
      <div class="copyright-section">
        <div class="copyright-content">
          <i class="el-icon-postcard"></i>
          <span class="copyright-text">{{ $t('about.copyright') }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
// Guided Tour imports removed
export default {
  name: 'about',
  data() {
    return {
      // Replace with Google Drive links for each platform
      downloadLinks: {
        mac: 'https://drive.google.com/file/d/1IyRlcxnYsWlMoWZGZMQl7z84uZ0xlpFi/view?usp=sharing', // e.g., https://drive.google.com/file/d/XXXXX/view?usp=sharing
        windows: 'https://drive.google.com/file/d/1rXRJs4BaCILVagnukYQD9_tn1TthjQWe/view?usp=sharing', // e.g., https://drive.google.com/file/d/YYYYY/view?usp=sharing
        linux: 'https://drive.google.com/file/d/1lq3KXYOdpLUdsNm7lBQaaGy3NZKYWCvd/view?usp=sharing', // e.g., https://drive.google.com/file/d/ZZZZZ/view?usp=sharing
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.about-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 24px;
}

.about-card {
  border: 1px solid var(--border-color-light) !important;
  border-radius: 12px !important;
  box-shadow: var(--shadow-card) !important;
  background: var(--bg-body) !important;
  overflow: hidden !important;
}

.card-header {
  background: var(--gradient-primary);
  margin: -20px -20px 20px -20px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.card-title {
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    font-size: 20px;
  }
}

.about-actions {
  display: flex;
  justify-content: flex-end;
  margin: 0 0 12px 0;
}

.about-section,
.contact-section,
.download-section {
  margin-bottom: 24px;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color-light);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  i {
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.description-card {
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  padding: 16px;
}

.description-text {
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.version-info {
  display: flex;
  justify-content: flex-end;
}

.version-tag {
  background: rgba(103, 194, 58, 0.1) !important;
  border: 1px solid rgba(103, 194, 58, 0.3) !important;
  color: var(--color-success) !important;
  font-weight: 500 !important;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

/* Download grid */
.download-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.contact-item,
.download-item {
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--color-primary-light-5);
    box-shadow: var(--shadow-hover);
    transform: translateY(-2px);
  }
}

.contact-header,
.download-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.contact-title,
.download-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.contact-header i,
.download-header i {
  color: var(--color-primary);
  font-size: 16px;
}

.contact-content,
.download-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.social-link {
  text-decoration: none;
  display: block;
}

/* Download link/button */
.download-link {
  text-decoration: none;
  display: block;
}

.social-button {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-hover);
  }

  i {
    font-size: 16px;
  }
}

/* Reuse base button style for downloads */
.download-button {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-hover);
  }

  i {
    font-size: 16px;
  }
}

/* Platform-specific colors */
.download-button.mac {
  background: linear-gradient(135deg, #000000 0%, #4a4a4a 100%);

  &:hover {
    background: linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%);
  }
}

.download-button.windows {
  background: linear-gradient(135deg, #00A4EF 0%, #2B88D8 100%);

  &:hover {
    background: linear-gradient(135deg, #0091d1 0%, #2374b8 100%);
  }
}

.download-button.linux {
  background: linear-gradient(135deg, #FFB000 0%, #F48C06 100%);

  &:hover {
    background: linear-gradient(135deg, #e09b00 0%, #d97b05 100%);
  }
}

.instagram-link .social-button {
  background: linear-gradient(135deg, #e4405f 0%, #f77737 100%);

  &:hover {
    background: linear-gradient(135deg, #d73447 0%, #f56040 100%);
  }
}

.facebook-link .social-button {
  background: linear-gradient(135deg, #1877f2 0%, #42a5f5 100%);

  &:hover {
    background: linear-gradient(135deg, #166fe5 0%, #1e88e5 100%);
  }
}

.linkedin-link .social-button {
  background: linear-gradient(135deg, #0077b5 0%, #00a0dc 100%);

  &:hover {
    background: linear-gradient(135deg, #005885 0%, #0078a0 100%);
  }
}

.github-link .social-button {
  background: linear-gradient(135deg, #24292e 0%, #2f363d 100%);

  &:hover {
    background: linear-gradient(135deg, #1f2328 0%, #24292e 100%);
  }
}

/* Discord styling */
.discord-link .social-button {
  background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);

  &:hover {
    background: linear-gradient(135deg, #4752C4 0%, #5865F2 100%);
  }
}


.wechat-qr-container {
  text-align: center;
}

.wechat-qr-image {
  max-width: 200px;
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 2px solid var(--border-color-light);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-hover);
  }
}

.wechat-instruction {
  margin: 8px 0 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  font-style: italic;
}

/* Keep provider styles removed section harmless if used elsewhere */
.service-provider {
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  padding: 16px;
}

.provider-info {
  text-align: center;
}

.provider-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.provider-header i {
  color: var(--color-primary);
  font-size: 18px;
}

.provider-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.provider-description {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 8px 0 16px 0;
  line-height: 1.5;
}

.provider-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(64, 158, 255, 0.2);
    border-color: rgba(64, 158, 255, 0.5);
    transform: translateY(-1px);
  }
}

.link-text {
  color: var(--color-primary);
  font-weight: 500;
  font-size: 14px;
}

.provider-badge {
  transition: all 0.3s ease;
}

/* Download note */
.download-note {
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: right;
  font-style: italic;
}

.copyright-section {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);
  margin: 20px -20px -20px -20px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.copyright-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  font-size: 14px;
}

.copyright-content i {
  font-size: 16px;
}

.custom-divider {
  border-top: 1px solid var(--border-color-light) !important;
  margin: 24px 0 !important;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.about-container {
  animation: fadeInUp 0.6s ease;
}

.about-section {
  animation: fadeInUp 0.6s ease 0.1s both;
}

.download-section {
  animation: fadeInUp 0.6s ease 0.15s both;
}

.contact-section {
  animation: fadeInUp 0.6s ease 0.2s both;
}

/* Removed acknowledgments-section animations */

.copyright-section {
  animation: fadeInUp 0.6s ease 0.4s both;
}

/* Responsive Design */
@media (max-width: 768px) {
  .about-container {
    padding: 2px;
    margin: 2px;
  }

  .card-header {
    margin: -16px -16px 16px -16px;
    padding: 16px;
  }

  .card-title {
    font-size: 16px;
  }

  .about-section,
  .contact-section,
  .download-section {
    padding: 16px;
    margin-bottom: 16px;
  }

  .contact-grid,
  .download-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .wechat-qr-image {
    max-width: 150px;
  }

  .qq-button {
    padding: 10px 14px;
    font-size: 13px;
  }

  .copyright-section {
    margin: 16px -16px -16px -16px;
    padding: 12px 16px;
  }

  .copyright-content {
    font-size: 13px;
  }

  .provider-link {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }

  .link-text {
    font-size: 13px;
  }
}

/* Hover effects for images and icons */
.wechat-qr-image,
.provider-badge {
  &:hover {
    transform: scale(1.05);
  }
}

/* Loading animation for external images */
img {
  transition: opacity 0.3s ease;

  &:not([src]) {
    opacity: 0;
  }
}

/* Custom scrollbar */
.about-container::-webkit-scrollbar {
  width: 6px;
}

.about-container::-webkit-scrollbar-track {
  background: var(--bg-body);
  border-radius: 3px;
}

.about-container::-webkit-scrollbar-thumb {
  background: var(--gradient-primary);
  border-radius: 3px;
}

.about-container::-webkit-scrollbar-thumb:hover {
  background: var(--gradient-primary);
}
</style>