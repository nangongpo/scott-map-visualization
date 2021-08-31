<template>
  <div class="scott-map">
    <div v-show="showButton" class="scott-map-layer">
      <a-button type="primary" @click="showModal = true">
        添加卡口点
      </a-button>
      <a-button type="primary" @click="changeMapRing">
        切换环区 <span v-show="ringNum >= 0">：{{ ringNum + 1 }}环</span>
      </a-button>
    </div>
    <div id="container" class="container"></div>
    <a-modal v-model="showModal" title="添加卡口点" @ok="addKKPoints">
      <a-upload-dragger
        class="file-uploader"
        accept=".xlsx, .xls"
        :before-upload="beforeUpload"
        @reject="handleUploadReject">
        <p class="ant-upload-drag-icon">
          <a-icon type="inbox" />
        </p>
        <p class="ant-upload-text">
          将文件拖到此处，或<em class="ant-btn-link">点击上传</em>
        </p>
      </a-upload-dragger>
      <!-- <div class="pt-10 text-center">
        <a :href="getLocalFile('/files/模版.xlsx')">下载excel模版</a>
      </div> -->
    </a-modal>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import zz_rings from '@/map/zz_rings.json'
// eslint-disable-next-line no-unused-vars
import { AMapLoader, openInfoWin, closeInfoWin, getCenterPoint } from '@/utils/amap'
import { export_excel_to_json } from '@/vendor/Export2Excel'
import { getLocalFile } from '@/api/file'

export default {
  data() {
    return {
      getLocalFile,
      showButton: false,
      showModal: false,
      fileList: [],
      map: null,
      loca: null,
      pointLayer: null,
      polygonLayer: null,
      labelsLayer: null,
      colors: [
        '#07E8E4',
        '#AD92D1',
        '#3346BD',
        '#EBEB8D',
        '#7FC97F',
        '#07E8E4',
        '#A2D9CE',
        '#D6EAF8',
        '#EC7063',
        '#D4AC0D',
        '#C0392B'
      ],
      ringNum: -1
    }
  },
  computed: {
    ...mapState([
      'planRouteIsShow'
    ])
  },
  watch: {
    points: {
      handler: 'updateData',
      deep: true
    },
    ring() {
      this.controlMapRing(this.ring)
    }
  },
  created() {
    this.initMap()
  },
  methods: {
    initMap() {
      const amapOptions = {
        key: '93b256aadeceda9c75bfd8f056d41cd0',
        version: '1.4.5',
        // 'AMap.Autocomplete', 'AMap.Geolocation', 'AMap.GeometryUtil', 'AMap.DistrictSearch'
        plugins: [], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
        AMapUI: {
          version: '1.0',
          plugins: ['control/BasicControl'] // 需要加载的 AMapUI ui插件
        },
        Loca: {
          version: '1.3.2'
        }
      }

      AMapLoader(amapOptions).then(AMap => {
        const mapOptions = {
          zoom: 14,
          center: [113.625351, 34.746303],
          pitch: 60,
          cityName: '郑州',
          mapStyle: 'amap://styles/c4676056f9bf08adcc707d7a7801a66d',
          viewMode: '3D'
        }
        const map = new AMap.Map('container', mapOptions)

        //缩放控件
        map.addControl(new AMapUI.BasicControl.Zoom({
          position: 'rb',
          showZoomNum: true
        }))

        //图层切换控件
        map.addControl(new AMapUI.BasicControl.LayerSwitcher({
          position: 'rt'
        }))

        this.map = map

        this.pointLayer = new Loca.PointLayer({
          map: this.map,
          eventSupport: true
        })

        this.polygonLayer = new Loca.PolygonLayer({
          map: map,
          fitView: true
        })

        this.polygonLayer = new Loca.PolygonLayer({
          map: map,
          fitView: true
        })

        this.labelsLayer = new Loca.LabelsLayer({
          map: map,
          eventSupport: true,
          fitView: true,
          visible: true,
          animation: true,
          collision: true // 是否开启文字自动避让
        })

        this.showButton = true
      })
    },
    beforeUpload(file) {
      this.fileList = [file]
      return false
    },
    handleUploadReject(fileList) {
      console.log('UploadReject')
    },
    addKKPoints(data) {
      // "设备编号", "设备名称", "所在地点", "经度", "纬度", "状态", "设备类型", "一期二期"
      // this.points = [
      //   { kk_code: '123', kk_name: '123', kk_lng: 113.625351, kk_lat: 34.746303 }
      // ]
      const options = {
        header: ['kk_code', 'kk_name', 'kk_position', 'kk_lng', 'kk_lat', 'kk_status', 'kk_type', 'kk_category']
      }
      export_excel_to_json(this.fileList[0], options).then(result => {
        const data = result.slice(1).filter(v => !!v.kk_lat && !!v.kk_lng)
        const { map, pointLayer, colors } = this
        pointLayer.setData(data, {
          type: 'json',
          lnglat: function(obj) {
            const value = obj.value
            return [value['kk_lng'], value['kk_lat']]
          }
        })
        pointLayer.setOptions({
          unit: 'px',
          style: {
          // 根据车辆类型设定不同半径
            radius: function(obj) {
              // const value = obj.value
              return 6
            },
            height: 0,
            color: function(obj) {
              const { kk_category = '' } = obj.value || {}
              switch (kk_category.split('-')[0]) {
                case '限行一期':
                  return colors[0]
                case '限行二期':
                  return colors[1]
                case '电警一期':
                  return colors[2]
                case '电警二期':
                  return colors[3]
                default:
                  return colors[4]
              }
            },
            opacity: 1
          }
        })

        pointLayer.on('mousemove', function(ev) {
          // 原始鼠标事件
          const originalEvent = ev.originalEvent
          const { kk_name, kk_lng, kk_lat } = ev.rawData

          openInfoWin(map, originalEvent, {
            '名称': kk_name,
            '位置': `${kk_lng}, ${kk_lat}`
          })
        })
        pointLayer.on('mouseleave', function(ev) {
          closeInfoWin()
        })

        pointLayer.render()
        this.showModal = false
        this.$message.success(`成功添加${data.length}条卡口信息`)
      }).catch(err => {
        this.$error({
          title: '错误提示',
          content: err.message,
          onOk() {}
        })
      })
    },
    changeMapRing() {
      // eslint-disable-next-line no-unused-vars
      const { polygonLayer, labelsLayer, colors } = this


      if (this.ringNum < 0 || this.ringNum < zz_rings.length - 1) {
        this.ringNum++
      } else {
        this.ringNum = 0
      }
      const data = this.ringNum > 0 ? zz_rings.slice(this.ringNum - 1, this.ringNum + 1) : zz_rings.slice(this.ringNum, this.ringNum + 1)
      const coordinates = data.slice(-1)[0].coordinates
      const label = data.slice(-1)[0].name

      polygonLayer.setData(data, {
        lnglat: 'coordinates'
      })
      polygonLayer.setOptions({
        style: {
          height(res) {
            return data.length < 2 ? 0 : res.index > 0 ? 0 : 10
          },
          opacity(res) {
            return data.length < 2 || res.index > 0 ? 0.8 : 0
          },
          borderWidth: 4,
          borderColor: '#ffffff',
          color: (res) => {
            return colors[this.ringNum]
          }
        }
      })
      polygonLayer.on('click', function(event) {
        console.log('Click target: ', event.target) // 触发click事件的元素
        console.log('Event type: ', event.type) // 事件名称
        console.log('Raw Event: ', event.originalEvent) // 原始DomEvent事件
        console.log('Raw data: ', event.rawData) // 触发元素对应的原始数据
        console.log('LngLat: ', event.lnglat) // 元素所在经纬度
      })

      polygonLayer.render()

      labelsLayer.setData(data.slice(-1), {
        lnglat: () => {
          return getCenterPoint(coordinates)
        }
      })
      labelsLayer.setOptions({
        style: {
          direction: 'center',
          offset: [0, 0],
          zooms: [11], // 文字显示范围
          text: function() {
            return label
          },
          fillColor: 'rgb(255, 255, 255)',
          fontSize: 50
        }
      })
      labelsLayer.render()
    }
  }
}
</script>

<style lang="less">
.scott-map {
  width: 100%;
  height: 100%;
  position: relative;
  .scott-map-layer {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1
  }
}
.container {
  height: 100%;
  width: 100%;
}

.info-window {
  background: #363F49;
  color: #A0A7B4;
  padding: 10px;
  max-width: 300px;
  min-width: 200px;
  font-size: 12px;
  line-height: 1.6;
  .label {
    vertical-align: top;
  }
  .content {
    text-align: right;
    color: #D3D8E0;
  }
}
</style>
