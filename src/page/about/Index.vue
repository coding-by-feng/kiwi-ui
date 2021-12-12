<script>
export default {
  name: 'about',
  data () {
    return {}
  },
  mounted () {},
  methods: {}
}
</script>

<style>
.item {
  padding: 18px 0;
}

.box-card {
  width: 100%;
}
</style>

<template>
  <div>
    <el-card class="box-card">
      <div class="text item">
        <a target="_blank" href="https://www.fengorz.me/" style="color: #409EFF">click enter into my blog</a>
      </div>
      <div class="text item">
        <a target="_blank" href="https://github.com/coding-by-feng" style="color: #409EFF">click enter into my github</a>
      </div>
      <div class="text item">
        <a target="_blank" href="https://qm.qq.com/cgi-bin/qm/qr?k=IdTwxPha3gHT5VNTbqokUjxQOMbTfsAP&jump_from=webapi"><img border="0" src="//pub.idqqimg.com/wpa/images/group.png" alt="Kiwi词典QQ群" title="Kiwi词典QQ群"></a>
      </div>
      <div class="text item">
        <img src="wechat.png" alt="微信个人二维码" width="300px">
      </div>
    </el-card>
  </div>
</template>

