<template>
  <div class="about-container">
    <el-card class="about-card">
      <div slot="header" class="card-header">
        <h3 class="card-title">
          <i class="el-icon-info"></i>
          {{ $t('about.title') }}
        </h3>
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
              <a href="https://instagram.com/kiwivocabulary" target="_blank" class="social-link instagram-link">
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
              <a href="https://facebook.com/kiwivocabulary" target="_blank" class="social-link facebook-link">
                <div class="social-button">
                  <i class="el-icon-share"></i>
                  <span class="social-text">{{ $t('about.followOnFacebook') }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- X (Twitter) -->
          <div class="contact-item twitter-item">
            <div class="contact-header">
              <i class="el-icon-message"></i>
              <span class="contact-title">{{ $t('about.twitter') }}</span>
            </div>
            <div class="contact-content">
              <a href="https://x.com/kiwivocabulary" target="_blank" class="social-link twitter-link">
                <div class="social-button">
                  <i class="el-icon-message"></i>
                  <span class="social-text">{{ $t('about.followOnTwitter') }}</span>
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
              <a href="https://linkedin.com/company/kiwivocabulary" target="_blank" class="social-link linkedin-link">
                <div class="social-button">
                  <i class="el-icon-user"></i>
                  <span class="social-text">{{ $t('about.followOnLinkedIn') }}</span>
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
              <a href="https://discord.gg/kiwivocabulary" target="_blank" class="social-link discord-link">
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

      <el-divider class="custom-divider"></el-divider>

      <!-- Acknowledgments Section -->
      <div class="acknowledgments-section">
        <h4 class="section-title">
          <i class="el-icon-star-on"></i>
          {{ $t('about.acknowledgments') }}
        </h4>
        <div class="service-provider">
          <div class="provider-info">
            <div class="provider-header">
              <i class="el-icon-microphone"></i>
              <span class="provider-name">Voice RSS</span>
            </div>
            <p class="provider-description">{{ $t('about.voiceRSSDescription') }}</p>
            <a href="http://www.voicerss.org" target="_blank" class="provider-link">
              <img src="/assets/external/info_dark_brown.gif"
                   width="88px" height="31"
                   style="border: 0"
                   :alt="$t('about.voiceRSSAttribution')"
                   class="provider-badge"/>
              <span class="link-text">{{ $t('about.visitWebsite') }}</span>
            </a>
          </div>
        </div>
      </div>

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
import db from "@/util/db";
import kiwiConst from "@/const/kiwiConsts";

let that

export default {
  name: 'about',
  data() {
    return {}
  },
  beforeCreate: function () {
    that = this
  },
  mounted() {
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
.about-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 24px;
}

.about-card {
  border: 1px solid rgba(64, 158, 255, 0.2) !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  overflow: hidden !important;
}

.card-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
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

.about-section,
.contact-section,
.acknowledgments-section {
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  i {
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.description-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid rgba(64, 158, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.description-text {
  color: #2c3e50;
  line-height: 1.6;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.version-info {
  display: flex;
  justify-content: flex-end;
}

.version-tag {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(133, 206, 97, 0.1) 100%) !important;
  border: 1px solid rgba(103, 194, 58, 0.3) !important;
  color: #67c23a !important;
  font-weight: 500 !important;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.contact-item {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(64, 158, 255, 0.4);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
    transform: translateY(-2px);
  }
}

.contact-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.contact-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.contact-header i {
  color: #409eff;
  font-size: 16px;
}

.contact-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.social-link {
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  i {
    font-size: 16px;
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

.twitter-link .social-button {
  background: linear-gradient(135deg, #000000 0%, #333333 100%);

  &:hover {
    background: linear-gradient(135deg, #1a1a1a 0%, #404040 100%);
  }
}

.linkedin-link .social-button {
  background: linear-gradient(135deg, #0077b5 0%, #00a0dc 100%);

  &:hover {
    background: linear-gradient(135deg, #005885 0%, #0078a0 100%);
  }
}

.discord-link .social-button {
  background: linear-gradient(135deg, #5865f2 0%, #7289da 100%);

  &:hover {
    background: linear-gradient(135deg, #4752c4 0%, #677bc4 100%);
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
  border: 2px solid rgba(64, 158, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(64, 158, 255, 0.4);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  }
}

.wechat-instruction {
  margin: 8px 0 0 0;
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
}

.service-provider {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid rgba(64, 158, 255, 0.1);
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
  color: #409eff;
  font-size: 18px;
}

.provider-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.provider-description {
  color: #6c757d;
  font-size: 14px;
  margin: 8px 0 16px 0;
  line-height: 1.5;
}

.provider-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(103, 194, 58, 0.2) 100%);
    border-color: rgba(64, 158, 255, 0.5);
    transform: translateY(-1px);
  }
}

.link-text {
  color: #409eff;
  font-weight: 500;
  font-size: 14px;
}

.provider-badge {
  transition: all 0.3s ease;
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
  border-top: 1px solid rgba(64, 158, 255, 0.2) !important;
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

.contact-section {
  animation: fadeInUp 0.6s ease 0.2s both;
}

.acknowledgments-section {
  animation: fadeInUp 0.6s ease 0.3s both;
}

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
  .acknowledgments-section {
    padding: 16px;
    margin-bottom: 16px;
  }

  .contact-grid {
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
  background: rgba(64, 158, 255, 0.1);
  border-radius: 3px;
}

.about-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border-radius: 3px;
}

.about-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
}
</style>