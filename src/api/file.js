const isProd = process.env.NODE_ENV === 'production'

export function getRemoteFile() {

}

export function getLocalFile(filepath) {
  return isProd ? process.env.VUE_APP_PREFIX_PATH + filepath : filepath
}
