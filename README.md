# miniprogram-base

-- miniprogram cli

### description
- _描述_: 唱吧小程序脚手架工具
- _工具_: [微信 web 开发者工具](https://mp.weixin.qq.com/debug/wxadoc/dev/devtools/download.html?t=1477579747265)
- _环境搭建_: 目前支持Gulp打包管理 npm 脚本运行

#### 功能及使用的组件等

- 封装微信API方法，封装底层网络请求，封装常用保存海报、登录、授权等接口
- 支持Sass语法编写，可自定义mixins等
- 支持scss文件自动编译成wxss, 单位px->rpx（小程序按按750px设计稿）
- 支持scss文件base64处理图片链接
- 支持js文件ES6语法编写，babel编译
- 支持图片压缩

### Setup

```
进入目录 执行 npm install

开发模式：

执行npm run dev 实时编译文件

生成模式：

执行 npm run build 生成打包文件

```
下载安装Wechat DEV Tools, 导入打包编译发布好的dist目录







