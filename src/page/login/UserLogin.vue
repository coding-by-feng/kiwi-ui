<template>
    <el-form class="login-form"
             style="width: 400px;"
             status-icon
             ref="loginForm"
             :model="loginForm"
             label-width="80px">
        <el-form-item prop="username" label="账号：" style="width: 80%">
            <el-input size="small"
                      v-model="loginForm.username"
                      placeholder="请输入账号">
                <i class="icon-yonghu"></i>
            </el-input>
        </el-form-item>
        <el-form-item prop="password" label="密码：" style="width: 80%">
            <el-input size="small"
                      type="password"
                      v-model="loginForm.password"
                      placeholder="请输入密码">
            </el-input>
        </el-form-item>
        <el-form-item prop="code" label="验证码：" style="width: 100%">
            <el-row :span="24">
                <el-col :span="10">
                    <el-input size="small"
                              @keyup.enter.native="handleLogin"
                              :maxlength="code.len"
                              v-model="loginForm.code"
                              auto-complete="off"
                              placeholder="请输入验证码">
                        <i class="icon-yanzhengma"></i>
                    </el-input>
                </el-col>
                <el-col :span="10">
                    <div class="login-code">
                        <img :src="code.src"
                             class="login-code-img"
                             @click="refreshCode" alt="点击刷新"/>
                    </div>
                </el-col>
            </el-row>
        </el-form-item>
        <el-form-item style="width: 70%">
            <el-button type="primary" @click="handleLogin">登录</el-button>
            <el-button @click="resetForm">重置</el-button>
        </el-form-item>
    </el-form>
</template>
<script>
import { randomLenNum } from '@/util/util'
import { mapGetters } from 'vuex'

export default {
  name: 'userLogin',
  data () {
    return {
      loginForm: {
        username: '',
        password: '',
        code: '',
        randomStr: ''
      },
      code: {
        src: '/code',
        value: '',
        len: 4,
        type: 'image'
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度最少为6位', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          { min: 4, max: 4, message: '验证码长度为4位', trigger: 'blur' }
        ]
      },
      passwordType: 'password'
    }
  },
  mounted () {
    this.refreshCode()
  },
  computed: {
    ...mapGetters(['tagWel'])
  },
  methods: {
    refreshCode () {
      this.loginForm.code = ''
      this.loginForm.randomStr = randomLenNum(this.code.len, true)
      this.code.type === 'text'
        ? (this.code.value = randomLenNum(this.code.len))
        : (this.code.src = `/code?randomStr=${this.loginForm.randomStr}`)
      return this.code.src
    },
    showPassword () {
      this.passwordType === '' ? (this.passwordType = 'password') : (this.passwordType = '')
    },
    handleLogin () {
      const that = this

      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.$store.dispatch('LoginByUsername', this.loginForm).then(() => {
            // that.$router.push({name: '登录页'});
            this.$router.push({ path: '/index/vocabulary/detail', query: { active: 'search' } })
          }).catch(() => {
          })
        }
      })
    }
  }
}
</script>

