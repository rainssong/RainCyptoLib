# Rain的量化库

### 关于
这是一个简易量化库，可以在本地运行并自定义策略

### 注意：

1. 所有代码运行在本地，使用时需要在交易所申请apikey和secret并填写到代码中，请勿泄露给他人。如果泄露，最好删除重建。
2. 存在服务器、本地设备、网络等不可控因素，可能导致功能无法正常运行，注意查看控制台报错。
3. 此为开源代码，不存在盗取资料的可能。
4. 工具库可能存在其它BUG，请自行斟酌，因使用导致的亏损本人概不负责

### 使用方法：
1. 编写Html和脚本，参考Examples
2. 浏览器需要打开跨域，方法是浏览器快捷方式地址加参数 --args --disable-web-security --user-data-dir="D:/ChromeDevSession"
3. 每个量化元素都包含两个CheckBox，第一个是运行状态，第二个是测试模式
4. 测试模式下，元素本身并不会实际获取数据、执行交易。但是对于策略元素，可能会主动调用一些监控元素，监控元素并不受测试模式影响。

### 基类：

* CyptoElement：总基类，每一个量化元素都继承自此类
* Monitor：监控基类，用于获取数据
* Strategy：策略基类，用于处理数据，交易

### 监控类
* DeribitStopLoss，期权自动止损工具
  * 收益率止损/盈利止损
  * 每个仓位单独设置止损
  * 期权市价平仓滑点很高，尽量手动平仓
  * 使用方法：见examples/DerbitExample.html，右键编辑，填写资料
* KlineMonitor：K线监控
* VixMonitor：Vix监控
* FnGMonitor：恐惧贪婪指数监控
* FundFeeMonitor：资金费监控
* TickMonitor：成交价监控
* CustomMonitor：自定义监控 new CustomMonitor(express,then,Interval)

### 策略
* CrossStrategy：交叉策略，价格穿过一个值则执行
* FundFeeArbitrageStrategy：资金费交割套利，以交割时间附近进行交易
* FundFeeStrategy：资金费策略，当资金费满足条件则交易。


### TODO：
* localStorage——推迟
* get message
* crossMonitor: 上下穿、推送开关，表达式，标签

### Diary：
* 20220307 v1.2 切换为类写法，CustomMonitor
* 20220309 Monitor管理全部监控器，requireJS
* 20220311 Strategy类,FundFeeStrategy
* 20220327 v1.3 修复bug，优化结构
* 20220417 CrossStrategy
* 20220421 v1.4 Vue3，组件化，模块化
* 20220423 v1.5 Bootstrap5，调整布局
* 20220424 deribit止损优化，log优化
* 20220425 更新交易接口，可选择交易单位
* 20220429 穿透策略
* 20220430 修正交易接口bug，增加交易状态。
* 20220501 修复一些bug
* 20220504 增加Trader
* 20220509 KlineMonitor优化
* 20220510 v1.6 beta，策略可以控制监控器，监控器增加最小执行间隔，监控器共享避免资源浪费，价差套利策略
* 20220511 修复TraderBUG
* 20220512 修复一些bug
* 20220527 Trader持仓改为以交易所为准
* 20220529 套利策略可以增删条件
* 20220620 策略输入条件标准化
* 20220623 条件可排序，可添加自动计算



### 联系我
* 微信：rainssong
* e-mail：rainssong@outlook.com
