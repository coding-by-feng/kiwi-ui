<template>
  <div class="ai-conversation-generator">
    <!-- Header -->
    <div class="generator-header">
      <h2 class="generator-title">
        <i class="el-icon-chat-dot-round"></i>
        AI Conversation Generator
      </h2>
      <p class="generator-subtitle">Generate realistic multi-speaker conversations with TTS audio</p>
    </div>

    <!-- Mode Toggle: Generator / History -->
    <div class="mode-toggle">
      <KiwiButton
        :type="currentMode === 'generator' ? 'primary' : 'default'"
        size="small"
        @click="currentMode = 'generator'">
        <i class="el-icon-edit"></i> Generate
      </KiwiButton>
      <KiwiButton
        :type="currentMode === 'history' ? 'primary' : 'default'"
        size="small"
        @click="currentMode = 'history'; loadConversationList()">
        <i class="el-icon-time"></i> History
      </KiwiButton>
    </div>

    <!-- Generator Mode -->
    <div v-show="currentMode === 'generator'" class="generator-content">
      <!-- Input Form -->
      <div class="form-section" :class="{ 'is-collapsed': isFormCollapsed }">
        <div class="form-section-header" @click="toggleFormCollapse">
          <span class="form-section-title">
            <i class="el-icon-edit"></i>
            Conversation Topic
          </span>
          <i :class="isFormCollapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'" class="collapse-icon"></i>
        </div>
        <div class="form-section-body" v-show="!isFormCollapsed">
        <div class="form-group">
          <KiwiInput
            v-model="form.prompt"
            type="textarea"
            :rows="3"
            placeholder="Describe the conversation topic... e.g., Two friends discussing their favorite travel destinations"
            :disabled="isGenerating || isGeneratingTopic"
            clearable
          />
          <div class="topic-generator-row">
            <div class="category-selector">
              <KiwiDropdown @command="handleCategoryChange" :disabled="isGenerating || isGeneratingTopic">
                <KiwiButton size="small" :disabled="isGenerating || isGeneratingTopic">
                  <i class="el-icon-folder"></i>
                  {{ getCategoryLabel(form.topicCategory) }}
                  <i class="el-icon-arrow-down"></i>
                </KiwiButton>
                <template slot="dropdown">
                  <KiwiDropdownItem
                    v-for="category in topicCategoryOptions"
                    :key="category.value"
                    :command="category.value">
                    {{ category.label }}
                  </KiwiDropdownItem>
                </template>
              </KiwiDropdown>
            </div>
            <KiwiButton
              size="small"
              type="success"
              :loading="isGeneratingTopic"
              :disabled="isGenerating || isGeneratingTopic"
              @click="generateRandomTopicHandler">
              <i v-if="!isGeneratingTopic" class="el-icon-magic-stick"></i>
              {{ isGeneratingTopic ? 'Generating...' : 'Random Topic' }}
            </KiwiButton>
          </div>
        </div>

        <div class="options-row">
          <div class="option-group">
            <label class="form-label">Accent</label>
            <KiwiDropdown @command="handleAccentChange" :disabled="isGenerating">
              <KiwiButton size="small" :disabled="isGenerating">
                {{ getAccentLabel(form.accent) }}
                <i class="el-icon-arrow-down"></i>
              </KiwiButton>
              <template slot="dropdown">
                <KiwiDropdownItem
                  v-for="accent in accentOptions"
                  :key="accent.value"
                  :command="accent.value">
                  {{ accent.label }}
                </KiwiDropdownItem>
              </template>
            </KiwiDropdown>
          </div>

          <div class="option-group">
            <label class="form-label">Duration</label>
            <KiwiDropdown @command="handleDurationChange" :disabled="isGenerating">
              <KiwiButton size="small" :disabled="isGenerating">
                {{ getDurationLabel(form.duration) }}
                <i class="el-icon-arrow-down"></i>
              </KiwiButton>
              <template slot="dropdown">
                <KiwiDropdownItem
                  v-for="duration in durationOptions"
                  :key="duration.value"
                  :command="duration.value">
                  {{ duration.label }}
                </KiwiDropdownItem>
              </template>
            </KiwiDropdown>
          </div>

          <div class="option-group">
            <label class="form-label">Speakers</label>
            <KiwiDropdown @command="handleSpeakerCountChange" :disabled="isGenerating">
              <KiwiButton size="small" :disabled="isGenerating">
                {{ form.speakerCount }} speakers
                <i class="el-icon-arrow-down"></i>
              </KiwiButton>
              <template slot="dropdown">
                <KiwiDropdownItem :command="2">2 speakers</KiwiDropdownItem>
                <KiwiDropdownItem :command="3">3 speakers</KiwiDropdownItem>
                <KiwiDropdownItem :command="4">4 speakers</KiwiDropdownItem>
              </template>
            </KiwiDropdown>
          </div>
        </div>

        <div class="action-row">
          <KiwiButton
            type="primary"
            icon="el-icon-video-play"
            :loading="isGenerating"
            :disabled="!form.prompt.trim() || isGenerating"
            @click="generateConversation">
            {{ isGenerating ? 'Generating...' : 'Generate Conversation' }}
          </KiwiButton>

          <KiwiButton
            v-if="isGenerating"
            type="danger"
            icon="el-icon-close"
            @click="cancelGeneration">
            Cancel
          </KiwiButton>
        </div>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isGenerating" class="progress-section">
        <div class="loading-indicator">
          <i class="el-icon-loading"></i>
          <span>{{ progressText || 'This may take a moment...' }}</span>
        </div>
      </div>

      <!-- Current Conversation Display -->
      <div v-if="currentConversation.topic" class="conversation-display">
        <div class="conversation-header">
          <h3 class="conversation-topic">{{ currentConversation.topic }}</h3>
          <div class="speakers-list">
            <span
              v-for="speaker in currentConversation.speakers"
              :key="speaker.id"
              class="speaker-badge"
              :style="{ borderColor: getSpeakerColor(speaker.speakerIndex) }">
              <span class="speaker-initial" :style="{ backgroundColor: getSpeakerColor(speaker.speakerIndex) }">{{ getSpeakerInitial(speaker.name) }}</span>
              {{ speaker.name }}
            </span>
          </div>
        </div>

        <!-- Playback Controls -->
        <div class="playback-controls" v-if="messages.length > 0">
          <KiwiButton
            :type="isPlayingAll ? 'danger' : 'primary'"
            size="small"
            :icon="isPlayingAll ? 'el-icon-video-pause' : 'el-icon-video-play'"
            @click="togglePlayAll">
            {{ isPlayingAll ? 'Stop' : (canResume ? 'Resume' : 'Play All') }}
          </KiwiButton>
          <KiwiDropdown @command="handleLoopModeChange">
            <KiwiButton size="small" :type="loopMode !== 'off' ? 'warning' : 'default'">
              <i class="el-icon-refresh"></i>
              {{ getLoopModeLabel(loopMode) }}
              <i class="el-icon-arrow-down"></i>
            </KiwiButton>
            <template slot="dropdown">
              <KiwiDropdownItem command="off">
                <i class="el-icon-close"></i> Loop Off
              </KiwiDropdownItem>
              <KiwiDropdownItem command="current">
                <i class="el-icon-refresh-right"></i> Loop Current
              </KiwiDropdownItem>
              <KiwiDropdownItem command="all">
                <i class="el-icon-refresh"></i> Loop All History
              </KiwiDropdownItem>
              <KiwiDropdownItem command="favorites">
                <i class="el-icon-star-on"></i> Loop Favorites
              </KiwiDropdownItem>
            </template>
          </KiwiDropdown>
          <KiwiButton
            size="small"
            :type="currentConversation.favorited ? 'warning' : 'default'"
            @click="toggleCurrentFavorite">
            <i :class="currentConversation.favorited ? 'el-icon-star-on' : 'el-icon-star-off'"></i>
            {{ currentConversation.favorited ? 'Favorited' : 'Favorite' }}
          </KiwiButton>
          <span class="total-duration" v-if="totalDuration > 0">
            Total: {{ formatDuration(totalDuration) }}
          </span>
        </div>

        <!-- Chat Messages -->
        <div class="chat-container" ref="chatContainer">
          <div
            v-for="(msg, index) in messages"
            :key="msg.id"
            class="chat-message"
            :class="{ 'is-playing': currentPlayingId === msg.id }"
            :style="{ borderLeftColor: getSpeakerColor(getSpeakerIndex(msg.speakerId)) }">
            <div class="message-header">
              <span class="speaker-name">
                <span class="speaker-initial-small" :style="{ backgroundColor: getSpeakerColor(getSpeakerIndex(msg.speakerId)) }">{{ getSpeakerInitial(msg.speakerName) }}</span>
                {{ msg.speakerName }}
              </span>
            </div>
            <p
              class="message-text selectable-text"
              @mouseup="handleMessageSelection"
              @touchend.passive="handleMessageSelection">
              {{ msg.text }}
            </p>
            <div class="message-footer">
              <KiwiButton
                size="mini"
                :type="currentPlayingId === msg.id ? 'success' : 'default'"
                :icon="currentPlayingId === msg.id ? 'el-icon-video-pause' : 'el-icon-video-play'"
                @click="playAudio(msg)">
                {{ currentPlayingId === msg.id ? 'Playing' : 'Play' }}
              </KiwiButton>
              <span class="duration">{{ formatDuration(msg.audioDurationMs) }}</span>
              <span class="sequence">#{{ msg.sequence }}</span>
            </div>
          </div>

          <!-- Loading placeholders -->
          <div v-if="isGenerating && pendingCount > 0" class="loading-placeholders">
            <div
              v-for="n in pendingCount"
              :key="'placeholder-' + n"
              class="chat-message placeholder">
              <div class="placeholder-line short"></div>
              <div class="placeholder-line"></div>
              <div class="placeholder-line medium"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isGenerating" class="empty-state">
        <i class="el-icon-chat-dot-round"></i>
        <h3>Create Your First Conversation</h3>
        <p>Enter a topic above and click "Generate" to create a realistic multi-speaker conversation with audio.</p>
      </div>
    </div>

    <!-- History Mode -->
    <div v-show="currentMode === 'history'" class="history-content">
      <!-- History Filter -->
      <div class="history-filter">
        <KiwiButton
          :type="historyFilter === 'all' ? 'primary' : 'default'"
          size="small"
          @click="setHistoryFilter('all')">
          <i class="el-icon-files"></i> All
        </KiwiButton>
        <KiwiButton
          :type="historyFilter === 'favorites' ? 'primary' : 'default'"
          size="small"
          @click="setHistoryFilter('favorites')">
          <i class="el-icon-star-on"></i> Favorites
        </KiwiButton>
        <KiwiButton
          v-if="filteredConversationList.length > 0"
          size="small"
          type="success"
          @click="startLoopPlayHistory">
          <i class="el-icon-video-play"></i> Play {{ historyFilter === 'favorites' ? 'Favorites' : 'All' }}
        </KiwiButton>
      </div>

      <div v-if="loadingHistory" class="loading-state">
        <i class="el-icon-loading"></i>
        <p>Loading conversations...</p>
      </div>

      <div v-else-if="filteredConversationList.length === 0" class="empty-state">
        <i class="el-icon-folder-opened"></i>
        <h3>{{ historyFilter === 'favorites' ? 'No Favorites Yet' : 'No Conversations Yet' }}</h3>
        <p>{{ historyFilter === 'favorites' ? 'Mark conversations as favorites to see them here.' : 'Generate your first conversation to see it here.' }}</p>
      </div>

      <div v-else class="history-list">
        <div
          v-for="conv in filteredConversationList"
          :key="conv.id"
          class="history-item"
          :class="{ 'is-favorited': conv.favorited }"
          @click="loadConversation(conv.id)">
          <div class="history-item-header">
            <h4 class="history-topic">
              <i v-if="conv.favorited" class="el-icon-star-on favorite-star"></i>
              {{ conv.topic }}
            </h4>
            <KiwiTag :type="getStatusTagType(conv.status)" size="small">
              {{ conv.status }}
            </KiwiTag>
          </div>
          <div class="history-item-meta">
            <span><i class="el-icon-time"></i> {{ formatDate(conv.createTime) }}</span>
            <span><i class="el-icon-headset"></i> {{ getAccentLabel(conv.accent) }}</span>
            <span><i class="el-icon-timer"></i> ~{{ conv.durationMinutes }} min</span>
          </div>
          <div class="history-item-actions">
            <KiwiButton
              size="mini"
              :type="conv.favorited ? 'warning' : 'default'"
              :icon="conv.favorited ? 'el-icon-star-on' : 'el-icon-star-off'"
              circle
              @click.stop="toggleHistoryFavorite(conv)">
            </KiwiButton>
            <KiwiButton
              size="mini"
              type="danger"
              icon="el-icon-delete"
              circle
              @click.stop="confirmDeleteConversation(conv.id)">
            </KiwiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Audio Element -->
    <audio
      ref="audioPlayer"
      @ended="onAudioEnded"
      @error="onAudioError"
    />

    <!-- AI Selection Popup for text selection -->
    <AiSelectionPopup
      :visible.sync="selectionPopupVisible"
      :selected-text="selectionPopupText"
      :title="$t('ai.aiSearch') || 'AI Search'"
      :auto-request="true"
      @open-ai-tab="handleOpenAiTab"
    />
  </div>
</template>

<script>
import { getStore } from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiInput from '@/components/ui/KiwiInput.vue'
import KiwiDropdown from '@/components/ui/KiwiDropdown.vue'
import KiwiDropdownItem from '@/components/ui/KiwiDropdownItem.vue'
import KiwiTag from '@/components/ui/KiwiTag.vue'
import AiSelectionPopup from '@/page/ai/AiSelectionPopup.vue'
import {
  getConversationList,
  getConversationById,
  deleteConversation,
  getConversationConfig,
  generateRandomTopic,
  toggleConversationFavorite
} from '@/api/conversation'
import { isGeminiEnabled, getGeminiApiKey } from '@/util/geminiClient'

export default {
  name: 'AiConversationGenerator',
  components: {
    KiwiButton,
    KiwiInput,
    KiwiDropdown,
    KiwiDropdownItem,
    KiwiTag,
    AiSelectionPopup
  },
  data() {
    return {
      currentMode: 'generator',
      form: {
        prompt: '',
        accent: 'UK',
        duration: 'FIVE_MINUTES',
        speakerCount: 2,
        topicCategory: 'lifestyle'
      },
      accentOptions: [
        { value: 'US', label: 'American English' },
        { value: 'UK', label: 'British English' },
        { value: 'AU', label: 'Australian English' },
        { value: 'IN', label: 'Indian English' }
      ],
      durationOptions: [
        { value: 'TWO_MINUTES', label: '~2 minutes' },
        { value: 'FIVE_MINUTES', label: '~5 minutes' },
        { value: 'TEN_MINUTES', label: '~10 minutes' }
      ],
      topicCategoryOptions: [
        { value: 'lifestyle', label: 'Daily Life' },
        { value: 'travel', label: 'Travel' },
        { value: 'food', label: 'Food & Cooking' },
        { value: 'work', label: 'Work & Career' },
        { value: 'hobbies', label: 'Hobbies' },
        { value: 'health', label: 'Health & Fitness' },
        { value: 'shopping', label: 'Shopping' },
        { value: 'entertainment', label: 'Entertainment' }
      ],
      isGeneratingTopic: false,
      isGenerating: false,
      progress: 0,
      progressText: '',
      currentConversation: {
        id: null,
        topic: '',
        speakers: [],
        favorited: false
      },
      messages: [],
      totalMessageCount: 0,
      currentPlayingId: null,
      isPlayingAll: false,
      playAllQueue: [],
      conversationList: [],
      loadingHistory: false,
      abortController: null,
      speakerColors: ['#4A90D9', '#E74C3C', '#27AE60', '#9B59B6'],
      // Selection popup state
      selectionPopupVisible: false,
      selectionPopupText: '',
      // Form collapse state
      isFormCollapsed: false,
      // Loop mode state
      loopMode: 'off', // 'off', 'current', 'all', 'favorites'
      loopPlaylist: [],
      loopPlaylistIndex: 0,
      // History filter
      historyFilter: 'all', // 'all', 'favorites'
      // Pause/Resume state
      pauseState: {
        isPaused: false,
        remainingQueue: [],
        conversationId: null,
        loopPlaylistIndex: null,
        loopMode: null
      }
    }
  },
  computed: {
    pendingCount() {
      return Math.max(0, this.totalMessageCount - this.messages.length)
    },
    totalDuration() {
      return this.messages.reduce((sum, msg) => sum + (msg.audioDurationMs || 0), 0)
    },
    filteredConversationList() {
      if (this.historyFilter === 'favorites') {
        return this.conversationList.filter(conv => conv.favorited)
      }
      return this.conversationList
    },
    canResume() {
      return this.pauseState.isPaused &&
             this.pauseState.conversationId === this.currentConversation.id &&
             this.pauseState.remainingQueue.length > 0
    }
  },
  mounted() {
    this.loadConfig()
  },
  beforeDestroy() {
    this.cancelGeneration()
    this.stopAudio()
  },
  methods: {
    async loadConfig() {
      try {
        const response = await getConversationConfig()
        if (response.data.code === 0) {
          console.log('Conversation config loaded:', response.data.data)
        }
      } catch (error) {
        console.error('Failed to load config:', error)
      }
    },

    handleAccentChange(accent) {
      this.form.accent = accent
    },

    handleDurationChange(duration) {
      this.form.duration = duration
    },

    handleSpeakerCountChange(count) {
      this.form.speakerCount = count
    },

    handleCategoryChange(category) {
      this.form.topicCategory = category
    },

    toggleFormCollapse() {
      this.isFormCollapsed = !this.isFormCollapsed
    },

    // Loop mode methods
    handleLoopModeChange(mode) {
      this.loopMode = mode
      if (mode !== 'off' && this.isPlayingAll) {
        // Restart playback with new loop mode
        this.stopAudio()
        this.$nextTick(() => {
          this.startLoopPlay()
        })
      }
    },

    getLoopModeLabel(mode) {
      const labels = {
        'off': 'Loop Off',
        'current': 'Loop Current',
        'all': 'Loop All',
        'favorites': 'Loop Favorites'
      }
      return labels[mode] || 'Loop Off'
    },

    async startLoopPlay() {
      if (this.loopMode === 'current') {
        // Loop current conversation - togglePlayAll handles resume
        this.togglePlayAll()
      } else if (this.loopMode === 'all' || this.loopMode === 'favorites') {
        // Check if we can resume from pause state
        if (this.pauseState.isPaused &&
            this.pauseState.loopMode === this.loopMode &&
            this.pauseState.conversationId) {
          // Resume from paused position in loop playlist
          await this.loadLoopPlaylist()
          this.loopPlaylistIndex = this.pauseState.loopPlaylistIndex || 0

          // If same conversation, use togglePlayAll to resume at message level
          if (this.pauseState.conversationId === this.currentConversation.id) {
            this.togglePlayAll()
          } else {
            // Load the paused conversation and resume
            await this.loadAndPlayConversationWithResume(this.pauseState.conversationId)
          }
        } else {
          // Start fresh - load playlist from history
          this.clearPauseState()
          await this.loadLoopPlaylist()
          if (this.loopPlaylist.length > 0) {
            this.loopPlaylistIndex = 0
            await this.loadAndPlayConversation(this.loopPlaylist[0].id)
          }
        }
      }
    },

    async loadAndPlayConversationWithResume(id) {
      try {
        const response = await getConversationById(id)
        if (response.data.code === 0) {
          const data = response.data.data
          this.currentConversation = {
            id: data.id,
            topic: data.topic,
            speakers: data.speakers,
            favorited: data.favorited || false
          }
          this.messages = data.messages || []
          this.totalMessageCount = this.messages.length
          this.form.prompt = data.topic || ''
          this.currentMode = 'generator'

          // Resume from pause state if available
          this.$nextTick(() => {
            if (this.pauseState.isPaused &&
                this.pauseState.conversationId === id &&
                this.pauseState.remainingQueue.length > 0) {
              this.isPlayingAll = true
              this.playAllQueue = [...this.pauseState.remainingQueue]
              this.clearPauseState()
              this.playNextInQueue()
            } else {
              this.clearPauseState()
              this.isPlayingAll = true
              this.playAllQueue = [...this.messages]
              this.playNextInQueue()
            }
          })
        }
      } catch (error) {
        console.error('Failed to load conversation for resume:', error)
      }
    },

    async loadLoopPlaylist() {
      try {
        const response = await getConversationList({ favoritedOnly: this.loopMode === 'favorites' })
        if (response.data.code === 0) {
          this.loopPlaylist = (response.data.data || []).filter(c => c.status === 'COMPLETED')
        }
      } catch (error) {
        console.error('Failed to load loop playlist:', error)
        this.loopPlaylist = []
      }
    },

    async loadAndPlayConversation(id) {
      try {
        const response = await getConversationById(id)
        if (response.data.code === 0) {
          const data = response.data.data
          this.currentConversation = {
            id: data.id,
            topic: data.topic,
            speakers: data.speakers,
            favorited: data.favorited || false
          }
          this.messages = data.messages || []
          this.totalMessageCount = this.messages.length
          this.form.prompt = data.topic || ''
          this.currentMode = 'generator'

          // Clear pause state since we're starting a new conversation in loop
          this.clearPauseState()

          // Start playing
          this.$nextTick(() => {
            this.isPlayingAll = true
            this.playAllQueue = [...this.messages]
            this.playNextInQueue()
          })
        }
      } catch (error) {
        console.error('Failed to load conversation for loop:', error)
      }
    },

    async startLoopPlayHistory() {
      // Start loop play from history view
      this.loopMode = this.historyFilter === 'favorites' ? 'favorites' : 'all'
      await this.loadLoopPlaylist()
      if (this.loopPlaylist.length > 0) {
        this.loopPlaylistIndex = 0
        await this.loadAndPlayConversation(this.loopPlaylist[0].id)
      } else {
        this.$message.warning('No conversations available to play')
      }
    },

    // History filter methods
    setHistoryFilter(filter) {
      this.historyFilter = filter
    },

    // Favorite toggle methods
    async toggleCurrentFavorite() {
      if (!this.currentConversation.id) return

      try {
        const response = await toggleConversationFavorite(this.currentConversation.id)
        if (response.data.code === 0) {
          this.currentConversation.favorited = response.data.data.favorited
          this.$message.success(this.currentConversation.favorited ? 'Added to favorites' : 'Removed from favorites')

          // Update in conversation list if exists
          const conv = this.conversationList.find(c => c.id === this.currentConversation.id)
          if (conv) {
            conv.favorited = this.currentConversation.favorited
          }
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error)
        this.$message.error('Failed to update favorite status')
      }
    },

    async toggleHistoryFavorite(conv) {
      try {
        const response = await toggleConversationFavorite(conv.id)
        if (response.data.code === 0) {
          conv.favorited = response.data.data.favorited
          this.$message.success(conv.favorited ? 'Added to favorites' : 'Removed from favorites')

          // Update current conversation if it's the same
          if (this.currentConversation.id === conv.id) {
            this.currentConversation.favorited = conv.favorited
          }
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error)
        this.$message.error('Failed to update favorite status')
      }
    },

    getCategoryLabel(value) {
      const option = this.topicCategoryOptions.find(o => o.value === value)
      return option ? option.label : value
    },

    getNativeLanguageName(langCode) {
      const langMap = {
        'zh-CN': 'Chinese',
        'zh-TW': 'Traditional Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'th': 'Thai',
        'vi': 'Vietnamese',
        'id': 'Indonesian',
        'ms': 'Malay',
        'en': 'English'
      }
      return langMap[langCode] || 'Chinese'
    },

    async generateRandomTopicHandler() {
      if (this.isGeneratingTopic || this.isGenerating) return

      this.isGeneratingTopic = true

      try {
        // Check if using Gemini FE direct mode
        if (isGeminiEnabled()) {
          await this.generateTopicWithGemini()
        } else {
          await this.generateTopicWithBackend()
        }
      } catch (error) {
        console.error('Failed to generate random topic:', error)
        this.$message.error('Failed to generate topic: ' + (error.message || 'Unknown error'))
      } finally {
        this.isGeneratingTopic = false
      }
    },

    async generateTopicWithGemini() {
      const apiKey = getGeminiApiKey()
      if (!apiKey) {
        this.$message.warning('Please configure your Gemini API key in Settings first')
        return
      }

      const categoryLabel = this.getCategoryLabel(this.form.topicCategory)
      const nativeLang = getStore({ name: kiwiConsts.CONFIG_KEY.NATIVE_LANG }) || 'zh-CN'
      const nativeLangName = this.getNativeLanguageName(nativeLang)

      const prompt = `Generate a detailed conversation topic for English language practice.

Category: ${categoryLabel}
Number of speakers: ${this.form.speakerCount}
Level: intermediate

Write a detailed topic description in ${nativeLangName} language that includes:
- Who the speakers are (their relationship/roles)
- The setting/location
- What they are discussing
- A specific situation or context

No JSON, no quotes, no extra formatting. Just the topic description in 2-3 sentences.

Example (in Chinese): 两个大学室友在宿舍里讨论即将到来的期末考试。他们互相分享复习策略，讨论哪些科目最难，以及如何平衡学习和休息时间。`

      const config = kiwiConsts.GEMINI_CONFIG
      const url = `${config.ENDPOINT}/${config.MODEL}:generateContent?key=${apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: 1024
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `API Error: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message
          }
        } catch (e) {
          // Use default error message
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        let text = data.candidates[0].content.parts[0].text || ''
        // Clean up the response - remove any JSON artifacts, quotes, or markdown
        text = text
          .replace(/^```.*\n?/gm, '')  // Remove markdown code blocks
          .replace(/```$/gm, '')
          .replace(/^\{.*"topic":\s*"/i, '')  // Remove JSON prefix if present
          .replace(/"\s*\}$/i, '')  // Remove JSON suffix if present
          .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
          .trim()

        if (text) {
          this.form.prompt = text
          this.$message.success('Topic generated!')
          return
        }
      }

      throw new Error('Unexpected response format from Gemini')
    },

    async generateTopicWithBackend() {
      const nativeLang = getStore({ name: kiwiConsts.CONFIG_KEY.NATIVE_LANG }) || 'zh-CN'
      const response = await generateRandomTopic({
        category: this.form.topicCategory,
        difficulty: 'intermediate',
        language: 'en',
        nativeLanguage: nativeLang
      })

      if (response.data.code === 0 && response.data.data) {
        const topicData = response.data.data
        this.form.prompt = topicData.topic

        // Optionally apply suggested settings
        if (topicData.suggestedSpeakerCount) {
          this.form.speakerCount = topicData.suggestedSpeakerCount
        }
        if (topicData.suggestedDuration) {
          this.form.duration = topicData.suggestedDuration
        }

        this.$message.success('Topic generated!')
      } else {
        throw new Error(response.data.msg || 'Failed to generate topic')
      }
    },

    getAccentLabel(value) {
      const option = this.accentOptions.find(o => o.value === value)
      return option ? option.label : value
    },

    getDurationLabel(value) {
      const option = this.durationOptions.find(o => o.value === value)
      return option ? option.label : value
    },

    getSpeakerColor(index) {
      return this.speakerColors[index % this.speakerColors.length]
    },

    getSpeakerIndex(speakerId) {
      const speaker = this.currentConversation.speakers.find(s => s.id === speakerId)
      return speaker ? speaker.speakerIndex : 0
    },

    getSpeakerInitial(name) {
      if (!name) return '?'
      return name.charAt(0).toUpperCase()
    },

    // Handle text selection in chat messages
    handleMessageSelection(event) {
      try {
        const sel = window.getSelection && window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const text = (sel.toString() || '').trim()
        if (!text || text.length < 2) return

        // Open the selection popup with the selected text
        this.selectionPopupText = text
        this.selectionPopupVisible = true
      } catch (_) { /* ignore */ }
    },

    // Handle open in AI tab event from selection popup
    handleOpenAiTab({ text, query }) {
      if (query) {
        const routeData = this.$router.resolve({ path: kiwiConsts.ROUTES.AI_RESPONSE_DETAIL, query })
        window.open(routeData.href, '_blank')
      }
    },

    formatDuration(ms) {
      if (!ms) return '0s'
      const seconds = Math.round(ms / 1000)
      if (seconds < 60) return `${seconds}s`
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },

    getStatusTagType(status) {
      switch (status) {
        case 'COMPLETED': return 'success'
        case 'GENERATING_SCRIPT':
        case 'GENERATING_AUDIO': return 'warning'
        case 'FAILED': return 'danger'
        default: return 'info'
      }
    },

    async generateConversation() {
      if (!this.form.prompt.trim() || this.isGenerating) return

      this.isGenerating = true
      this.progress = 0
      this.progressText = 'Initializing...'
      this.messages = []
      this.currentConversation = { id: null, topic: '', speakers: [], favorited: false }
      this.totalMessageCount = 0
      this.clearPauseState()

      const token = getStore({ name: 'access_token' })
      if (!token) {
        this.$message.error('Please login to generate conversations')
        this.isGenerating = false
        return
      }

      this.abortController = new AbortController()

      try {
        const response = await fetch(`${kiwiConsts.API_BASE.AI_BIZ}/conversation/generate/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify({
            prompt: this.form.prompt,
            accent: this.form.accent,
            duration: this.form.duration,
            speakerCount: this.form.speakerCount
          }),
          signal: this.abortController.signal
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const jsonStr = line.substring(5).trim()
              if (jsonStr) {
                try {
                  const event = JSON.parse(jsonStr)
                  this.handleSSEEvent(event)
                } catch (e) {
                  console.error('Failed to parse SSE data:', e)
                }
              }
            }
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Generation cancelled')
          this.progressText = 'Cancelled'
        } else {
          console.error('Generation failed:', error)
          this.$message.error('Failed to generate conversation: ' + error.message)
        }
      } finally {
        this.isGenerating = false
        this.abortController = null
      }
    },

    handleSSEEvent(event) {
      switch (event.eventType) {
        case 'metadata':
          this.currentConversation = {
            id: event.data.conversationId,
            topic: event.data.topic,
            speakers: event.data.speakers
          }
          this.totalMessageCount = event.data.totalMessageCount
          this.progressText = `Generating conversation: ${event.data.topic}`
          break

        case 'message':
          this.messages.push(event.data)
          this.$nextTick(() => {
            this.scrollToBottom()
          })
          break

        case 'progress':
          this.progress = event.data.percentage
          this.progressText = `Generated ${event.data.completed} of ${event.data.total} messages`
          break

        case 'complete':
          this.progress = 100
          this.progressText = 'Conversation generated successfully!'
          this.$message.success('Conversation generated!')
          break

        case 'error':
          console.error('SSE error:', event.data)
          this.$message.warning(event.data.message)
          break
      }
    },

    cancelGeneration() {
      if (this.abortController) {
        this.abortController.abort()
      }
    },

    scrollToBottom() {
      const container = this.$refs.chatContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },

    playAudio(msg) {
      if (this.currentPlayingId === msg.id) {
        this.stopAudio()
        return
      }

      const audioPlayer = this.$refs.audioPlayer
      if (!audioPlayer) return

      const audioUrl = `${kiwiConsts.API_BASE.AI_BIZ}/conversation/${this.currentConversation.id}/audio/${msg.id}`
      const token = getStore({ name: 'access_token' })

      // For authenticated audio streaming, we need to fetch with auth header
      this.fetchAndPlayAudio(audioUrl, token, msg.id)
    },

    async fetchAndPlayAudio(url, token, messageId) {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch audio')
        }

        const blob = await response.blob()
        const audioPlayer = this.$refs.audioPlayer
        audioPlayer.src = URL.createObjectURL(blob)
        audioPlayer.play()
        this.currentPlayingId = messageId
      } catch (error) {
        console.error('Failed to play audio:', error)
        this.$message.error('Failed to play audio')
        this.currentPlayingId = null
      }
    },

    stopAudio(savePauseState = true) {
      const audioPlayer = this.$refs.audioPlayer
      if (audioPlayer) {
        audioPlayer.pause()
        audioPlayer.currentTime = 0
      }

      // Save pause state for resume functionality
      if (savePauseState && this.isPlayingAll && (this.playAllQueue.length > 0 || this.currentPlayingId)) {
        // Include current playing message in the remaining queue
        const currentMsg = this.messages.find(m => m.id === this.currentPlayingId)
        const remainingQueue = currentMsg ? [currentMsg, ...this.playAllQueue] : [...this.playAllQueue]

        this.pauseState = {
          isPaused: true,
          remainingQueue: remainingQueue,
          conversationId: this.currentConversation.id,
          loopPlaylistIndex: this.loopPlaylistIndex,
          loopMode: this.loopMode
        }
      }

      this.currentPlayingId = null
      this.isPlayingAll = false
      this.playAllQueue = []
    },

    togglePlayAll() {
      if (this.isPlayingAll) {
        this.stopAudio()
      } else {
        // Check if we can resume from pause state
        if (this.pauseState.isPaused &&
            this.pauseState.conversationId === this.currentConversation.id &&
            this.pauseState.remainingQueue.length > 0) {
          // Resume from paused position
          this.isPlayingAll = true
          this.playAllQueue = [...this.pauseState.remainingQueue]
          // Restore loop mode if it was set
          if (this.pauseState.loopMode && this.pauseState.loopMode !== 'off') {
            this.loopMode = this.pauseState.loopMode
            this.loopPlaylistIndex = this.pauseState.loopPlaylistIndex
          }
          this.clearPauseState()
          this.playNextInQueue()
        } else {
          // Start fresh from beginning
          this.clearPauseState()
          this.isPlayingAll = true
          this.playAllQueue = [...this.messages]
          this.playNextInQueue()
        }
      }
    },

    clearPauseState() {
      this.pauseState = {
        isPaused: false,
        remainingQueue: [],
        conversationId: null,
        loopPlaylistIndex: null,
        loopMode: null
      }
    },

    playNextInQueue() {
      if (this.playAllQueue.length === 0) {
        this.isPlayingAll = false
        this.currentPlayingId = null
        return
      }

      const nextMsg = this.playAllQueue.shift()
      this.playAudio(nextMsg)
    },

    onAudioEnded() {
      this.currentPlayingId = null
      if (this.isPlayingAll) {
        if (this.playAllQueue.length > 0) {
          this.playNextInQueue()
        } else {
          // Current conversation finished, check loop mode
          this.handleConversationEnded()
        }
      }
    },

    async handleConversationEnded() {
      if (this.loopMode === 'current') {
        // Restart current conversation
        this.playAllQueue = [...this.messages]
        this.playNextInQueue()
      } else if (this.loopMode === 'all' || this.loopMode === 'favorites') {
        // Move to next conversation in playlist
        this.loopPlaylistIndex++
        if (this.loopPlaylistIndex >= this.loopPlaylist.length) {
          // Loop back to start
          this.loopPlaylistIndex = 0
        }

        if (this.loopPlaylist.length > 0) {
          await this.loadAndPlayConversation(this.loopPlaylist[this.loopPlaylistIndex].id)
        } else {
          this.isPlayingAll = false
        }
      } else {
        // Loop off - stop playback
        this.isPlayingAll = false
      }
    },

    onAudioError() {
      this.currentPlayingId = null
      if (this.isPlayingAll) {
        this.playNextInQueue()
      }
    },

    async loadConversationList() {
      this.loadingHistory = true
      try {
        const response = await getConversationList()
        if (response.data.code === 0) {
          this.conversationList = response.data.data || []
        }
      } catch (error) {
        console.error('Failed to load conversation list:', error)
        this.$message.error('Failed to load conversation history')
      } finally {
        this.loadingHistory = false
      }
    },

    async loadConversation(id) {
      try {
        const response = await getConversationById(id)
        if (response.data.code === 0) {
          const data = response.data.data
          // Clear pause state if loading a different conversation
          if (this.pauseState.conversationId !== data.id) {
            this.clearPauseState()
          }
          this.currentConversation = {
            id: data.id,
            topic: data.topic,
            speakers: data.speakers,
            favorited: data.favorited || false
          }
          this.messages = data.messages || []
          this.totalMessageCount = this.messages.length
          // Populate the form prompt with the topic from history
          this.form.prompt = data.topic || ''
          this.currentMode = 'generator'
        }
      } catch (error) {
        console.error('Failed to load conversation:', error)
        this.$message.error('Failed to load conversation')
      }
    },

    confirmDeleteConversation(id) {
      this.$confirm('Are you sure you want to delete this conversation?', 'Delete Conversation', {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.deleteConversation(id)
      }).catch(() => {})
    },

    async deleteConversation(id) {
      try {
        const response = await deleteConversation(id)
        if (response.data.code === 0) {
          this.$message.success('Conversation deleted')
          this.loadConversationList()
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error)
        this.$message.error('Failed to delete conversation')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.ai-conversation-generator {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  background: var(--bg-body);
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-card);
  min-height: 600px;
}

/* Header */
.generator-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.generator-title {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;

  i {
    margin-right: 8px;
    color: var(--color-primary);
  }
}

.generator-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

/* Mode Toggle */
.mode-toggle {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
}

/* Form Section */
.form-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 16px;
  padding: 0;
  margin-bottom: 24px;
  overflow: hidden;

  &.is-collapsed {
    .form-section-header {
      border-bottom: none;
    }
  }
}

.form-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background: var(--bg-highlight);
  border-bottom: 1px solid var(--border-color-light);
  transition: background 0.2s ease;

  &:hover {
    background: var(--bg-container);
  }
}

.form-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);

  i {
    margin-right: 8px;
    color: var(--color-primary);
  }
}

.collapse-icon {
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.form-section-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.topic-generator-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.category-selector {
  flex-shrink: 0;
}

.options-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.option-group {
  flex: 1;
  min-width: 140px;
}

.action-row {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* Progress Section */
.progress-section {
  margin-bottom: 24px;
  text-align: center;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 14px;

  i {
    font-size: 20px;
    color: var(--color-primary);
    animation: spin 1s linear infinite;
  }
}

.progress-text {
  margin: 10px 0 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

/* Conversation Display */
.conversation-display {
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 16px;
  overflow: hidden;
}

.conversation-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color-light);
  background: var(--bg-highlight);
}

.conversation-topic {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

.speakers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.speaker-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-container);
  border-radius: 20px;
  border-left: 3px solid;
  font-size: 13px;
  color: var(--text-primary);
}

.speaker-initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

/* Playback Controls */
.playback-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.total-duration {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Chat Container */
.chat-container {
  max-height: 500px;
  overflow-y: auto;
  padding: 20px;
}

.chat-message {
  padding: 16px;
  margin-bottom: 16px;
  background: var(--bg-container);
  border-radius: 12px;
  border-left: 4px solid;
  transition: all 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &.is-playing {
    background: var(--bg-highlight);
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  &.placeholder {
    border-left-color: var(--border-color-light);
    animation: pulse 1.5s infinite;
  }
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.speaker-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.speaker-initial-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.message-text {
  margin: 0 0 12px 0;
  line-height: 1.6;
  color: var(--text-regular);
}

/* Selectable text for AI selection popup */
.selectable-text {
  user-select: text;
  -webkit-user-select: text;
  -webkit-touch-callout: default;
  cursor: text;
}

.message-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.duration {
  font-size: 12px;
  color: var(--text-secondary);
}

.sequence {
  font-size: 11px;
  color: var(--text-placeholder);
}

/* Placeholder Animation */
.placeholder-line {
  height: 14px;
  background: linear-gradient(90deg, var(--border-color-light) 25%, var(--bg-highlight) 50%, var(--border-color-light) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;

  &.short {
    width: 30%;
  }

  &.medium {
    width: 60%;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);

  i {
    font-size: 64px;
    color: var(--color-primary);
    margin-bottom: 20px;
    opacity: 0.35;
  }

  h3 {
    color: var(--text-primary);
    margin: 20px 0 10px 0;
  }

  p {
    margin-bottom: 0;
    line-height: 1.6;
    color: var(--text-regular);
  }
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);

  i {
    font-size: 32px;
    margin-bottom: 16px;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* History Filter */
.history-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* History List */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-card);
  }

  &.is-favorited {
    border-left: 3px solid var(--color-warning, #E6A23C);
  }
}

.favorite-star {
  color: var(--color-warning, #E6A23C);
  margin-right: 6px;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.history-topic {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.history-item-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);

  i {
    margin-right: 4px;
  }
}

.history-item-actions {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;

  .history-item:hover & {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 992px) {
  .ai-conversation-generator {
    max-width: 100%;
    margin: 0 12px;
  }
}

@media (max-width: 768px) {
  .ai-conversation-generator {
    padding: 16px;
    margin: 0 8px;
    min-height: auto;
  }

  .generator-header {
    margin-bottom: 16px;
    padding-bottom: 14px;
  }

  .generator-title {
    font-size: 20px;
  }

  .generator-subtitle {
    font-size: 13px;
  }

  .mode-toggle {
    margin-bottom: 16px;
    gap: 8px;
  }

  .form-section {
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .form-section-header {
    padding: 14px 16px;
  }

  .form-section-body {
    padding: 16px;
  }

  .topic-generator-row {
    flex-wrap: wrap;
    gap: 10px;
  }

  .options-row {
    flex-direction: column;
    gap: 12px;
  }

  .option-group {
    min-width: 100%;
  }

  .action-row {
    flex-direction: column;
    gap: 10px;
  }

  .action-row .kiwi-button {
    width: 100%;
  }

  .conversation-header {
    padding: 14px;
  }

  .conversation-topic {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .speakers-list {
    flex-direction: column;
    gap: 8px;
  }

  .speaker-badge {
    padding: 5px 10px;
    font-size: 12px;
  }

  .playback-controls {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .chat-container {
    max-height: 400px;
    padding: 12px;
  }

  .chat-message {
    padding: 12px;
    border-radius: 10px;
  }

  .message-header {
    margin-bottom: 8px;
  }

  .speaker-name {
    font-size: 13px;
  }

  .message-text {
    font-size: 14px;
    margin-bottom: 10px;
  }

  .message-footer {
    flex-wrap: wrap;
    gap: 8px;
  }

  .history-list {
    gap: 10px;
  }

  .history-item {
    padding: 14px;
    border-radius: 10px;
  }

  .history-item-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .history-topic {
    font-size: 15px;
  }

  .history-item-meta {
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
  }

  .history-item-actions {
    position: static;
    opacity: 1;
    margin-top: 10px;
    justify-content: flex-start;
  }

  .history-filter {
    flex-direction: column;
    gap: 8px;
  }

  .playback-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .empty-state {
    padding: 40px 16px;
  }

  .empty-state i {
    font-size: 48px;
  }

  .empty-state h3 {
    font-size: 18px;
    margin: 16px 0 8px 0;
  }

  .empty-state p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .ai-conversation-generator {
    padding: 12px;
    margin: 0 4px;
    border-radius: 12px;
  }

  .generator-header {
    margin-bottom: 12px;
    padding-bottom: 12px;
  }

  .generator-title {
    font-size: 18px;
  }

  .generator-subtitle {
    font-size: 12px;
  }

  .mode-toggle {
    flex-direction: column;
    gap: 6px;
  }

  .mode-toggle .kiwi-button {
    width: 100%;
  }

  .form-section-header {
    padding: 12px;
  }

  .form-section-body {
    padding: 12px;
  }

  .form-label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .conversation-header {
    padding: 12px;
  }

  .conversation-topic {
    font-size: 15px;
  }

  .chat-container {
    max-height: 350px;
    padding: 10px;
  }

  .chat-message {
    padding: 10px;
    margin-bottom: 10px;
    border-left-width: 3px;
  }

  .speaker-name {
    font-size: 12px;
  }

  .message-text {
    font-size: 13px;
    line-height: 1.5;
  }

  .history-item {
    padding: 12px;
  }

  .history-topic {
    font-size: 14px;
  }

  .progress-text {
    font-size: 13px;
  }
}
</style>
