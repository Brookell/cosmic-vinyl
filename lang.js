// Cosmic Vinyl - Language Manager for English / Chinese toggling

const translations = {
  en: {
    library: "Library",
    toggle_library: "Toggle Sidebar",
    switch_view: "Switch View",
    grid_view: "Grid View",
    carousel_view: "Carousel View",
    device_pc: "Desktop View",
    device_mobile: "Mobile View",
    toggle_device: "Toggle Device Mode",
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
    music_space: "Music Space",
    switch_space_title: "Switch Music Space",
    new_space_title: "New Music Space",
    new_space_prompt: "Name your own music space",
    new_space_desc: "Create a private corner for the songs you choose.",
    new_space_placeholder: "My Music Space",
    create_space_action: "Create Space",
    cancel: "Cancel",
    default_space_name: "Public Cosmic Space",
    personal_space_name: "My Music Space",
    space_created: "Music space created",
    library_needs_one_track: "Keep at least one track in this space",
    save_to_my_space: "Add to My Space",
    saved_to_my_space: "Saved to your music space",
    save_prompt_title: "Make this yours",
    save_prompt_body: "Click the + button to add this track to your own music space.",
    save_prompt_action: "Add to My Space",
    loading_albums: "Loading your music universe...",
    auth_kicker: "SAVE YOUR SPACE",
    auth_title: "Create your music space",
    auth_desc: "Sign up to save favorite songs into your own Cosmic Vinyl library.",
    auth_email_placeholder: "Email",
    auth_password_placeholder: "Password",
    auth_confirm_password_placeholder: "Confirm password",
    auth_show_password: "Show password",
    auth_hide_password: "Hide password",
    auth_password_mismatch: "The two passwords do not match.",
    auth_space_name_placeholder: "Your Music Space",
    auth_signup: "Create account and save",
    auth_login: "I already have an account",
    auth_login_submit: "Sign in",
    auth_switch_signup: "Create a new account",
    auth_entry: "Sign in to save",
    auth_signed_in: "Signed in",
    auth_synced: "Space synced",
    auth_account: "Account status",
    auth_sign_out: "Sign out",
    auth_signed_out: "Signed out",
    auth_entry_message: "Sign in first. Then your music space will be created and synced.",
    auth_required_message: "Sign in first. Then this song will be added and played in your music space.",
    auth_signing_in: "Signing you in...",
    auth_check_email: "Check your email to confirm your account, then return here to save.",
    auth_saved: "Saved to your space",
    auth_failed: "Could not sign in. Please check your email and password.",
    try_add_favorite: "This is the public space. Click the + button at the lower right to add this song to your space.",
    all: "All",
    gestures: "Gestures",
    search_online: "Search Online",
    search_songs: "Search songs...",
    close_panel: "Close Panel",
    open_palm: "OPEN PALM",
    open_palm_desc: "Fast slide left/right to view albums",
    digit_one: "DIGIT ONE",
    digit_one_desc: "Slow slide left/right to view albums",
    make_fist: "MAKE A FIST",
    make_fist_desc: "Zoom current album (Hold still 1s to play)",
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
    welcome_desc_line1: "Welcome to Cosmic Vinyl!",
    welcome_desc_line2: "A 3D audio space controlled by hand gestures.",
    welcome_desc_line3: "We recommend using a camera to experience finger-guided flying interactions.",
    bg_music_toggle: "BACKGROUND MUSIC",
    enabled_yes: "Yes",
    enabled_no: "No",
    clear_all_songs: "Clear Library",
    clear_all_confirm: "Are you sure you want to clear your library? This will delete all tracks.",
    empty_library_title: "Empty Library",
    empty_library_desc: "Click + to add songs",
    enable_camera_gestures: "ENABLE CAMERA GESTURES",
    browse_with_mouse: "BROWSE WITH MOUSE & KEYS",
    choose_guide_mode: "Choose a Guide Mode",
    camera_mode_guide: "CAMERA GESTURE GUIDE",
    mouse_keyboard_guide: "MOUSE & KEYBOARD GUIDE",
    slide1_title: "Step 1: Open Palm & Slide",
    slide1_text: "<strong>Spread your fingers</strong> and wave your hand left or right in front of the camera to scroll and browse through the 3D vinyl gallery.",
    slide2_title: "Step 2: Hover to Focus",
    slide2_text: "<strong>Keep your hand still</strong> on a specific record. It will zoom in closer and show you the song name and details.",
    slide3_title: "Step 3: Make a Fist to Play",
    slide3_text: "Once focused, <strong>clench your hand into a fist and hold still for 1 second</strong>. Wait for the circular ring to load, and the record will fly into the turntable!",
    slide4_title: "Step 4: Open Palm to Return",
    slide4_text: "While music is playing, <strong>spread your fingers</strong> again to fly the record back to the wall and resume browsing other tracks.",
    start_gesture_mode: "START GESTURE MODE",
    start_mouse_mode: "START MOUSE MODE",
    hold_still: "HOLD STILL TO PLAY",
    hold_to_play: "HOLD TO PLAY",
    mouse_slide1_title: "Step 1: Drag or Use Keys",
    mouse_slide1_text: "<strong>Drag your mouse left/right</strong> or press <strong>Left/Right arrow keys (or A/D)</strong> on your keyboard to scroll through the vinyl gallery.",
    mouse_slide2_title: "Step 2: Click to Focus",
    mouse_slide2_text: "<strong>Click on a specific record</strong> to zoom in closer and show you the song name and details.",
    mouse_slide3_title: "Step 3: Long Press to Play",
    mouse_slide3_text: "Once focused, <strong>long press the mouse button on the album card for 1 second</strong>. Wait for the circular ring to load, and the record will fly into the turntable!",
    mouse_slide4_title: "Step 4: Click Empty Space to Return",
    mouse_slide4_text: "While music is playing, <strong>click on any empty background space</strong> (or press the <strong>Escape key</strong>) to return the record to the wall and resume browsing.",
    
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
    device_pc: "电脑视角",
    device_mobile: "手机模拟",
    toggle_device: "切换视图模式",
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
    music_space: "音乐空间",
    switch_space_title: "切换音乐空间",
    new_space_title: "新建音乐空间",
    new_space_prompt: "给你自己的音乐空间命名",
    new_space_desc: "为你选择的歌曲创建一个只属于自己的空间。",
    new_space_placeholder: "我的音乐空间",
    create_space_action: "创建空间",
    cancel: "取消",
    default_space_name: "公共宇宙空间",
    personal_space_name: "我的音乐空间",
    space_created: "音乐空间已创建",
    library_needs_one_track: "当前空间至少保留一首歌",
    save_to_my_space: "加入我的空间",
    saved_to_my_space: "已加入你的音乐空间",
    save_prompt_title: "把这首歌带走",
    save_prompt_body: "点击右下角的 +，把这首歌加入你的音乐空间。",
    save_prompt_action: "加入我的空间",
    loading_albums: "音乐世界加载中...",
    auth_kicker: "保存你的空间",
    auth_title: "创建你的音乐空间",
    auth_desc: "注册后即可把喜欢的歌曲保存到自己的 Cosmic Vinyl 资料库。",
    auth_email_placeholder: "邮箱",
    auth_password_placeholder: "密码",
    auth_confirm_password_placeholder: "确认密码",
    auth_show_password: "显示密码",
    auth_hide_password: "隐藏密码",
    auth_password_mismatch: "两次输入的密码不一致。",
    auth_space_name_placeholder: "你的音乐空间名称",
    auth_signup: "注册并保存",
    auth_login: "我已有账号",
    auth_login_submit: "登录",
    auth_switch_signup: "注册新账号",
    auth_entry: "登录保存空间",
    auth_signed_in: "已登录",
    auth_synced: "空间已同步",
    auth_account: "账户状态",
    auth_sign_out: "退出登录",
    auth_signed_out: "已退出登录",
    auth_entry_message: "先登录/注册，然后会自动创建并同步你的音乐空间。",
    auth_required_message: "先登录/注册，然后这首歌会自动加入你的空间并播放。",
    auth_signing_in: "正在登录...",
    auth_check_email: "请先去邮箱确认账号，然后回到这里继续保存。",
    auth_saved: "已保存到你的空间",
    auth_failed: "登录失败，请检查邮箱和密码。",
    try_add_favorite: "这里是公共空间。点击右下角的 +，可以把这首歌加入你的空间。",
    all: "全部",
    gestures: "手势",
    search_online: "在线搜索",
    search_songs: "搜索歌曲...",
    close_panel: "关闭面板",
    open_palm: "张开五指",
    open_palm_desc: "快速左右滑动以浏览专辑",
    digit_one: "伸出食指",
    digit_one_desc: "慢速左右滑动以浏览专辑",
    make_fist: "握紧拳头",
    make_fist_desc: "放大当前专辑（保持静止 1 秒以播放）",
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
    welcome_desc_line1: "欢迎来到 Cosmic Vinyl！",
    welcome_desc_line2: "这是一个通过手势控制的 3D 音乐空间。",
    welcome_desc_line3: "我们推荐您开启摄像头来体验手指引导的飞行交互效果。",
    bg_music_toggle: "背景音乐",
    enabled_yes: "有",
    enabled_no: "无",
    clear_all_songs: "清空媒体库",
    clear_all_confirm: "您确定要清空媒体库吗？这将会删除所有曲目。",
    empty_library_title: "空媒体库",
    empty_library_desc: "点击 + 按钮添加歌曲",
    enable_camera_gestures: "启用摄像头手势",
    browse_with_mouse: "使用鼠标与键盘浏览",
    choose_guide_mode: "选择教学模式",
    camera_mode_guide: "摄像头手势教学",
    mouse_keyboard_guide: "鼠标键盘教学",
    slide1_title: "第一步：张开手掌并滑动",
    slide1_text: "<strong>张开五指</strong>，在摄像头前向左或向右挥手，以滚动浏览 3D 黑胶画廊。",
    slide2_title: "第二步：悬停以聚焦",
    slide2_text: "<strong>将手停在某张唱片上</strong>保持不动，它会放大并显示歌曲名称和详细信息。",
    slide3_title: "第三步：握紧拳头以播放",
    slide3_text: "聚焦后，<strong>攥紧拳头并保持 1 秒钟</strong>。等待进度圈加载完毕，唱片就会飞入唱机开始播放！",
    slide4_title: "第四步：张开手掌以返回",
    slide4_text: "在音乐播放时，<strong>再次张开五指</strong>，唱片便会飞回墙上，您可以继续浏览其他曲目。",
    start_gesture_mode: "开启手势模式",
    start_mouse_mode: "开启鼠标模式",
    hold_still: "保持静止以播放",
    hold_to_play: "长按以播放",
    mouse_slide1_title: "第一步：拖拽或使用按键",
    mouse_slide1_text: "<strong>按住鼠标左右拖拽</strong>，或按键盘上的<strong>左右方向键（或 A/D 键）</strong>，即可滚动浏览 3D 黑胶画廊。",
    mouse_slide2_title: "第二步：点击以聚焦",
    mouse_slide2_text: "<strong>点击某张唱片</strong>，唱片会飞向屏幕中心放大展示，并显示歌曲名称和详细信息。",
    mouse_slide3_title: "第三步：长按以播放",
    mouse_slide3_text: "聚焦后，<strong>在唱片上长按鼠标左键保持 1 秒钟</strong>。等待进度圈加载完毕，唱片就会飞入唱机开始播放！",
    mouse_slide4_title: "第四步：点击空白处返回",
    mouse_slide4_text: "唱片播放时，<strong>点击周围的空白区域</strong>（或按下键盘的 <strong>Esc 键</strong>），唱片便会飞回墙上，您可以继续浏览。",
    
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
    this.currentLang = localStorage.getItem('cosmic_vinyl_lang') || 'zh';
  }

  getLanguage() {
    return this.currentLang;
  }

  setLanguage(lang) {
    console.log("LanguageManager: setLanguage called with:", lang);
    if (lang === 'en' || lang === 'zh') {
      this.currentLang = lang;
      localStorage.setItem('cosmic_vinyl_lang', lang);
      this.updateDOM();
      
      // Dispatch custom event so other modules (main, audio, gestures) can react if needed
      window.dispatchEvent(new CustomEvent('languagechanged', { detail: { language: lang } }));
    }
  }

  toggleLanguage() {
    console.log("LanguageManager: toggling from", this.currentLang);
    this.setLanguage(this.currentLang === 'en' ? 'zh' : 'en');
  }

  t(key) {
    const langDict = translations[this.currentLang] || translations['en'];
    return langDict[key] || key;
  }

  updateDOM() {
    console.log("LanguageManager: updating DOM for", this.currentLang);
    try {
      document.documentElement.lang = this.currentLang === 'zh' ? 'zh-CN' : 'en';
      document.documentElement.dataset.lang = this.currentLang;

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
    } catch (e) {
      console.error("LanguageManager: Error updating DOM:", e);
    }
  }
}

export const lang = new LanguageManager();
window.lang = lang; // Global reference for easy access
