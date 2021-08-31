export function export_file_to_image(file, callback) {
  const reader = new FileReader()
  reader.onloadend = function() {
    const img = new Image()
    img.src = this.result
    img.onload = function() {
      callback && callback(img)
    }
  }
  reader.readAsDataURL(file)
}

/**
 * 图片压缩
 * @param {*} img
 * @param {*} opts { quality: '图片质量0-1', format: 'base64、file、blob' }
 */
export function imageCompress(img, opts = {}) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  // 瓦片canvas
  const tCanvas = document.createElement('canvas')
  const tctx = tCanvas.getContext('2d')
  let width = img.width
  let height = img.height
  // 如果图片大于四百万像素，计算压缩比并将大小压至400万以下
  let ratio
  if ((ratio = width * height / 4000000) > 1) {
    ratio = Math.sqrt(ratio)
    width /= ratio
    height /= ratio
  } else {
    ratio = 1
  }
  canvas.width = width
  canvas.height = height
  // 铺底色
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // 如果图片像素大于100万则使用瓦片绘制
  let count
  // 如果图片像素大于100万则进行最小压缩
  let encoderOptions
  if ((count = width * height / 1000000) > 1) {
    encoderOptions = 0.1
    count = ~~(Math.sqrt(count) + 1) // 计算要分成多少块瓦片
    // 计算每块瓦片的宽和高
    const nw = ~~(width / count)
    const nh = ~~(height / count)
    tCanvas.width = nw
    tCanvas.height = nh
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        tctx.drawImage(
          img,
          i * nw * ratio,
          j * nh * ratio,
          nw * ratio,
          nh * ratio,
          0,
          0,
          nw,
          nh
        )
        ctx.drawImage(tCanvas, i * nw, j * nh, nw, nh)
      }
    }
  } else {
    encoderOptions = 1
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }
  const ndata = canvas.toDataURL('image/jpeg', opts.quality || encoderOptions)

  tCanvas.width = tCanvas.height = canvas.width = canvas.height = 0

  return formatBase64(ndata, opts.format)
}

function formatBase64(base64, format) {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1]) // 解码base-64编码的数据
  let n = bstr.length
  const u8arr = new Uint8Array(n)// 无符号整型数组
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  const filename = new Date().getTime()
  const result = {
    base64,
    file: new File([u8arr], filename, { type: mime }),
    blob: new Blob([u8arr], { type: mime })
  }

  return result[format] || result
}

export function getFileFromUrl({ url, fileName, fileType = 'image/jpeg', success, error }) {
  var blob = null
  var xhr = new XMLHttpRequest()
  xhr.open('GET', url)
  xhr.setRequestHeader('Accept', fileType)
  xhr.responseType = 'blob'
  xhr.onerror = () => {
    error && error.call(this, fileName)
  }
  xhr.onload = () => {
    if (xhr.status === 200) {
      blob = xhr.response
      const file = new File([blob], fileName, { type: fileType })
      file['uid'] = new Date().getTime()
      success && success.call(this, file, window.URL.createObjectURL(blob))
    } else {
      error && error.call(this, fileName)
    }
  }
  xhr.send()
}
