/**
 * 底层封装小程序请求API
 * @param  {String}   options.url         接口地址
 * @param  {Object}   options.params      请求的参数
 * @param  {String}   options.method      请求类型
 * @param  {Object}   options.sourceObj   来源对象
 * @param  {Function} options.success  接口调用成功返回的回调函数
 * @param  {Function} options.fail     接口调用失败的回调函数
 * @param  {Function} options.complete 接口调用结束的回调函数(调用成功、失败都会执行)
 */
const request = (url,options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: options.method,
      data: Object.assign({}, options.data),
      header: options.header,
      success: resolve,
      fail: reject,

    })
  })
}

const errMsg = (status) => {
  let err = {}
  err.code = status
  switch (status) {
    case 400:
      err.message = '错误请求'
      break;
    case 401:
      err.message = '未授权，请重新登录'
      break;
    case 403:
      err.message = '拒绝访问'
      break;
    case 404:
      err.message = '请求错误，未找到该资源'
      break;
    case 405:
      err.message = '请求方法未允许'
      break;
    case 408:
      err.message = '请求超时'
      break;
    case 500:
      err.message = '服务器端出错'
      break;
    case 501:
      err.message = '网络未实现'
      break;
    case 502:
      err.message = '网络错误'
      break;
    case 503:
      err.message = '服务不可用'
      break;
    case 504:
      err.message = '网络超时'
      break;
    case 505:
      err.message = 'http版本不支持该请求'
      break;
    default:
      err.message = '连接错误'
  }
  return err
}

const login = () => {
    return new Promise((resolve, reject) => {
      wx.login({ success: resolve, fail: reject })
    })
}

//打开设置
const openSetting = () => {
    return new Promise((resolve, reject) => {
      if (!wx.openSetting) {
        wx.showModal({
          title: '提示',
          content: '请先将微信升级至最新版本',
          showCancel: false
        })
        return ;
      }
        wx.openSetting({ 
          success: function (res) {
            if (res.authSetting['scope.writePhotosAlbum']) {
              res.code = 1;
              resolve(res);
            }
            else {
              res.code = -3;//表示拒绝授权,采用群god code区分是用户主动拒绝授权还是opensetting失败
              reject(res);
            }
          }, 
          fail:reject
          })
    })
}

const getUserInfo = () => {
    return new Promise((resolve, reject) => {
      wx.getUserInfo({ success: resolve, fail: reject})
    })
}

const setStorage = (key, value) => {
    return new Promise((resolve, reject) => {
        wx.setStorage({ key: key, data: value, success: resolve, fail: reject })
    })
}
const checkSession = () => {
  return new Promise((resolve,reject) => {
    wx.checkSession({
      success: resolve, fail: reject
    })
  })
}
const getStorage = (key) => {
    return new Promise((resolve, reject) => {
        wx.getStorage({ key: key, success: resolve, fail: reject })
    })
}

const getLocation = (type) => {
    return new Promise((resolve, reject) => {
        wx.getLocation({ type: type, success: resolve, fail: reject })
    })
}

const getImageInfo = (src) => {
    return new Promise((resolve, reject) => {
        wx.getImageInfo({ 
            src: src, 
            success: (res) => {
                res.code = 1;
                resolve(res)
            }, 
            fail: (res) => {
                res.code = -1;
                reject(res)
            }
        })
    })
}

const saveImageToPhotosAlbum = (filePath) => {
    return new Promise((resolve, reject) => {
      if (wx.saveImageToPhotosAlbum) {
        wx.saveImageToPhotosAlbum({
          filePath: filePath,
          success: (res) => {
            res.code = 1;
            resolve(res)
            console.log('成功', res)
          },
          fail: (res) => {
            console.log(res,'res')
            if (res.errMsg.includes('saveImageToPhotosAlbum:fail auth deny')) {
              res.code = -1;
              //如果用户第一次拒绝  不需要打开设置面板 三叔心思缜密666
            } else {
              res.code = -2;
            }
            reject(res)
          }
        })
      } else {
        wx.showModal({
          title: '提示',
          content: '请将微信升级至最新版本',
          showCancel: false
        })
        return ;
      }
    })
}

const canvasToTempFilePath = (x, y, width, height, destWidth, destHeight, canvasId, quality) => {
    return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({ 
            x: x, 
            y: y, 
            width: width, 
            height: height, 
            destWidth: destWidth, 
            destHeight: destHeight, 
            canvasId: canvasId, 
            quality: quality, 
            success: (res) => {
                res.code = 1;
                resolve(res)
            }, 
            fail: (res) => {
                res.code = -1;
                reject(res)
            } 
        })
    })
}

const showUpgrade = () => {
  wx.showModal({
    title: '提示',
    content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
    showCancel: false
  })
}

const compareVersion = (v1, v2) => {
  v1 = v1.split('.')
  v2 = v2.split('.')
  var len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (var i = 0; i < len; i++) {
    var num1 = parseInt(v1[i])
    var num2 = parseInt(v2[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }

  return 0
}

module.exports = {
    login: login,
    openSetting: openSetting,
    getUserInfo: getUserInfo,
    setStorage: setStorage,
    getStorage: getStorage,
    getLocation: getLocation,
    checkSession: checkSession,
    request: request,
    errMsg: errMsg,
    getLocation: getLocation,
    getImageInfo: getImageInfo,
    saveImageToPhotosAlbum: saveImageToPhotosAlbum,
    canvasToTempFilePath: canvasToTempFilePath,
    showUpgrade: showUpgrade,
    compareVersion: compareVersion
}