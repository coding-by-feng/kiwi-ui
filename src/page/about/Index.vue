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
                <p>作者wx：my_dream_it</p>
                <p>作者邮箱：feng_orz@163.com</p>
                <p>粤ICP备2020080500号</p>
                <p style="color: red" v-show="true">温馨提示：浏览本网站请不要使用苹果自带的safari浏览器，需使用UC浏览器、谷歌浏览器等！</p>
            </div>
        </el-card>
    </div>
</template>

