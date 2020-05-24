# kiwi-ui

## 通过URL连接快捷查询单词配置
## 懒加载模式
http://39.107.142.173/#/index/vocabulary/detail?active=search&lazy=y&word={query}

url后面的{query}，就是要查的单词，比如要查单词test，访问连接为：
```
http://39.107.142.173/#/index/vocabulary/detail?active=search&lazy=y&word=test
```
### Mac系统下可以结合Alfred快速查询单词

[https://raw.githubusercontent.com/coding-by-feng/oss/master/uPic/QQ20200523-005855.mp4](https://raw.githubusercontent.com/coding-by-feng/oss/master/uPic/QQ20200523-005855.mp4 "")

<video id="video" controls="" preload="none">q
<source id="mp4" src="https://raw.githubusercontent.com/coding-by-feng/oss/master/uPic/QQ20200523-005855.mp4" type="video/mp4">
</video>

### ios系统下可以结合Shortcuts快速查单词
![https://raw.githubusercontent.com/coding-by-feng/oss/master/uPic/uV23ZT.jpg](https://raw.githubusercontent.com/coding-by-feng/oss/master/uPic/uV23ZT.jpg '')

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### My Deploy
```
cd yourUIPath
vue-cli-service build && sshpass -p feng@feng-9210 scp -r /Users/zhanshifeng/Documents/myDocument/webstorm-projects/kiwi-ui/dist root@39.107.142.173:/root/docker/ui/
```