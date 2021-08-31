import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    planRouteIsShow: false
  },
  mutations: {
    INPUT_SEARCH_ENTER(state, isShow = true) {
      state.planRouteIsShow = isShow
    }
  },
  actions: {
  },
  modules: {
  }
})
