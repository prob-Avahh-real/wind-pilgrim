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

## Harness / Loop（助手）

- 遵循根 `/Users/skat/AGENTS.md`：**Harness Engineering** + **Loop Engineering**
- Guide = 本文件；Sensor = 下方验证命令；同类失误第二次须沉淀规则或测试（棘轮）
- 开干前写清 **Done**；每切片过验证环；显式停止（成功 / 上限 / 无进展 / 人审）
- 详解：`docs/HARNESS_ENGINEERING.md`、`docs/LOOP_ENGINEERING.md`

## 验证环 / Done

```bash
npm install
npm test          # 若有
npm run build     # 或 build:web
npx cap sync android   # 若有 android/
# 可选：JAVA_HOME=…/openjdk@17 npm run apk:debug
```

**Done 示例**：测试通过（若有）+ web 产物进 `www/`/`dist/` + `cap sync` 无报错。可选穿戴未做可搁置，不纳入强制 Done。
