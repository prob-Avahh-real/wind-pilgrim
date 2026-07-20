# 风旅 (Wind Pilgrim)

《风之旅人》结构致敬：多章节沙漠朝圣、披风滑翔、鸣叫充能、匿名联网同行。原创资产，无原作资源。

## 目标平台

| 平台 | 方式 |
|------|------|
| Android | Capacitor → Gradle APK |
| 手表 | 窄屏 HUD |
| 智能戒指 | DeviceOrientation 转向 / 前倾 |
| 智能手杖 | DeviceMotion 鸣叫 / 滑翔起步 |

## 章节

1 沙丘启程 → 2 风桥遗迹 → 3 沉落城墟 → 4 神殿机关 → 5 暴风雪脊 → 6 峰顶升华 → 7 归途星河

每章含检查点环：踩过记录；坠落/出界回到最近检查点。

## 操控

| 输入 | 动作 |
|------|------|
| 虚拟摇杆 / WASD | 移动 |
| 空格 / 手杖甩动 | 滑翔 |
| F / 鸣叫钮 / 手杖轻点 | 鸣叫 |
| 戒指左右倾 | 转向 |
| 戒指前倾 | 前进分量 |

## 联机

```bash
npm run server          # ws://localhost:8787
# 可选：VITE_WS_URL=wss://your.host npm run build
```

同章节 FIFO 配对，最多 2 人；章内换区不拆对，换章重新匹配。转发位姿与鸣叫；近距互鸣可共享披风能量。

## 构建

```bash
npm install
npm run dev:all         # 匹配服 + Vite
npm run apk             # build + cap sync + assembleDebug
```

APK：`android/app/build/outputs/apk/debug/app-debug.apk`
