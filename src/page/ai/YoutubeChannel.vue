<template>
  <div class="youtube-channel-manager">
    <h2 id="youtubeChannelManagerHead">YouTube Channel</h2>

    <!-- Channel submission form -->
    <el-card class="submit-card">
      <el-input
          v-model="newChannelInput"
          placeholder="Enter YouTube channel link or name"
          class="input-with-submit"
          @keyup.enter.native="submitChannel"
      >
        <el-button slot="append" icon="el-icon-plus" @click="submitChannel" :loading="submitting">
        </el-button>
      </el-input>
    </el-card>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated/>
    </div>

    <!-- Tabs -->
    <div v-else>
      <el-tabs v-model="activeTabName" type="border-card">
        <!-- Channels tab -->
        <el-tab-pane label="My Channels" name="channels">
          <el-empty v-if="channels.length === 0" description="No channels added yet"></el-empty>

          <!-- Channel list -->
          <el-table v-else
              :data="channels"
              stripe
              style="width: 100%"
              @row-click="handleChannelClick">
            <el-table-column prop="channelName" label="Channel Name" min-width="200">
              <template slot-scope="scope">
                <div class="channel-name">{{ scope.row.channelName }}</div>
              </template>
            </el-table-column>
            <!-- Favorite toggle -->
            <el-table-column label="Favorite" width="130">
              <template slot-scope="scope">
                <el-button type="text"
                           :icon="scope.row.favorited ? 'el-icon-star-on' : 'el-icon-star-off'"
                           :class="['fav-btn', scope.row.favorited ? 'favorited' : '']"
                           :aria-pressed="scope.row.favorited ? 'true' : 'false'"
                           :disabled="isChannelPending(scope.row.channelId)"
                           @click.stop="toggleChannelFavorite(scope.row)"></el-button>
              </template>
            </el-table-column>
            <el-table-column width="120">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click.stop="handleChannelClick(scope.row)">View</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- Channel pagination -->
          <div class="pagination-container">
            <el-pagination
                @size-change="handleChannelSizeChange"
                @current-change="handleChannelCurrentChange"
                :current-page="channelQuery.current"
                :page-size="channelQuery.size"
                layout="total, prev, next"
                :total="channelTotal"
            >
            </el-pagination>
          </div>
        </el-tab-pane>

        <!-- Videos Tab for a selected channel -->
        <el-tab-pane v-if="selectedChannel" :label="'Videos: ' + selectedChannel.channelName" name="videos">
          <el-page-header @back="goBackToChannels" :content="selectedChannel.channelName" title="" />

          <!-- Desktop/tablet layout -->
          <el-table v-if="!isSmallScreen"
              :data="videos"
              style="width: 100%; margin-top: 20px"
              @row-click="handleVideoRowClick">
            <!-- Title first -->
            <el-table-column prop="videoTitle" label="Video Title" min-width="280">
              <template slot-scope="scope">
                <div class="video-title">
                  <div class="title-text">{{ scope.row.videoTitle }}</div>
                </div>
              </template>
            </el-table-column>
            <!-- Published -->
            <el-table-column prop="publishedAt" label="Published" width="240">
              <template slot-scope="scope">
                <div class="video-published" v-if="scope.row.publishedAt">
                  <span class="rel">{{ formatRelative(scope.row.publishedAt) }}</span>
                  <span class="abs">{{ formatLocalDateTime(scope.row.publishedAt) }}</span>
                </div>
              </template>
            </el-table-column>
            <!-- Status -->
            <el-table-column prop="status" label="Status" width="120">
              <template slot-scope="scope">
                <el-tag size="small" effect="dark">{{ getStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <!-- Favorite toggle -->
            <el-table-column label="Favorite" width="130">
              <template slot-scope="scope">
                <el-button type="text"
                           :icon="scope.row.favorited ? 'el-icon-star-on' : 'el-icon-star-off'"
                           :class="['fav-btn', scope.row.favorited ? 'favorited' : '']"
                           :aria-pressed="scope.row.favorited ? 'true' : 'false'"
                           :disabled="isVideoPending(scope.row.id)"
                           @click.stop="toggleVideoFavorite(scope.row)"></el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- Mobile layout: stacked rows, click anywhere -->
          <el-table v-else
              :data="videos"
              style="width: 100%; margin-top: 20px">
            <el-table-column label="Video">
              <template slot-scope="scope">
                <div class="video-row-mobile clickable" @click="openVideoUrl(scope.row.videoLink, scope.row.id, scope.row.favorited)">
                  <div class="row-top">
                    <div class="title-text">{{ scope.row.videoTitle }}</div>
                  </div>
                  <div class="row-middle" v-if="scope.row.publishedAt">
                    <span class="rel">{{ formatRelative(scope.row.publishedAt) }}</span>
                    <span class="sep">·</span>
                    <span class="abs">{{ formatLocalDateTime(scope.row.publishedAt) }}</span>
                  </div>
                  <div class="row-bottom">
                    <el-tag size="mini" effect="dark">{{ getStatusText(scope.row.status) }}</el-tag>
                    <el-button type="text"
                               class="ml-8"
                               :icon="scope.row.favorited ? 'el-icon-star-on' : 'el-icon-star-off'"
                               :class="['fav-btn', scope.row.favorited ? 'favorited' : '']"
                               :aria-pressed="scope.row.favorited ? 'true' : 'false'"
                               :disabled="isVideoPending(scope.row.id)"
                               @click.stop="toggleVideoFavorite(scope.row)"></el-button>
                  </div>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- Video pagination -->
          <div class="pagination-container">
            <el-pagination
                @size-change="handleVideoSizeChange"
                @current-change="handleVideoCurrentChange"
                :current-page="videoQuery.current"
                :page-size="videoQuery.size"
                layout="total, prev, next"
                :total="videoTotal"
            >
            </el-pagination>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import {
  getChannelList,
  getChannelVideos,
  submitChannel,
  favoriteChannel,
  unfavoriteChannel,
  favoriteVideo,
  unfavoriteVideo
} from '@/api/ai'

export default {
  name: 'YoutubeChannel',
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
      pendingVideoFavorite: {}, // map videoId -> true
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
    handleVideoRowClick(row) {
      this.openVideoUrl(row.videoLink, row.id, row.favorited)
    },

    goBackToChannels() {
      this.activeTabName = 'channels'
      this.selectedChannel = null
    },

    openVideoUrl(url, id = null, favorited = null) {
      if (url) {
        this.$router.push({
          path: '/index/tools/detail',
          query: { active: 'youtube', videoUrl: encodeURIComponent(url), ytbMode: 'player',
                   ...(id ? { videoId: String(id) } : {}),
                   ...(favorited !== null && favorited !== undefined ? { favorited: String(!!favorited) } : {})
                 }
        });
      } else {
        this.$message.warning('Video URL is not available');
      }
    },

    // Favorite toggles
    isVideoPending(videoId) { return !!this.pendingVideoFavorite[videoId] },
    isChannelPending(channelId) { return !!this.pendingChannelFavorite[channelId] },

    async toggleVideoFavorite(item) {
      const id = item.id
      if (this.pendingVideoFavorite[id]) return
      this.$set(this.pendingVideoFavorite, id, true)
      const prevFavorited = !!item.favorited
      const prevCount = item.favoriteCount || 0
      // optimistic
      item.favorited = !prevFavorited
      item.favoriteCount = Math.max(0, prevCount + (item.favorited ? 1 : -1))
      this.syncVideoFavoriteState(id, item.favorited, item.favoriteCount)
      try {
        const api = item.favorited ? favoriteVideo : unfavoriteVideo
        const res = await api(id)
        if (!(res && res.data && res.data.code === 1)) {
          throw new Error(res && res.data && res.data.msg || 'Favorite toggle failed')
        }
      } catch (e) {
        // rollback
        item.favorited = prevFavorited
        item.favoriteCount = prevCount
        this.syncVideoFavoriteState(id, prevFavorited, prevCount)
        this.$message.error(e.message || 'Failed to toggle favorite')
      } finally {
        this.$delete(this.pendingVideoFavorite, id)
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
        if (!(res && res.data && res.data.code === 1)) {
          throw new Error(res && res.data && res.data.msg || 'Favorite toggle failed')
        }
      } catch (e) {
        // rollback
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
