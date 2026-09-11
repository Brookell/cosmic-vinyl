# Cosmic Vinyl

> A gesture-controlled 3D audio gallery where albums float through a dark cosmic space like playable vinyl records.
>
> 一个以手势控制为核心的 3D 音乐画廊：专辑像黑胶唱片一样漂浮在宇宙空间里，可以浏览、聚焦、搜索、添加并播放。

[English](#english) | [中文](#中文)

---

## 中文

**Cosmic Vinyl** 是一个沉浸式网页音乐体验。它把音乐库做成一个 3D 黑胶唱片墙：你可以用鼠标、键盘或摄像头手势浏览专辑，搜索 iTunes 试听片段，添加喜欢的歌曲，并通过放大唱片进入播放状态。

这个项目不是普通播放器，而是一个带有视觉叙事的交互原型：黑色玻璃拟态界面、冷色霓虹高光、动态星尘轨迹、3D 唱片轮播，以及手势识别共同构成一个“太空唱片店”的感觉。

### 功能亮点

- **3D 黑胶画廊**：使用 Three.js 构建旋转唱片墙和网格视图。
- **摄像头手势控制**：通过 MediaPipe Hands 识别张开手掌、伸出食指、握拳等手势。
- **鼠标与键盘模式**：支持拖拽、方向键、A/D/W/S、点击聚焦和长按播放。
- **音乐搜索与播放**：可搜索 iTunes 试听片段，点击搜索结果可直接播放，点击加号可加入媒体库。
- **自定义曲库**：支持手动添加歌曲，也支持上传本地音频文件。
- **双语界面**：内置中英文切换。
- **教学指南**：可选择“摄像头手势教学”或“鼠标键盘教学”，分别查看对应操作说明。
- **响应式界面**：针对桌面与移动端做了布局适配。
- **视觉设置**：支持调整背景亮度、专辑亮度等视觉参数。

### 技术栈

- **Three.js**：3D 场景、唱片模型、光照、相机和动画。
- **MediaPipe Hands**：摄像头手势识别。
- **Web Audio API**：音频播放、音量、试听片段和本地音频处理。
- **IndexedDB / localStorage**：保存本地上传音频和自定义曲库数据。
- **iTunes Search API**：搜索歌曲、封面和试听片段。
- **原生 HTML / CSS / JavaScript**：无框架实现，结构轻量。

### 本地运行

```bash
npm run dev
```

默认会在本地启动：

```text
http://localhost:3005/
```

如果端口被占用，可以临时使用其他端口：

```bash
npx http-server -p 3015 -c-1
```

### 操作方式

#### 鼠标键盘模式

- 左右拖拽或使用方向键 / A-D 浏览唱片。
- 点击唱片聚焦。
- 聚焦后长按唱片播放。
- 播放时点击空白区域或按 `Esc` 返回浏览。

#### 摄像头手势模式

- 张开手掌并左右移动：快速浏览唱片。
- 伸出食指并左右移动：慢速浏览唱片。
- 握拳并保持：聚焦 / 播放当前唱片。
- 再次张开手掌：从播放状态返回画廊。

浏览器会在启用摄像头手势时请求摄像头权限。摄像头画面只用于本地手势识别。

### 项目结构

```text
cosmic-vinyl/
├── index.html      # 页面结构和主要 UI
├── styles.css      # 视觉风格、布局、响应式和动效
├── main.js         # Three.js 场景、交互编排和 UI 状态
├── audio.js        # Web Audio、试听片段、本地音频和曲库数据
├── gestures.js     # MediaPipe 手势识别与回调
├── lang.js         # 中英文文案和语言切换
└── package.json    # 项目脚本和元信息
```

### 设计方向

Cosmic Vinyl 的视觉关键词是：

- 深色宇宙背景
- 玻璃拟态面板
- 冷色霓虹高光
- 黑胶唱片和专辑封面
- 轻量但有反馈的交互动效

后续优化方向可以包括：更完整的播放列表管理、更清晰的移动端播放器、更多可配置视觉主题、真实音乐服务接入，以及更精细的手势校准。

---

## English

**Cosmic Vinyl** is an immersive web-based music experience. It turns a music library into a 3D vinyl gallery where album covers float through a dark cosmic space. You can browse records with your mouse, keyboard, or camera gestures, search iTunes previews, add songs to your library, and zoom into a record to play it.

This is not just a conventional music player. It is an interactive visual prototype shaped around a “record shop in space” atmosphere: glassmorphic UI panels, cool neon highlights, dynamic stardust trails, 3D album movement, and gesture-based navigation.

### Highlights

- **3D vinyl gallery**: A Three.js-powered carousel and grid view for browsing albums.
- **Camera gesture control**: MediaPipe Hands recognizes open palm, index finger, fist, and hold gestures.
- **Mouse and keyboard mode**: Drag, use arrow keys, focus records, and long-press to play.
- **Music search and playback**: Search iTunes previews, click a result to play immediately, or use the plus button to add it to the library.
- **Custom library**: Add songs manually or upload local audio files.
- **Bilingual UI**: Built-in English and Chinese language switching.
- **Guide mode selector**: Choose between camera gesture instructions and mouse/keyboard instructions.
- **Responsive layout**: Adapted for desktop and smaller screens.
- **Visual controls**: Adjust background brightness, artwork brightness, and related visual settings.

### Tech Stack

- **Three.js** for the 3D scene, records, lighting, camera, and animation.
- **MediaPipe Hands** for gesture recognition.
- **Web Audio API** for playback, volume, previews, and local audio handling.
- **IndexedDB / localStorage** for uploaded audio and custom library data.
- **iTunes Search API** for song search, artwork, and preview clips.
- **Vanilla HTML / CSS / JavaScript** with no application framework.

### Run Locally

```bash
npm run dev
```

The app starts at:

```text
http://localhost:3005/
```

If that port is already in use, run it on another port:

```bash
npx http-server -p 3015 -c-1
```

### Controls

#### Mouse and Keyboard Mode

- Drag left or right, or use arrow keys / A-D to browse records.
- Click a record to focus it.
- Long-press the focused record to play.
- Click empty space or press `Esc` to return from playback to browsing.

#### Camera Gesture Mode

- Open palm and move left/right: browse quickly.
- Index finger and move left/right: browse slowly.
- Make a fist and hold still: focus or play the current record.
- Open palm again: return from playback to the gallery.

The browser will request camera permission when camera gesture mode is enabled. The camera feed is used locally for gesture recognition.

### Project Structure

```text
cosmic-vinyl/
├── index.html      # Page structure and main UI
├── styles.css      # Visual style, layout, responsiveness, and animations
├── main.js         # Three.js scene, interaction orchestration, and UI state
├── audio.js        # Web Audio, previews, local audio, and track data
├── gestures.js     # MediaPipe gesture recognition and callbacks
├── lang.js         # English/Chinese copy and language switching
└── package.json    # Project scripts and metadata
```

### Design Direction

Cosmic Vinyl is built around:

- dark cosmic space
- glassmorphic panels
- cool neon highlights
- vinyl records and album artwork
- lightweight but expressive interaction feedback

Possible next steps include deeper playlist management, a more refined mobile player, additional visual themes, real music-service integrations, and more precise gesture calibration.

---

## License

MIT
