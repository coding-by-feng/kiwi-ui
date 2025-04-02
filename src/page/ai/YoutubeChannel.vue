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
        <el-button slot="prepend" icon="el-icon-video-camera-solid" @click="backToPlayer"></el-button>
      </el-input>
    </el-card>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated/>
    </div>

    <!-- Channels display section -->
    <div v-else>
      <el-tabs v-model="activeTabName" type="border-card">
        <el-tab-pane label="My Channels" name="channels">
          <!-- Empty state -->
          <el-empty v-if="channels.length === 0" description="No channels added yet"></el-empty>

          <!-- Channel list -->
          <el-table
              v-else
              :data="channels"
              stripe
              style="width: 100%"
              @row-click="handleChannelClick"
          >
            <el-table-column prop="channelName" label="Channel Name" width="150">
              <template slot-scope="scope">
                <div class="channel-name">
                  {{ scope.row.channelName }}
                </div>
              </template>
            </el-table-column>
            <el-table-column width="180">
              <template slot-scope="scope">
                <el-button
                    type="text"
                    size="small"
                    @click.stop="handleChannelClick(scope.row)"
                >
                  View
                </el-button>
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

        <!-- Videos Tab -->
        <el-tab-pane v-if="selectedChannel" :label="'Videos: ' + selectedChannel.channelName" name="videos">
          <el-page-header
              @back="goBackToChannels"
              :content="selectedChannel.channelName"
              title=""
          />

          <!-- Video list -->
          <el-table
              :data="videos"
              style="width: 100%; margin-top: 20px">
            <el-table-column width="40">
              <template slot-scope="scope">
                <el-button
                    type="text"
                    size="small"
                    @click="openVideoUrl(scope.row.videoLink)"
                    icon="el-icon-video-play"></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="videoTitle" label="Video Title" min-width="200">
              <template slot-scope="scope">
                <div class="video-title">
                  <div>{{ scope.row.videoTitle }}</div>
                </div>
              </template>
            </el-table-column>
            <!-- Status column -->
            <el-table-column prop="status" label="Status" width="100">
              <template slot-scope="scope">
                <el-tag
                    size="small"
                    effect="dark"
                >
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
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
import request from '@/router/axios' // Using your existing axios setup
import {getChannelList, getChannelVideos, submitChannel} from '@/api/ai'

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
      channelQuery: {
        current: 1,
        size: 10
      },
      channelTotal: 0,

      // Video data
      selectedChannel: null,
      videos: [],
      videoQuery: {
        current: 1,
        size: 10
      },
      videoTotal: 0
    }
  },
  created() {
    this.fetchChannels()
  },
  methods: {
    backToPlayer() {
      // Navigate back to the channel list view
      this.$router.push({
        path: '/index/vocabulary/detail',
        query: {
          active: 'youtube',
          ytbMode: 'player',
          now: new Date().getTime()
        }
      });
    },
    // Channel methods
    async fetchChannels() {
      this.loading = true
      try {
        const response = await getChannelList(this.channelQuery.current, this.channelQuery.size)

        if (response.data.code === 1) {
          this.channels = response.data.data.records || []
          this.channelTotal = response.data.data.total || 0
        } else {
          this.$message.error('Failed to fetch channels')
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
          this.fetchChannels() // Refresh the list
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

    // Video methods
    async handleChannelClick(row) {
      console.log('row', row)
      this.selectedChannel = row
      this.activeTabName = 'videos'
      this.videoQuery.current = 1 // Reset to first page
      this.selectedChannel.id = row.channelId
      await this.fetchVideos()
    },

    async fetchVideos() {
      if (!this.selectedChannel) return

      this.loading = true
      try {
        const response = await getChannelVideos(this.selectedChannel.id, this.videoQuery.current, this.videoQuery.size)

        if (response.data.code === 1) {
          this.videos = response.data.data.records || []
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

    openVideoUrl(url) {
      if (url) {
        // Navigate to YoutubePlayer component with the video URL
        this.$router.push({
          path: '/index/vocabulary/detail',
          query: {
            active: 'youtube',
            videoUrl: encodeURIComponent(url),
            mode: 'player'
          }
        });
      } else {
        this.$message.warning('Video URL is not available');
      }
    },

    // Utility methods
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },

    formatDuration(duration) {
      if (!duration) return ''

      // If it's already formatted as HH:MM:SS, return as is
      if (typeof duration === 'string' && duration.includes(':')) {
        return duration
      }

      // If it's seconds, format it
      const totalSeconds = parseInt(duration)
      if (isNaN(totalSeconds)) return duration

      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      } else {
        return `${minutes}:${String(seconds).padStart(2, '0')}`
      }
    },
    // Add these methods to the methods section of your component
    getStatusText(statusCode) {
      if (typeof statusCode !== 'number') {
        return statusCode;
      }
      // Map status codes to human-readable text based on ProcessStatusEnum
      switch (parseInt(statusCode)) {
        case 0:
          return 'Ready';
        case 1:
          return 'Processing';
        case 2:
          return 'Finished';
      }
    },
  }
}
</script>

<style scoped>
.youtube-channel-manager {
  padding: 20px;
}

.submit-card {
  margin-bottom: 20px;
}

.input-with-submit {
  width: 100%;
}

.loading-container {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.channel-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.video-title {
  display: flex;
  flex-direction: column;
}

.video-info {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.video-info span {
  margin-right: 15px;
}
</style>