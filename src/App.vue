<template>
  <a-config-provider :locale="locale">
    <div id="app">
      <router-view/>
    </div>
  </a-config-provider>
</template>

<script>
import zhCN from 'ant-design-vue/es/locale/zh_CN'

export default {
  data() {
    return {
      locale: zhCN
    }
  }
}
</script>

<style>

#app {
  height: 100%
}

body .toasted-container .toasted .material-icons {
  margin:0 ;
  margin-right: 10px ;
}
body .toasted-container .toasted .material-icons.after {
  margin-right: 0 ;
  margin-left: 10px ;
}
body .toasted-container .toasted .action {
  font-size: 0.18rem ;
}
</style>
