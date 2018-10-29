// regenerator-runtime用来实现 ES6/ES7 中 generators、yield、async 及 await 等相关的 polyfills。
const regeneratorRuntime = require('./regenerator-runtime.js')
const wechat = require('./wechat');
const URI = 'https://changba.com';
// const URI = 'http://ktv240.vps.changbaops.com'
const version = '1.0.0'; //版本控制

/**
 * 网络请求
 * @param {*} url
 * @param {*} opt
 * @param {*} flag
 */
const requestAPI = async (url, opt, flag) => { // flag默认为false， true自己定义code非-97和1的显示情况
  const app = getApp();
  let options = Object.assign({
    data: {}
  }, opt);

  if (/^\/api\/(.+)$/.test(url)) {
    url = URI + url;
  }
  if (!options.method) {
    options.method = 'POST';
  }
  let header = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  options.header = options.header || header;

  //除了login方法  其余接口都要加入sessionKey
  if (!url.includes('/guessSongLoginNew')) {
    let cur_sessionKey = wx.getStorageSync('sessionKey');
    if (cur_sessionKey) {
      options.data['sessionInfo'] = cur_sessionKey;
    } else {
      console.log("======== ", app);
      login(app, () => {});
      return;
    }
  }
  options.data['version'] = version;
  //所有接口的数据都要encode
  for (let key in options.data) {
    options.data[key] = encodeURIComponent(options.data[key])
  }
  let isTimeout = false;
  wx.checkSession({
    success: function () {
      //session_key 未过期，并且在本生命周期一直有效
    },
    fail: function () {
      isTimeout = true;
    }
  })

  try {
    if (isTimeout) {
      console.log('====== changba.js requestAPI sessionKey过期')
      await login(app, () => {});
    }
    const res = await wechat.request(url, options)
    if (res && res.statusCode) {
      if (res.statusCode != 200) {
        console.log(res.statusCode, 'code')
        wx.showModal({
          content: wechat.errMsg(res.statusCode).message || '请求失败，请重新尝试',
          title: '提示',
          showCancel: false
        })
      } else {
        if (res.data) {
          if (res.data.code == 1000) {
            return res.data;
          } else if (res.data.code == 7001 || res.data.code == 7002) {
            // 登录过期
            let reLoginRet = await login(app, (res) => {});
          } else if (res.data.code == 7003) { // 没有解析出unionid
            return res.data;
          } else if (res.data.code == -102) {
            // 系统繁忙
            return res.data;
            // let reLoginRet = await login(app, (res) => { });
          } else if (res.data.code == 3002) {
            return res.data
          } else {
            wx.showModal({
              title: '提示',
              content: res.data.msg || '请求失败',
              showCancel: false
            })
            return res.data
          }
        } else {
          wx.showModal({
            title: '提示',
            content: '请求失败',
            showCancel: false
          })
        }
      }
    }
  } catch (error) {
    console.dir(error, 'error')
    wx.showModal({
      content: '网络异常',
      title: '',
      showCancel: false
    })
  }
}

/**
 * 登录
 * @param {*} app
 * @param {*} cb
 */
const login = async (app, cb) => {
  try {
    let wxLoginRes = await wechat.login() // 微信登录
    if (wxLoginRes.code) {
      //调用获取用户信息接口
      requestAPI('/api/newversion/guessSongAI/guessSongAI/guessSongLoginNew', {
        data: {
          js_code: wxLoginRes.code,
        }
      }).then(function (res) {
        if (res && res.code === 1000) {
          console.log("====== changba.js login res data", res.data);
          wx.setStorageSync('sessionKey', res.data.sessionInfo);
          wx.setStorageSync('openId', res.data.userInfo.openid);
          app.globalData.sessionKey = res.data.sessionInfo;
          app.globalData.userInfo = res.data.userInfo;
          app.globalData.openId = res.data.userInfo.openid || '';
          console.log("====== changba.js login sessionKey", app.globalData.sessionKey);
          console.log("====== changba.js login openId", app.globalData.openId);
          typeof app.cbLoginCallBackIndex === 'function' && app.cbLoginCallBackIndex(res.data);
          typeof app.cbResultCallBackIndex === 'function' && app.cbResultCallBackIndex(res.data);
          typeof app.cbRankCallBackIndex === 'function' && app.cbRankCallBackIndex(res.data);
          typeof cb === 'function' && cb(res);
        } else {
          wx.showModal({
            title: '登录提示',
            content: (res && res.msg) || '网络异常，请稍后重试',
            showCancel: false
          })
        }
      }).catch(function (res) {
        console.dir(res)
        wx.showModal({
          title: '登录提示',
          content: '网络异常，请稍后重试',
          showCancel: false
        })
      })
    } else {
      console.info(wxLoginRes)
      wx.showModal({
        title: '登录提示',
        content: res.errMsg || '登录失败',
        showCancel: false
      })
    }
  } catch (error) {
    wx.showModal({
      title: '登录提示',
      content: '登录失败',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }
      }
    })
    console.log('登录失败！' + error)
  }
}

//需要用户授权信息，调用wx.getUserInfo（）方法会弹出授权信息框  授权成功后可以再次获取到用户的unionId
const getuserinfo = async (res, app, cb) => {
  try {
    console.log(res)
    if (res.errMsg.includes('getUserInfo:ok')) {
      try {
        // userinfo存在storage里面
        wx.setStorageSync('userInfo', res);
        const temp_iv = res.iv,
          temp_encry = res.encryptedData;
        // temp_signature = res.signature,
        // temp_userInfo = res.userInfo;
        const cb_getuserinfo = await requestAPI('/api/newversion/guessSongAI/guessSongAI/saveGuessSongAuthorize', {
          data: {
            iv: temp_iv,
            encryptedData: temp_encry
          }
        })
        console.log('======== changba.js cb_getuserinfo ', cb_getuserinfo);
        if (cb_getuserinfo && cb_getuserinfo.code === 1000) {
          app.globalData.isBind = 1;
          typeof cb === 'function' && cb(cb_getuserinfo);
        } else if (cb_getuserinfo && cb_getuserinfo.code === 3002) {
          app.globalData.isBind = 0;
          typeof cb === 'function' && cb(cb_getuserinfo);
        } else {
          wx.showModal({
            title: '提示',
            content: (cb_getuserinfo && cb_getuserinfo.msg) || '网络异常，请稍后重试',
            showCancel: false
          })
        }
      } catch (e) {
        console.dir(e);
      }
    } else {
      console.log('=============== changba.js getuserinfo fail')
      wx.showModal({
        title: '用户未授权',
        content: '如需正常玩此游戏，请按确定并在授权管理中开启授权，然后点按确定。最后再重新进入小程序即可正常使用。',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            wx.openSetting({
              success: (res) => {
                console.log('openSetting success', res.authSetting);
              }
            });
          }
        }
      })
    }
  } catch (error) {
    console.dir(error)
  }
}

const settingImage = async (app, filePath, cb) => {
  //是否曾经通过saveImageToPhotosAlbum打开过设置询问面板
  if (app.globalData.canSaveImage) {
    consle.log('can can')
    try {
      let save_image = await wechat.saveImageToPhotosAlbum(filePath);
      if (save_image && save_image.code == 1) {
        typeof cb == "function" && cb(true, save_image);
        //判断是否是通过saveImageToPhotosAlbum打开的面板  从而决定是调用openSetting还是saveImageToPhotosAlbum
        app.globalData.canSaveImage = false;
        wx.hideLoading()
        wx.showToast({
          title: '海报保存成功',
          icon: 'success',
          duration: 1500
        })
      }
    } catch (error) {
      console.log('catch 1', error)
      wx.hideLoading()
      typeof cb == "function" && cb(false, error);
    }
  } else {
    console.log('not can can')
    try {
      let save_res = await wechat.saveImageToPhotosAlbum(filePath);
      console.log(save_res, 'save_res', save_res.code)
      if (save_res && save_res.code == 1) {
        // 保存成功后的回调
        console.log('成功毁掉')
        typeof cb == "function" && cb(true, save_image);
        app.globalData.canSaveImage = false;
        wx.hideLoading()
        wx.showToast({
          title: '海报保存成功',
          icon: 'success',
          duration: 1500
        })
      }
    } catch (error) {
      console.log('catch 2', error)
      wx.hideLoading()
      if (error.code == -1) {
        app.globalData.canSaveImage = true;
      }
      typeof cb == "function" && cb(false, error);
    }
  }
}

const sharePage = (title, path, imgUrl, cb) => {
  // 设置菜单中的转发按钮触发转发事件时的转发内容
  let shareObj = {
    title: title, // 标题
    path: path, // 路径
    imageUrl: imgUrl, // 自定义图片路径，可以是本地文件路径、代码包文件路径或者网络图片路径，支持PNG及JPG，不传入 imageUrl 则使用默认截图。显示图片长宽比是 5:4
    success: function (res) {
      console.log(title, path, imgUrl)
      // 转发成功之后的回调
      if (res.errMsg == 'shareAppMessage:ok') {
        // wx.showModal({
        //   title: '提示',
        //   content: '转发成功',
        //   showCancel: false
        // })
        wx.showToast({
          title: '转发成功',
          duration: 1000
        })
      }
    },
    fail: function (res) {　　　　 // 转发失败之后的回调
      　　　　
      if (res.errMsg == 'shareAppMessage:fail cancel') {　　　　 // 用户取消转发
        wx.showModal({
          title: '提示',
          content: '转发失败',
          showCancel: false
        })　　　　
      } else if (res.errMsg == 'shareAppMessage:fail') {　　　 // 转发失败，其中 detail message 为详细失败信息
        wx.showModal({
          title: '提示',
          content: '转发失败',
          showCancel: false
        })
      }
    },
  };
  return shareObj;
}

const downloadApp = () => {
  wx.navigateTo({
    url: '/pages/download/download',
  })
}

const getShare = (app, cb) => {
  wx.login({
    success: data => {
      if (data.code) {
        try {
          wx.getShareInfo({
            shareTicket: app.globalData.shareTicket,
            success: function (res) {
              typeof cb === 'function' && cb(data.code, res);
              console.log('获取票据', res);
            },
            fail: function (res) {
              console.log(res, '获取群信息失败')
              wx.showModal({
                title: '错误提示',
                content: '获取群信息失败',
                showCancel: false
              })
            }
          })
        } catch (e) {
          wx.showModal({
            title: '错误提示',
            content: e.errMsg || '获取票据失败',
            showCancel: false
          })
        }
      }
    },
    fail: data => {
      wx.showModal({
        title: '错误提示',
        content: '登录失败',
        showCancel: false
      })
    }
  })
}

// //群组string截取
// const getStr = function (str) {
//   let temp_arr = str.split('&'),
//     temp_json = {}
//   for (let i = 0; i < temp_arr.length; i++) {
//     let temp_var = temp_arr[i].split('=');
//     temp_json[temp_var[0]] = temp_var[1];
//     // console.log(name,'name')
//     // Object.assign(temp_json, { name: val }) 
//   }
//   console.log(temp_json, 'temp_json')
//   return temp_json;
// }


module.exports = {
  requestAPI,
  login,
  getuserinfo,
  settingImage,
  sharePage,
  downloadApp,
  getShare
}
