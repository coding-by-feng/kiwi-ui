<template>
  <div class="youtube-channel-manager">
    <h2 id="youtubeChannelManagerHead">YouTube Channel</h2>

    <!-- Channel submission form -->
    <div class="submit-card">
      <KiwiInput
          v-model="newChannelInput"
          placeholder="Enter YouTube channel link or name"
          class="input-with-submit"
          @keyup.enter="submitChannel"
      >
        <template #append>
          <KiwiButton icon="el-icon-plus" @click="submitChannel" :loading="submitting">
          </KiwiButton>
        </template>
      </KiwiInput>
    </div>

    <!-- Loading state -->
    <!-- Loading state -->
    <StatusOverlay
      v-if="loading"
      :visible="true"
      status="loading"
      title="Loading channels..."
      :backdrop="false"
      style="position: relative; min-height: 200px;"
    />

    <!-- Tabs -->
    <div v-else>
      <KiwiTabs v-model="activeTabName" type="border-card">
        <!-- Channels tab -->
        <KiwiTabPane label="My Channels" name="channels">
          <div v-if="channels.length === 0" class="empty-state">No channels added yet</div>

          <!-- Channel list -->
          <div v-else class="channel-list">
            <div v-for="channel in channels" :key="channel.channelId" class="channel-item" @click="handleChannelClick(channel)">
              <div class="channel-content">
                <div class="channel-name">{{ channel.channelName }}</div>
              </div>
              <div class="channel-actions">
                <KiwiButton type="text"
                           :icon="channel.favorited ? 'el-icon-star-on' : 'el-icon-star-off'"
                           :class="['fav-btn', channel.favorited ? 'favorited' : '']"
                           :aria-pressed="channel.favorited ? 'true' : 'false'"
                           :disabled="!!pendingChannelFavorite[channel.channelId]"
                           @click.stop="toggleChannelFavorite(channel)"></KiwiButton>
                <KiwiButton type="text" size="small" class="ml-8" @click.stop="handleChannelClick(channel)">View</KiwiButton>
              </div>
            </div>
          </div>

          <!-- Channel pagination -->
          <div class="pagination-container">
            <KiwiPagination
                @size-change="handleChannelSizeChange"
                @current-change="handleChannelCurrentChange"
                :current-page.sync="channelQuery.current"
                :page-size="channelQuery.size"
                :total="channelTotal"
            >
            </KiwiPagination>
          </div>
        </KiwiTabPane>

        <!-- Videos Tab for a selected channel -->
        <KiwiTabPane v-if="selectedChannel" :label="'Videos: ' + selectedChannel.channelName" name="videos">
          <div class="page-header">
             <KiwiButton type="text" icon="el-icon-back" @click="goBackToChannels">Back</KiwiButton>
             <span class="header-title">{{ selectedChannel.channelName }}</span>
          </div>

          <!-- Video list -->
          <div class="video-list">
            <div v-for="video in videos" :key="video.id" class="video-item" @click="openVideoUrl(video.videoLink, video.id, video.favorited)">
              <div class="video-content">
                <div class="video-title">{{ video.videoTitle }}</div>
                <div class="video-meta" v-if="video.publishedAt">
                  <span class="rel">{{ formatRelative(video.publishedAt) }}</span>
                  <span class="sep">·</span>
                  <span class="abs">{{ formatLocalDateTime(video.publishedAt) }}</span>
                </div>
              </div>
              <div class="video-actions">
                <KiwiTag size="mini" effect="dark">{{ getStatusText(video.status) }}</KiwiTag>
                <KiwiButton type="text"
                           class="ml-8"
                           :icon="video.favorited ? 'el-icon-star-on' : 'el-icon-star-off'"
                           :class="['fav-btn', video.favorited ? 'favorited' : '']"
                           :aria-pressed="video.favorited ? 'true' : 'false'"
                           :disabled="!!pendingVideoFavorite[video.id || video.videoLink]"
                           @click.stop="toggleVideoFavorite(video)"></KiwiButton>
              </div>
            </div>
          </div>

          <!-- Video pagination -->
          <div class="pagination-container">
            <KiwiPagination
                @size-change="handleVideoSizeChange"
                @current-change="handleVideoCurrentChange"
                :current-page.sync="videoQuery.current"
                :page-size="videoQuery.size"
                :total="videoTotal"
            >
            </KiwiPagination>
          </div>
        </KiwiTabPane>
      </KiwiTabs>
    </div>
  </div>
</template>

<script>
import StatusOverlay from '@/components/common/StatusOverlay.vue'
import {
  getChannelList,
  getChannelVideos,
  submitChannel,
  favoriteChannel,
  unfavoriteChannel,
  favoriteVideo,
  unfavoriteVideo,
  favoriteVideoByUrl,
  unfavoriteVideoByUrl
} from '@/api/ai'
import kiwiConsts from '@/const/kiwiConsts'

import KiwiInput from '@/components/ui/KiwiInput'
import KiwiButton from '@/components/ui/KiwiButton'
import KiwiTabs from '@/components/ui/KiwiTabs'
import KiwiTabPane from '@/components/ui/KiwiTabPane'
import KiwiTag from '@/components/ui/KiwiTag'
import KiwiPagination from '@/components/ui/KiwiPagination'

export default {
  name: 'YoutubeChannelManager',
  components: { StatusOverlay, KiwiInput, KiwiButton, KiwiTabs, KiwiTabPane, KiwiTag, KiwiPagination },
  data() {
    return {
      activeTabName: 'channels',

      // Channel data
      newChannelInput: '',
      submitting: false,
      loading: false,
      channels: [],
      channelQuery: { current: 1, size: 10 },
      channelTotal: 0,

      // Video data
      selectedChannel: null,
      videos: [],
      videoQuery: { current: 1, size: 10 },
      videoTotal: 0,

      // Pending toggle tracking
      pendingVideoFavorite: {}, // map key(id or url) -> true
      pendingChannelFavorite: {}, // map channelId -> true

      // Responsive
      isSmallScreen: false,
    }
  },
  created() {
    this.fetchChannels()
  },
  mounted() {
    this.onResize()
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
  },
  watch: {
    '$route.query.channelId'(id) {
      if (id) {
        const found = this.channels.find(c => String(c.channelId) === String(id))
        if (found) {
          this.handleChannelClick(found)
        } else {
          this.selectedChannel = { channelId: id, id: id, channelName: 'Channel' }
          this.activeTabName = 'videos'
          this.videoQuery.current = 1
          this.fetchVideos()
        }
      }
    }
  },
  methods: {
    // Channel methods
    async fetchChannels() {
      this.loading = true
      try {
        const response = await getChannelList(this.channelQuery.current, this.channelQuery.size)
        if (response.data.code === 1) {
          this.channels = response.data.data.records || []
          this.channelTotal = response.data.data.total || 0
        } else {
          this.$message.error(response.data.msg || 'Failed to fetch channels')
        }
      } catch (error) {
        console.error('Error fetching channels:', error)
        this.$message.error('Error loading channels')
      } finally {
        this.loading = false
      }
    },

    async submitChannel() {
      if (!this.newChannelInput.trim()) {
        this.$message.warning('Please enter a channel link or name')
        return
      }
      this.submitting = true
      try {
        const response = await submitChannel(this.newChannelInput)
        if (response.data.code === 1) {
          this.$message.success('Channel added successfully')
          this.newChannelInput = ''
          this.fetchChannels()
        } else {
          this.$message.error(response.data.msg || 'Failed to add channel')
        }
      } catch (error) {
        console.error('Error submitting channel:', error)
        this.$message.error('Error adding channel')
      } finally {
        this.submitting = false
      }
    },

    handleChannelSizeChange(size) {
      this.channelQuery.size = size
      this.fetchChannels()
    },
    handleChannelCurrentChange(current) {
      this.channelQuery.current = current
      this.fetchChannels()
    },

    // Video methods (by channel)
    async handleChannelClick(row) {
      this.selectedChannel = row
      this.activeTabName = 'videos'
      this.videoQuery.current = 1
      this.selectedChannel.id = row.channelId
      await this.fetchVideos()
    },

    async fetchVideos() {
      if (!this.selectedChannel) return
      this.loading = true
      try {
        const response = await getChannelVideos(this.selectedChannel.id, this.videoQuery.current, this.videoQuery.size)
        if (response.data.code === 1) {
          const records = response.data.data.records || []
          this.videos = records.slice().sort((a, b) => {
            const da = this.parseLocalDateTime(a && a.publishedAt)
            const db = this.parseLocalDateTime(b && b.publishedAt)
            const aTime = da ? da.getTime() : null
            const bTime = db ? db.getTime() : null
            if (aTime === null && bTime === null) return 0
            if (aTime === null) return 1
            if (bTime === null) return -1
            return bTime - aTime
          })
          this.videoTotal = response.data.data.total || 0
        } else {
          this.$message.error('Failed to fetch videos')
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
        this.$message.error('Error loading videos')
      } finally {
        this.loading = false
      }
    },

    handleVideoSizeChange(size) {
      this.videoQuery.size = size
      this.fetchVideos()
    },
    handleVideoCurrentChange(current) {
      this.videoQuery.current = current
      this.fetchVideos()
    },

    goBackToChannels() {
      this.activeTabName = 'channels'
      this.selectedChannel = null
    },

    openVideoUrl(url, id = null, favorited = null) {
      if (url) {
        this.$router.push({
          path: kiwiConsts.ROUTES.DETAIL,
          query: { active: 'youtube', videoUrl: encodeURIComponent(url), ytbMode: 'player',
                   ...(id ? { dbId: String(id) } : {}),
                   ...(favorited !== null && favorited !== undefined ? { favorited: String(!!favorited) } : {})
                 }
        });
      } else {
        this.$message.warning('Video URL is not available');
      }
    },

    // Favorite toggles
    isVideoPending(key) { return !!this.pendingVideoFavorite[key] },
    isChannelPending(channelId) { return !!this.pendingChannelFavorite[channelId] },

    async toggleVideoFavorite(item) {
      const id = item && item.id
      const url = item && item.videoLink
      const key = id || url
      if (!key) {
        return this.$message.error('No valid video identifier')
      }
      if (this.pendingVideoFavorite[key]) return
      this.$set(this.pendingVideoFavorite, key, true)

      const prevFavorited = !!item.favorited
      const prevCount = item.favoriteCount || 0
      // optimistic
      item.favorited = !prevFavorited
      item.favoriteCount = Math.max(0, prevCount + (item.favorited ? 1 : -1))
      this.syncVideoFavoriteState(id, item.favorited, item.favoriteCount)

      try {
        let res = null
        let ok = false

        if (id) {
          const api = item.favorited ? favoriteVideo : unfavoriteVideo
          res = await api(id)
          ok = !!(res && res.data && res.data.code === 1)
          // If ID path failed and we have URL, fallback to URL endpoint
          if (!ok && url) {
            const apiUrl = item.favorited ? favoriteVideoByUrl : unfavoriteVideoByUrl
            res = await apiUrl(url)
            ok = !!(res && res.data && res.data.code === 1)
          }
        } else if (url) {
          const apiUrl = item.favorited ? favoriteVideoByUrl : unfavoriteVideoByUrl
          res = await apiUrl(url)
          ok = !!(res && res.data && res.data.code === 1)
        }

        if (!ok) {
          // rollback on failure
          item.favorited = prevFavorited
          item.favoriteCount = prevCount
          this.syncVideoFavoriteState(id, prevFavorited, prevCount)
          this.$message.error((res && res.data && (res.data.msg || res.data.message)) || 'Favorite toggle failed')
        }
      } catch (e) {
        // rollback on error
        item.favorited = prevFavorited
        item.favoriteCount = prevCount
        this.syncVideoFavoriteState(id, prevFavorited, prevCount)
        this.$message.error(e.message || 'Failed to toggle favorite')
      } finally {
        this.$delete(this.pendingVideoFavorite, key)
      }
    },

    async toggleChannelFavorite(item) {
      const id = item.channelId
      if (this.pendingChannelFavorite[id]) return
      this.$set(this.pendingChannelFavorite, id, true)
      const prevFavorited = !!item.favorited
      const prevCount = item.favoriteCount || 0
      // optimistic
      item.favorited = !prevFavorited
      item.favoriteCount = Math.max(0, prevCount + (item.favorited ? 1 : -1))
      this.syncChannelFavoriteState(id, item.favorited, item.favoriteCount)
      try {
        const api = item.favorited ? favoriteChannel : unfavoriteChannel
        const res = await api(id)
        const ok = res && res.data && res.data.code === 1
        if (!ok) {
          // rollback on failure
          item.favorited = prevFavorited
          item.favoriteCount = prevCount
          this.syncChannelFavoriteState(id, prevFavorited, prevCount)
          this.$message.error((res && res.data && res.data.msg) || 'Favorite toggle failed')
        }
      } catch (e) {
        // rollback on error
        item.favorited = prevFavorited
        item.favoriteCount = prevCount
        this.syncChannelFavoriteState(id, prevFavorited, prevCount)
        this.$message.error(e.message || 'Failed to toggle favorite')
      } finally {
        this.$delete(this.pendingChannelFavorite, id)
      }
    },

    syncVideoFavoriteState(videoId, favorited, count) {
      const apply = (arr) => {
        if (!arr) return
        arr.forEach(v => { if (v && v.id === videoId) { v.favorited = favorited; v.favoriteCount = count } })
      }
      apply(this.videos)
    },
    syncChannelFavoriteState(channelId, favorited, count) {
      const apply = (arr) => {
        if (!arr) return
        arr.forEach(c => { if (c && c.channelId === channelId) { c.favorited = favorited; c.favoriteCount = count } })
      }
      apply(this.channels)
    },

    // Responsive helper
    onResize() { this.isSmallScreen = window.innerWidth <= 600 },

    // Utility methods
    parseLocalDateTime(value) {
      if (!value) return null
      if (Array.isArray(value)) {
        const [y, mo, d, h = 0, mi = 0, s = 0] = value
        if (!y || !mo || !d) return null
        return new Date(y, mo - 1, d, h, mi, s, 0)
      }
      if (typeof value !== 'string') return null
      const m = value.match(/^\s*(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\s*$/)
      if (m) {
        const [ , y, mo, d, h, mi, s, ms ] = m
        const year = parseInt(y, 10)
        const month = parseInt(mo, 10) - 1
        const day = parseInt(d, 10)
        const hour = parseInt(h, 10)
        const minute = parseInt(mi, 10)
        const sec = parseInt(s, 10)
        const millis = ms ? parseInt(ms.padEnd(3, '0'), 10) : 0
        return new Date(year, month, day, hour, minute, sec, millis)
      }
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d
    },
    formatLocalDateTime(value) {
      const d = this.parseLocalDateTime(value)
      if (!d) return ''
      return d.toLocaleString()
    },
    formatRelative(value) {
      const d = this.parseLocalDateTime(value)
      if (!d) return ''
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const tense = diffMs >= 0 ? 'past' : 'future'
      const absMs = Math.abs(diffMs)
      const sec = Math.floor(absMs / 1000)
      const min = Math.floor(sec / 60)
      const hr = Math.floor(min / 60)
      const day = Math.floor(hr / 24)
      const month = Math.floor(day / 30)
      const year = Math.floor(day / 365)
      const fmt = (n, u) => `${n} ${u}${n !== 1 ? 's' : ''}`
      let text
      if (year > 0) text = fmt(year, 'year')
      else if (month > 0) text = fmt(month, 'month')
      else if (day > 0) text = fmt(day, 'day')
      else if (hr > 0) text = fmt(hr, 'hour')
      else if (min > 0) text = fmt(min, 'minute')
      else text = fmt(Math.max(sec, 0), 'second')
      return tense === 'past' ? `${text} ago` : `in ${text}`
    },
    // Legacy unused helpers kept for compatibility
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },
    formatDuration(duration) {
      if (!duration) return ''
      if (typeof duration === 'string' && duration.includes(':')) return duration
      const totalSeconds = parseInt(duration)
      if (isNaN(totalSeconds)) return duration
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      return `${minutes}:${String(seconds).padStart(2, '0')}`
    },
    getStatusText(statusCode) {
      if (typeof statusCode !== 'number') return statusCode
      switch (parseInt(statusCode)) {
        case 0: return 'Ready'
        case 1: return 'Processing'
        case 2: return 'Finished'
      }
    },
  }
}
</script>

<style scoped>
/* Shared stacked row layout for videos (desktop and mobile) */
.video-row-desktop, .video-row-mobile {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
}
.video-row-desktop .row-top, .video-row-mobile .row-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.video-row-desktop .row-middle, .video-row-mobile .row-middle {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}
.video-row-desktop .row-middle .rel, .video-row-mobile .row-middle .rel {
  font-weight: 500;
}
.video-row-desktop .row-middle .sep, .video-row-mobile .row-middle .sep {
  margin: 0 6px;
  color: var(--text-placeholder);
}
/* Ensure clear spacing between status tag and favorite icon */
.video-row-desktop .row-bottom, .video-row-mobile .row-bottom {
  margin-top: 6px;
  display: flex;
  align-items: center;
}
.video-row-desktop .row-bottom .fav-btn, .video-row-mobile .row-bottom .fav-btn {
  margin-left: 12px !important; /* keep a comfortable distance from the status tag */
}

/* Mobile row layout for channels */
.channel-row-mobile .row-bottom {
  display: flex;
  align-items: center;
}
.channel-row-mobile .row-bottom .fav-btn {
  margin-right: 12px; /* spacing before View button */
}

/* Optional: ensure long titles in mobile/desktop don't overflow */
.video-row-mobile .title-text,
.video-row-desktop .title-text,
.channel-row-mobile .title-text {
  white-space: normal;
  word-break: break-word;
  color: var(--text-primary);
}

.clickable { cursor: pointer; }
.ml-8 { margin-left: 8px; }
.fav-btn { color: var(--text-placeholder); }
.fav-btn.favorited { color: var(--color-warning); }

/* New Styles for Native Components */
.channel-list, .video-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.channel-item, .video-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.channel-item:hover, .video-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);
}

.channel-content, .video-content {
  flex: 1;
  min-width: 0;
  margin-right: 16px;
}

.channel-name, .video-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.4;
}

.video-meta {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.video-meta .rel {
  font-weight: 500;
}

.video-meta .sep {
  margin: 0 6px;
  color: var(--text-placeholder);
}

.channel-actions, .video-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color-light);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 14px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px dashed var(--border-color-light);
}

.submit-card {
  margin-bottom: 24px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
