<template>
  <div class="youtube-favorites">
    <el-tabs v-model="favoritesActive" type="card" class="inner-tabs">
      <!-- Favorite Videos -->
      <el-tab-pane label="Videos" name="favVideos">
        <div v-if="loading" class="loading-container"><el-skeleton :rows="3" animated/></div>
        <template v-else>
          <el-empty v-if="favoriteVideos.length === 0" description="No favorite videos" />
          <!-- Desktop/tablet -->
          <el-table v-if="!isSmallScreen && favoriteVideos.length > 0"
                    :data="favoriteVideos"
                    style="width: 100%; margin-top: 10px"
                    @row-click="row => openVideoUrl(row.videoLink)">
            <el-table-column prop="videoTitle" label="Video Title" min-width="280">
              <template slot-scope="scope">
                <div class="video-title"><div class="title-text">{{ scope.row.videoTitle }}</div></div>
              </template>
            </el-table-column>
            <el-table-column prop="publishedAt" label="Published" width="240">
              <template slot-scope="scope">
                <div class="video-published" v-if="scope.row.publishedAt">
                  <span class="rel">{{ formatRelative(scope.row.publishedAt) }}</span>
                  <span class="abs">{{ formatLocalDateTime(scope.row.publishedAt) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="Status" width="120">
              <template slot-scope="scope">
                <el-tag size="small" effect="dark">{{ getStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Favorite" width="100">
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

          <!-- Mobile stacked -->
          <el-table v-else-if="favoriteVideos.length > 0"
                    :data="favoriteVideos"
                    style="width: 100%; margin-top: 10px">
            <el-table-column label="Video">
              <template slot-scope="scope">
                <div class="video-row-mobile clickable" @click="openVideoUrl(scope.row.videoLink)">
                  <div class="row-top"><div class="title-text">{{ scope.row.videoTitle }}</div></div>
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

          <div class="pagination-container" v-if="favoriteVideoTotal > 0">
            <el-pagination
                @size-change="handleFavoriteVideoSizeChange"
                @current-change="handleFavoriteVideoCurrentChange"
                :current-page="favoriteVideoQuery.current"
                :page-size="favoriteVideoQuery.size"
                layout="total, prev, next"
                :total="favoriteVideoTotal"
            />
          </div>
        </template>
      </el-tab-pane>

      <!-- Favorite Channels -->
      <el-tab-pane label="Channels" name="favChannels">
        <div v-if="loading" class="loading-container"><el-skeleton :rows="3" animated/></div>
        <template v-else>
          <el-empty v-if="favoriteChannels.length === 0" description="No favorite channels" />
          <el-table v-else :data="favoriteChannels" stripe style="width: 100%">
            <el-table-column prop="channelName" label="Channel Name" min-width="200">
              <template slot-scope="scope">
                <div class="channel-name">{{ scope.row.channelName }}</div>
              </template>
            </el-table-column>
            <el-table-column label="Favorite" width="100">
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
                <el-button type="text" size="small" @click="goToChannel(scope.row)">View</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container" v-if="favoriteChannelTotal > 0">
            <el-pagination
                @size-change="handleFavoriteChannelSizeChange"
                @current-change="handleFavoriteChannelCurrentChange"
                :current-page="favoriteChannelQuery.current"
                :page-size="favoriteChannelQuery.size"
                layout="total, prev, next"
                :total="favoriteChannelTotal"
            />
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { getFavoriteChannels, getFavoriteVideos, favoriteChannel, unfavoriteChannel, favoriteVideo, unfavoriteVideo } from '@/api/ai'

export default {
  name: 'YoutubeFavorites',
  data() {
    return {
      favoritesActive: 'favVideos',
      loading: false,
      favoriteVideos: [],
      favoriteVideoQuery: { current: 1, size: 10 },
      favoriteVideoTotal: 0,
      favoriteChannels: [],
      favoriteChannelQuery: { current: 1, size: 10 },
      favoriteChannelTotal: 0,
      pendingVideoFavorite: {},
      pendingChannelFavorite: {},
      isSmallScreen: false,
    }
  },
  mounted() {
    this.onResize()
    window.addEventListener('resize', this.onResize)
    this.fetchList()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
  },
  watch: {
    favoritesActive() { this.fetchList() }
  },
  methods: {
    onResize() { this.isSmallScreen = window.innerWidth <= 600 },
    async fetchList() {
      if (this.favoritesActive === 'favVideos') await this.fetchFavoriteVideos()
      else await this.fetchFavoriteChannels()
    },
    async fetchFavoriteVideos() {
      this.loading = true
      try {
        const res = await getFavoriteVideos(this.favoriteVideoQuery.current, this.favoriteVideoQuery.size)
        if (res.data.code === 1) {
          const rec = res.data.data.records || []
          this.favoriteVideos = rec.slice().sort((a, b) => {
            const da = this.parseLocalDateTime(a && a.publishedAt)
            const db = this.parseLocalDateTime(b && b.publishedAt)
            const at = da ? da.getTime() : null
            const bt = db ? db.getTime() : null
            if (at === null && bt === null) return 0
            if (at === null) return 1
            if (bt === null) return -1
            return bt - at
          })
          this.favoriteVideoTotal = res.data.data.total || 0
        } else {
          this.$message.error(res.data.msg || 'Failed to fetch favorite videos')
        }
      } catch (e) {
        this.$message.error('Error loading favorite videos')
      } finally { this.loading = false }
    },
    async fetchFavoriteChannels() {
      this.loading = true
      try {
        const res = await getFavoriteChannels(this.favoriteChannelQuery.current, this.favoriteChannelQuery.size)
        if (res.data.code === 1) {
          this.favoriteChannels = res.data.data.records || []
          this.favoriteChannelTotal = res.data.data.total || 0
        } else {
          this.$message.error(res.data.msg || 'Failed to fetch favorite channels')
        }
      } catch (e) {
        this.$message.error('Error loading favorite channels')
      } finally { this.loading = false }
    },
    handleFavoriteVideoSizeChange(size) { this.favoriteVideoQuery.size = size; this.fetchFavoriteVideos() },
    handleFavoriteVideoCurrentChange(current) { this.favoriteVideoQuery.current = current; this.fetchFavoriteVideos() },
    handleFavoriteChannelSizeChange(size) { this.favoriteChannelQuery.size = size; this.fetchFavoriteChannels() },
    handleFavoriteChannelCurrentChange(current) { this.favoriteChannelQuery.current = current; this.fetchFavoriteChannels() },

    // toggles
    isVideoPending(id) { return !!this.pendingVideoFavorite[id] },
    isChannelPending(id) { return !!this.pendingChannelFavorite[id] },
    async toggleVideoFavorite(item) {
      const id = item.id
      if (this.pendingVideoFavorite[id]) return
      this.$set(this.pendingVideoFavorite, id, true)
      const prevF = !!item.favorited, prevC = item.favoriteCount || 0
      item.favorited = !prevF
      item.favoriteCount = Math.max(0, prevC + (item.favorited ? 1 : -1))
      try {
        const api = item.favorited ? favoriteVideo : unfavoriteVideo
        const res = await api(id)
        if (!(res && res.data && res.data.code === 1)) throw new Error(res && res.data && res.data.msg || 'Favorite toggle failed')
      } catch (e) {
        item.favorited = prevF
        item.favoriteCount = prevC
        this.$message.error(e.message || 'Failed to toggle favorite')
      } finally { this.$delete(this.pendingVideoFavorite, id) }
    },
    async toggleChannelFavorite(item) {
      const id = item.channelId
      if (this.pendingChannelFavorite[id]) return
      this.$set(this.pendingChannelFavorite, id, true)
      const prevF = !!item.favorited, prevC = item.favoriteCount || 0
      item.favorited = !prevF
      item.favoriteCount = Math.max(0, prevC + (item.favorited ? 1 : -1))
      try {
        const api = item.favorited ? favoriteChannel : unfavoriteChannel
        const res = await api(id)
        if (!(res && res.data && res.data.code === 1)) throw new Error(res && res.data && res.data.msg || 'Favorite toggle failed')
      } catch (e) {
        item.favorited = prevF
        item.favoriteCount = prevC
        this.$message.error(e.message || 'Failed to toggle favorite')
      } finally { this.$delete(this.pendingChannelFavorite, id) }
    },

    // navigation
    openVideoUrl(url) {
      if (!url) return this.$message.warning('Video URL is not available')
      this.$router.push({ path: '/index/tools/detail', query: { active: 'youtube', videoUrl: encodeURIComponent(url), ytbMode: 'player' }})
    },
    goToChannel(row) {
      // Switch to channel mode and point to the channelId so YoutubeChannel can pick it up
      this.$router.push({ path: this.$route.path, query: { ...this.$route.query, ytbMode: 'channel', channelId: row.channelId } })
    },

    // date utils
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
        return new Date(parseInt(y,10), parseInt(mo,10)-1, parseInt(d,10), parseInt(h,10), parseInt(mi,10), parseInt(s,10), ms?parseInt(ms.padEnd(3,'0'),10):0)
      }
      const d2 = new Date(value)
      return isNaN(d2.getTime()) ? null : d2
    },
    formatLocalDateTime(value) { const d = this.parseLocalDateTime(value); return d ? d.toLocaleString() : '' },
    formatRelative(value) {
      const d = this.parseLocalDateTime(value); if (!d) return ''
      const now = new Date(); const diff = now - d; const abs = Math.abs(diff)
      const sec = Math.floor(abs/1000), min=Math.floor(sec/60), hr=Math.floor(min/60), day=Math.floor(hr/24), mon=Math.floor(day/30), yr=Math.floor(day/365)
      const fmt=(n,u)=>`${n} ${u}${n!==1?'s':''}`; let t
      if (yr>0) t=fmt(yr,'year'); else if (mon>0) t=fmt(mon,'month'); else if (day>0) t=fmt(day,'day'); else if (hr>0) t=fmt(hr,'hour'); else if (min>0) t=fmt(min,'minute'); else t=fmt(Math.max(sec,0),'second')
      return diff>=0?`${t} ago`:`in ${t}`
    },
    getStatusText(code) {
      if (typeof code !== 'number') return code
      switch(parseInt(code)) { case 0: return 'Ready'; case 1: return 'Processing'; case 2: return 'Finished' }
    }
  }
}
</script>

<style scoped>
.youtube-favorites { width: 100%; }
.loading-container { margin-top: 20px; }
.pagination-container { margin-top: 20px; text-align: right; }
.channel-name { display: flex; align-items: center; justify-content: space-between; }
.video-title { display: flex; flex-direction: column; }
.title-text { font-weight: 500; }
.video-published { display: flex; flex-direction: column; }
.video-published .rel { font-weight: 500; }
.video-published .abs { font-size: 12px; color: #909399; }
.video-row-mobile { display: flex; flex-direction: column; padding: 6px 0; }
.video-row-mobile .row-top { display: flex; align-items: center; gap: 6px; }
.video-row-mobile .row-middle { margin-top: 4px; color: #606266; font-size: 12px; }
.video-row-mobile .row-middle .rel { font-weight: 500; }
.video-row-mobile .row-middle .sep { margin: 0 6px; color: #909399; }
.video-row-mobile .row-bottom { margin-top: 6px; display: flex; align-items: center; gap: 6px; }
.clickable { cursor: pointer; }
.ml-8 { margin-left: 8px; }
.fav-btn { color: #C0C4CC; }
.fav-btn.favorited { color: #f7ba2a; }
</style>

