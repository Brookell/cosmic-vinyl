// Cosmic Vinyl - Language Manager for English / Chinese toggling

const translations = {
  en: {
    library: "Library",
    toggle_library: "Toggle Sidebar",
    switch_view: "Switch View",
    grid_view: "Grid View",
    carousel_view: "Carousel View",
    gesture_guide: "Gesture Guide",
    gesture_guide_title: "Gesture Guide",
    mouse_mode: "Mouse Mode",
    mouse_mode_title: "Mouse Mode",
    gesture_mode: "Gesture Mode",
    gesture_mode_title: "Gesture Mode",
    search_placeholder: "What do you want to play?",
    your_library: "Your Library",
    add_custom_song: "Add Custom Song",
    collapse_library: "Collapse Library",
    all: "All",
    gestures: "Gestures",
    search_online: "Search Online",
    custom_manual: "Custom Manual",
    search_songs: "Search songs...",
    song_title: "Song Title",
    artist_name: "Artist Name",
    add_to_gallery: "Add to Gallery",
    close_panel: "Close Panel",
    open_palm: "OPEN PALM",
    open_palm_desc: "Fast slide left/right to view albums",
    digit_one: "DIGIT ONE",
    digit_one_desc: "Slow slide left/right to view albums",
    make_fist: "MAKE A FIST",
    make_fist_desc: "Zoom current album (Hold still 3s to play)",
    album: "ALBUM",
    toggle_play: "Toggle Play",
    shuffle: "Shuffle",
    save_to_library: "Save to Library",
    more_options: "More options",
    prev_title: "Previous (Swipe Left)",
    play_title: "Toggle Play (Open Hand/Fist)",
    next_title: "Next (Swipe Right)",
    repeat: "Repeat",
    upload_mp3: "Upload MP3",
    visual_settings: "VISUAL SETTINGS",
    particles_count: "Particles Count: ",
    bg_brightness: "BG Brightness: ",
    artwork_brightness: "Artwork Brightness: ",
    particle_speed: "Particle Speed: ",
    particle_bounce: "Particle Bounce: ",
    replay_tutorial: "Replay Gesture Guide",
    gesture_preview: "GESTURE PREVIEW",
    toggle_webcam: "Toggle Webcam Overlay",
    camera_off: "Camera Off",
    skip_guide: "SKIP GUIDE",
    audio_gallery_sub: "3D AUDIO GALLERY",
    welcome_desc: "Welcome to Cosmic Vinyl! A 3D audio space controlled by hand gestures.<br>We recommend using a camera to experience finger-guided flying interactions.",
    enable_camera_gestures: "ENABLE CAMERA GESTURES",
    browse_with_mouse: "BROWSE WITH MOUSE & KEYS",
    slide1_title: "Step 1: Open Palm & Slide",
    slide1_text: "<strong>Spread your fingers</strong> and wave your hand left or right in front of the camera to scroll and browse through the 3D vinyl gallery.",
    slide2_title: "Step 2: Hover to Focus",
    slide2_text: "<strong>Keep your hand still</strong> on a specific record. It will zoom in closer and show you the song name and details.",
    slide3_title: "Step 3: Make a Fist to Play",
    slide3_text: "Once focused, <strong>clench your hand into a fist and hold still for 2 seconds</strong>. Wait for the circular ring to load, and the record will fly into the turntable!",
    slide4_title: "Step 4: Open Palm to Return",
    slide4_text: "While music is playing, <strong>spread your fingers</strong> again to fly the record back to the wall and resume browsing other tracks.",
    start_gesture_mode: "START GESTURE MODE",
    hold_still: "HOLD STILL TO PLAY",
    
    // Status text (dynamic)
    init_gestures: "Initializing gestures...",
    camera_requesting: "Requesting camera...",
    camera_active: "Camera active",
    mouse_mode_status: "Mouse mode",
    audio_ready: "Audio ready",
    playing: "Playing",
    paused: "Paused",
    close: "CLOSE",
    close_guide: "CLOSE GUIDE"
  },
  zh: {
    library: "媒体库",
    toggle_library: "展开/收起侧边栏",
    switch_view: "切换视图",
    grid_view: "网格视图",
    carousel_view: "旋转视图",
    gesture_guide: "手势指南",
    gesture_guide_title: "手势指南",
    mouse_mode: "鼠标模式",
    mouse_mode_title: "鼠标模式",
    gesture_mode: "手势模式",
    gesture_mode_title: "手势模式",
    search_placeholder: "你想播放什么歌曲？",
    your_library: "您的媒体库",
    add_custom_song: "添加自定义歌曲",
    collapse_library: "收起媒体库",
    all: "全部",
    gestures: "手势",
    search_online: "在线搜索",
    custom_manual: "手动自定义",
    search_songs: "搜索歌曲...",
    song_title: "歌曲名称",
    artist_name: "歌手名字",
    add_to_gallery: "添加到画廊",
    close_panel: "关闭面板",
    open_palm: "张开五指",
    open_palm_desc: "快速左右滑动以浏览专辑",
    digit_one: "伸出食指",
    digit_one_desc: "慢速左右滑动以浏览专辑",
    make_fist: "握紧拳头",
    make_fist_desc: "放大当前专辑（保持静止 3 秒以播放）",
    album: "专辑",
    toggle_play: "播放/暂停",
    shuffle: "随机播放",
    save_to_library: "保存到媒体库",
    more_options: "更多选项",
    prev_title: "上一首 (向左滑动)",
    play_title: "播放/暂停 (张开手掌/握拳)",
    next_title: "下一首 (向右滑动)",
    repeat: "单曲循环",
    upload_mp3: "上传 MP3",
    visual_settings: "视觉设置",
    particles_count: "粒子数量：",
    bg_brightness: "背景亮度：",
    artwork_brightness: "专辑亮度：",
    particle_speed: "粒子速度：",
    particle_bounce: "粒子跳动：",
    replay_tutorial: "重新查看新手引导",
    gesture_preview: "手势预览",
    toggle_webcam: "切换摄像头画面",
    camera_off: "摄像头已关闭",
    skip_guide: "跳过引导",
    audio_gallery_sub: "3D 音乐画廊",
    welcome_desc: "欢迎来到 Cosmic Vinyl！这是一个通过手势控制的 3D 音乐空间。<br>我们推荐您开启摄像头来体验手指引导的飞行交互效果。",
    enable_camera_gestures: "启用摄像头手势",
    browse_with_mouse: "使用鼠标与键盘浏览",
    slide1_title: "第一步：张开手掌并滑动",
    slide1_text: "<strong>张开五指</strong>，在摄像头前向左或向右挥手，以滚动浏览 3D 黑胶画廊。",
    slide2_title: "第二步：悬停以聚焦",
    slide2_text: "<strong>将手停在某张唱片上</strong>保持不动，它会放大并显示歌曲名称和详细信息。",
    slide3_title: "第三步：握紧拳头以播放",
    slide3_text: "聚焦后，<strong>攥紧拳头并保持 2 秒钟</strong>。等待进度圈加载完毕，唱片就会飞入唱机开始播放！",
    slide4_title: "第四步：张开手掌以返回",
    slide4_text: "在音乐播放时，<strong>再次张开五指</strong>，唱片便会飞回墙上，您可以继续浏览其他曲目。",
    start_gesture_mode: "开启手势模式",
    hold_still: "保持静止以播放",
    
    // Status text (dynamic)
    init_gestures: "正在初始化手势...",
    camera_requesting: "正在请求摄像头...",
    camera_active: "摄像头已就绪",
    mouse_mode_status: "鼠标模式",
    audio_ready: "音频已就绪",
    playing: "正在播放",
    paused: "已暂停",
    close: "关闭",
    close_guide: "关闭引导"
  }
};

class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('cosmic_vinyl_lang') || 'en';
  }

  getLanguage() {
    return this.currentLang;
  }

  setLanguage(lang) {
    if (lang === 'en' || lang === 'zh') {
      this.currentLang = lang;
      localStorage.setItem('cosmic_vinyl_lang', lang);
      this.updateDOM();
      
      // Dispatch custom event so other modules (main, audio, gestures) can react if needed
      window.dispatchEvent(new CustomEvent('languagechanged', { detail: { language: lang } }));
    }
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang === 'en' ? 'zh' : 'en');
  }

  t(key) {
    const langDict = translations[this.currentLang] || translations['en'];
    return langDict[key] || key;
  }

  updateDOM() {
    // 1. Text translations (data-i18n)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.innerHTML = this.t(key);
    });

    // 2. Title translations (data-i18n-title)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.setAttribute('title', this.t(key));
    });

    // 3. Placeholder translations (data-i18n-placeholder)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', this.t(key));
    });

    // 4. Update the language button text if exists
    const langBtnText = document.getElementById('lang-toggle-text');
    if (langBtnText) {
      langBtnText.textContent = this.currentLang === 'en' ? 'EN' : '中文';
    }
    const onboardingLangBtnText = document.getElementById('lang-toggle-onboarding-text');
    if (onboardingLangBtnText) {
      onboardingLangBtnText.textContent = this.currentLang === 'en' ? 'EN' : '中文';
    }

    // 5. Update slider label prefixes dynamically (we'll also let main.js handle slider values updates on language switch)
    const valStars = document.getElementById('stars-val');
    const sliderStars = document.getElementById('setting-stars');
    if (valStars && sliderStars) {
      // Just re-display label with correct lang
      const starsLabel = document.querySelector('[for="setting-stars"]');
      if (starsLabel) starsLabel.innerHTML = `${this.t('particles_count')}<span id="stars-val">${sliderStars.value}</span>`;
    }

    const valBrightness = document.getElementById('brightness-val');
    const sliderBrightness = document.getElementById('setting-brightness');
    if (valBrightness && sliderBrightness) {
      const label = document.querySelector('[for="setting-brightness"]');
      if (label) label.innerHTML = `${this.t('bg_brightness')}<span id="brightness-val">${sliderBrightness.value}%</span>`;
    }

    const valSceneBrightness = document.getElementById('scene-brightness-val');
    const sliderSceneBrightness = document.getElementById('setting-scene-brightness');
    if (valSceneBrightness && sliderSceneBrightness) {
      const label = document.querySelector('[for="setting-scene-brightness"]');
      if (label) label.innerHTML = `${this.t('artwork_brightness')}<span id="scene-brightness-val">${(sliderSceneBrightness.value / 10.0).toFixed(1)}x</span>`;
    }

    const valSpeed = document.getElementById('speed-val');
    const sliderSpeed = document.getElementById('setting-speed');
    if (valSpeed && sliderSpeed) {
      const label = document.querySelector('[for="setting-speed"]');
      if (label) label.innerHTML = `${this.t('particle_speed')}<span id="speed-val">${(sliderSpeed.value / 100.0).toFixed(1)}x</span>`;
    }

    const valBounce = document.getElementById('bounce-val');
    const sliderBounce = document.getElementById('setting-bounce');
    if (valBounce && sliderBounce) {
      const label = document.querySelector('[for="setting-bounce"]');
      if (label) label.innerHTML = `${this.t('particle_bounce')}<span id="bounce-val">${(sliderBounce.value / 100.0).toFixed(1)}x</span>`;
    }
  }
}

export const lang = new LanguageManager();
window.lang = lang; // Global reference for easy access
