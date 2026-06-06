// Audio engine handling Web Audio API, MP3 loading, and the built-in ambient synthesizer.
import { lang } from './lang.js';

// Simple IndexedDB wrapper for storing custom audio files
const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open('CosmicVinylDB', 1);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('custom_audio')) {
      db.createObjectStore('custom_audio', { keyPath: 'id' });
    }
  };
  request.onsuccess = (e) => resolve(e.target.result);
  request.onerror = (e) => reject(e.target.error);
});

async function saveAudioFile(id, fileBlob) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_audio', 'readwrite');
    const store = tx.objectStore('custom_audio');
    const request = store.put({ id, fileBlob });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getAudioFile(id) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_audio', 'readonly');
    const store = tx.objectStore('custom_audio');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result ? request.result.fileBlob : null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteAudioFile(id) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_audio', 'readwrite');
    const store = tx.objectStore('custom_audio');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.gainNode = null;
    this.frequencyData = null;
    
    // Playback state
    this.isPlaying = false;
    this.isSynth = false; // No background synth by default
    this.volume = 0.7;
    this.loadedPreviewUrl = null; // Stores current playing iTunes preview URL
    
    // MP3 Upload State
    this.audioSource = null; // BufferSourceNode for custom MP3s
    this.audioBuffer = null; // Decoded audio buffer
    this.startTime = 0;      // AudioContext time when playback started
    this.pauseOffset = 0;    // Time offset where audio was paused
    
    // Generative Synthesizer Nodes
    this.synthInterval = null;
    this.synthScheduleTime = 0;
    this.synthOscillators = [];
    this.synthFilter = null;
    this.synthLfo = null;
    // Listen to language changes
    window.addEventListener('languagechanged', () => {
      this.updateStatusUI();
    });
  }

  updateStatusUI() {
    const audioStatus = document.getElementById('audio-status');
    if (audioStatus) {
      if (this.isPlaying) {
        audioStatus.innerHTML = `<span class="dot green"></span><span class="status-text">${lang.t('playing')}</span>`;
      } else {
        audioStatus.innerHTML = `<span class="dot gray"></span><span class="status-text">${lang.t('paused')}</span>`;
      }
    }
  }
    const defaultTracks = [
      {
        id: "green_light",
        name: "Green Light",
        artist: "Lorde",
        album: "Melodrama",
        duration: "0:45",
        iTunesQuery: "Green Light Lorde",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/52/98/aa/5298aa77-f5d0-e6b7-7f24-5d06409abfc8/mzaf_4826261660034311199.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/8d/0d/15/8d0d1532-493b-52ec-6a29-a239ced6931b/17UMGIM81023.rgb.jpg/500x500bb.jpg"
      },
      {
        id: "too_smart",
        name: "Too Smart",
        artist: "Cheer Chen",
        album: "Groupies",
        duration: "0:45",
        iTunesQuery: "Too Smart Cheer Chen",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/ad/6a/e3/ad6ae3e9-cdf8-2906-279a-6ec15373a145/mzaf_1471458383288659685.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/3c/a2/21/3ca22123-14d6-57f4-9e52-aa4573a05b07/mzm.clkcarof.jpg/500x500bb.jpg"
      },
      {
        id: "golden",
        name: "Golden",
        artist: "Enno Cheng",
        album: "Neptune",
        duration: "0:45",
        iTunesQuery: "Golden Enno Cheng",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/57/61/8c/57618c20-91f6-76b3-61e5-11155a439e76/mzaf_5332311319435229892.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/bb/f4/81/bbf48100-ee5e-7bda-4540-b6eb261adc25/197188570828.jpg/500x500bb.jpg"
      },
      {
        id: "time",
        name: "Time",
        artist: "Pink Floyd",
        album: "The Dark Side of the Moon",
        duration: "0:45",
        iTunesQuery: "Time Pink Floyd",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/da/8b/ed/da8bed67-d37d-eb79-d045-ab9b2770d945/mzaf_17679948615611584950.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3e/76/b0/3e76b0e3-762b-2286-a019-8afb19cee541/886445635829.jpg/500x500bb.jpg"
      },
      {
        id: "lemon_brandy",
        name: "Lemon Brandy",
        artist: "Railway Suicide Train",
        album: "Lemon Brandy",
        duration: "0:45",
        iTunesQuery: "Lemon Brandy Railway Suicide Train",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/1c/c4/70/1cc47015-5a20-c2f8-d5f8-0f02522f4d3c/mzaf_6565775889083249459.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/29/83/55/298355fb-9db7-8737-79b4-b170f22ef9cc/coverA.jpg/500x500bb.jpg"
      },
      {
        id: "color_blind",
        name: "色盲 (feat. 徐佳莹)",
        artist: "Jude Chiu",
        album: "Color Blind",
        duration: "0:45",
        iTunesQuery: "色盲 Jude Chiu 徐佳莹",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/aa/3f/0d/aa3f0d4e-466e-2597-21c6-3ac24d954575/mzaf_4921868070570252672.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/c4/39/11c439d4-ad2b-669f-dd67-bab44d143fe5/qiude.jpg/500x500bb.jpg"
      },
      {
        id: "missing_you",
        name: "Missing You",
        artist: "Naoko Gushima",
        album: "mellow medicine",
        duration: "0:45",
        iTunesQuery: "Missing You Naoko Gushima",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview128/v4/80/9a/99/809a9993-803b-8462-07f4-14877092c17d/mzaf_1627179278269340934.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/da/ab/25/daab2574-696e-bdba-eb7a-191e34b4212c/00044002237026.rgb.jpg/500x500bb.jpg"
      },
      {
        id: "rainy_season",
        name: "Rainy Season",
        artist: "A-Yue Chang",
        album: "Useless Guy",
        duration: "0:45",
        iTunesQuery: "Rainy Season A-Yue Chang",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/59/13/64/591364ad-638e-4804-29b9-98edb42f8eb0/mzaf_14265806449308379342.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/5a/18/a1/5a18a13a-341a-cae3-bdac-1be4c4182e2a/4710149716798_cover.jpg/500x500bb.jpg"
      },
      {
        id: "yushi",
        name: "于是",
        artist: "Ciacia Ho",
        album: "于是",
        duration: "0:45",
        iTunesQuery: "于是 Ciacia Ho",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a7/93/92/a793921e-14c6-87fe-a2c2-68df2f46b401/mzaf_10401613482887924645.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/dc/27/05/dc270501-5c56-4c05-db20-d299475e4b43/886448144977.jpg/500x500bb.jpg"
      },
      {
        id: "ophelia",
        name: "Ophelia",
        artist: "Waa Wei",
        album: "Ophelia",
        duration: "0:45",
        iTunesQuery: "Ophelia Waa Wei",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/0e/05/d3/0e05d3d8-1682-a7b1-b2e7-5633f54eee59/mzaf_10043319249557828493.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/99/66/f7/9966f772-0254-0712-7e38-c83dfaea2603/886448109013.jpg/500x500bb.jpg"
      },
      {
        id: "dont_melt",
        name: "Don't Melt Into the Air",
        artist: "Zitan Qi",
        album: "Don't Melt Into the Air",
        duration: "0:45",
        iTunesQuery: "Don't Melt Into the Air Zitan Qi",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/7f/51/33/7f5133ff-27cc-d5b6-5895-e23809d6d396/mzaf_11469122932997155511.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e4/09/b5/e409b5f9-7b24-5698-ba90-cc4bc0365cf2/193017193251.jpg/500x500bb.jpg"
      },
      {
        id: "left_side_heart",
        name: "心脏的左边 (feat. moon tang)",
        artist: "The Crane",
        album: "心脏的左边",
        duration: "0:45",
        iTunesQuery: "心脏的左边 The Crane moon tang",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b1/e5/ba/b1e5ba1c-1bb5-8f9b-be85-73ddabafd849/mzaf_17482756169934769393.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2e/ff/72/2eff72b4-4b0c-ed84-2783-969a9e4bf726/193017188615.jpg/500x500bb.jpg"
      },
      {
        id: "courage",
        name: "Courage",
        artist: "A-Yue Chang",
        album: "Courage",
        duration: "0:45",
        iTunesQuery: "Courage A-Yue Chang",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/37/18/8d/37188de0-95d8-9e4a-816a-13eda64c2280/mzaf_10190854099507602739.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Features4/v4/4c/1a/81/4c1a81cf-f582-37f8-d5ea-0bd8f5d00193/dj.rwfdgdyv.jpg/500x500bb.jpg"
      },
      {
        id: "what_is_love",
        name: "What is Love?",
        artist: "TWICE",
        album: "What is Love?",
        duration: "0:45",
        iTunesQuery: "What is Love TWICE",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/c9/67/30/c9673025-135c-e508-571b-122c268d7a28/mzaf_11330238921094968350.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7e/41/69/7e4169e8-8358-27ff-66b4-1564ec800abd/00602508875137_Cover.jpg/500x500bb.jpg"
      },
      {
        id: "sleepless_night",
        name: "Sleepless Night",
        artist: "Crowd Lu",
        album: "Sleepless Night",
        duration: "0:45",
        iTunesQuery: "Sleepless Night Crowd Lu",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/3a/ec/2e/3aec2ee7-0124-6a19-68ca-871ae6a73621/mzaf_18189462829470518139.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ee/85/8f/ee858f39-7c88-5390-4061-6f2de8c43279/4711508138732.jpg/500x500bb.jpg"
      },
      {
        id: "silver_lining",
        name: "Silver Lining",
        artist: "Pei-Yu Hung",
        album: "Silver Lining",
        duration: "0:45",
        iTunesQuery: "Silver Lining Pei-Yu Hung",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d5/5c/cb/d55ccba4-0105-a695-9b5d-06f70e768773/mzaf_1058617834848392174.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/fc/7a/b9/fc7ab9d8-5141-0740-2c8c-eb6ae49a0b2f/cover.jpg/500x500bb.jpg"
      },
      {
        id: "yesterday",
        name: "我又再度依恋上昨天",
        artist: "Tizzy Bac",
        album: "我又再度依恋上昨天",
        duration: "0:45",
        iTunesQuery: "我又再度依恋上昨天 Tizzy Bac",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/00/8c/e4/008ce479-ffbb-09d5-7376-1e68435fc6ae/mzaf_17961656815028168853.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/d4/86/a9/d486a945-255d-f43a-d412-3366fcabc7bb/4711479222492.jpg/500x500bb.jpg"
      },
      {
        id: "the_moment",
        name: "The Moment",
        artist: "Yanzi Sun",
        album: "The Moment",
        duration: "0:45",
        iTunesQuery: "The Moment Yanzi Sun",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/90/24/ad/9024ad60-00f5-4175-891b-52404f369b44/mzaf_3164352300553526261.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/8a/91/d7/8a91d731-cdb1-01b5-17a9-c88cf66d6e01/5050466855725.jpg/500x500bb.jpg"
      },
      {
        id: "human_cannonball",
        name: "空中飞人",
        artist: "Leah Dou",
        album: "空中飞人",
        duration: "0:45",
        iTunesQuery: "空中飞人 Leah Dou",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8a/88/82/8a888298-c8bf-cbb7-3b10-fe3a7e24d5cd/mzaf_738798688171478117.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a9/cd/9b/a9cd9b88-f4e3-674c-91fc-275fcfd7adec/704537426004.jpg/500x500bb.jpg"
      },
      {
        id: "god_bless_me",
        name: "God Bless Me",
        artist: "Dou Wei",
        album: "God Bless Me",
        duration: "0:45",
        iTunesQuery: "God Bless Me Dou Wei",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/42/50/36/425036a1-e96b-72e8-e0ba-4e0ad3520873/mzaf_1203450350069493151.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Features115/v4/f9/ac/98/f9ac98e4-956f-c013-e703-8ae5b7cdb880/dj.flkwjbql.jpg/500x500bb.jpg"
      },
      {
        id: "terminal",
        name: "你在终点等我",
        artist: "Faye Wong",
        album: "你在终点等我",
        duration: "0:45",
        iTunesQuery: "你在终点等我 Faye Wong",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/10/1b/ca/101bcaeb-7466-ac11-1735-86aea7c6e7c9/mzaf_5845813317564643417.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/bc/22/76/bc2276b1-c066-158a-97df-a470b43e5370/artist_photo.jpg/500x500bb.jpg"
      },
      {
        id: "expiration_date",
        name: "赏味期限",
        artist: "Ze Hwang",
        album: "赏味期限",
        duration: "0:45",
        iTunesQuery: "赏味期限 Ze Hwang",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/a3/99/66/a3996694-1f30-e314-7769-a7a435f1ef8c/mzaf_4643748272262689215.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/d8/cb/8a/d8cb8aa1-ca8e-f773-21cd-974b75730dbd/4711499288386.jpg/500x500bb.jpg"
      },
      {
        id: "yurei",
        name: "Yurei",
        artist: "betcover!!",
        album: "Yurei",
        duration: "0:45",
        iTunesQuery: "Yurei betcover",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/0f/a5/e3/0fa5e322-1a97-e038-7d13-3add2ac2a705/mzaf_3103309569854259391.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/92/ea/0e/92ea0e8a-b943-3613-ef4a-21ae45317a90/bigup13243845.jpg/500x500bb.jpg"
      },
      {
        id: "mars",
        name: "昨夜我飞向遥远的火星",
        artist: "Soundtoy",
        album: "昨夜我飞向遥远的火星",
        duration: "0:45",
        iTunesQuery: "昨夜我飞向遥远的火星 Soundtoy",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/0b/0c/db/0b0cdb60-d419-767c-0c6e-99eafe0db085/mzaf_2583789658619276796.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/45/eb/0e/45eb0ea1-8710-35dc-1357-6324bf08ee68/cover.jpg/500x500bb.jpg"
      },
      {
        id: "scary_house",
        name: "恐怖的房子",
        artist: "Supermarket",
        album: "恐怖的房子",
        duration: "0:45",
        iTunesQuery: "恐怖的房子 Supermarket",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7b/40/a9/7b40a99d-86a5-58df-da24-9dba4dfd73a8/mzaf_14530215461776773120.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/58/c9/d1/58c9d18b-cc0f-a0ef-8d21-02cf854d84b1/25UMGIM42239.rgb.jpg/500x500bb.jpg"
      },
      {
        id: "lonely_god",
        name: "Lonely God",
        artist: "Wang Wen",
        album: "Lonely God",
        duration: "0:45",
        iTunesQuery: "Lonely God Wang Wen",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d7/51/51/d751518b-4f20-ce7b-415f-a8a2decc94af/mzaf_4840872988886957769.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c3/a9/9f/c3a99fe5-8887-2e60-1653-9e134155df79/198588367667.jpg/500x500bb.jpg"
      },
      {
        id: "freckles",
        name: "雀斑",
        artist: "Ellen Loo",
        album: "雀斑",
        duration: "0:45",
        iTunesQuery: "雀斑 Ellen Loo",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/16/87/19/1687197f-aefa-f8df-b4b1-df0d4e07a4b9/mzaf_14938934588686827591.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/6e/8e/cb/6e8ecb98-dc3f-9767-700c-2e838acfa509/825646271245.jpg/500x500bb.jpg"
      },
      {
        id: "die_for_you",
        name: "Die For You",
        artist: "Joji",
        album: "SMITHEREENS",
        duration: "0:45",
        iTunesQuery: "Die For You Joji",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/47/4e/31/474e31a5-5d0f-5e48-868f-60487004c113/mzaf_1175503825665906253.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d0/2a/43/d02a433a-3ab8-9a94-b07d-1dc599b64966/93624864387.jpg/500x500bb.jpg"
      },
      {
        id: "rose_colored",
        name: "玫瑰色的你 (Rose-Colored)",
        artist: "Deserts Chang",
        album: "玫瑰色的你",
        duration: "0:45",
        iTunesQuery: "玫瑰色的你 Deserts Chang",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/52/10/78/5210788e-aa09-652a-421b-d119e4fc08ed/mzaf_16247712476565871072.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/86/1e/44/861e443d-36e4-cb28-2182-6c5784e87276/886443553392.jpg/500x500bb.jpg"
      },
      {
        id: "blue_apple",
        name: "Blue Apple",
        artist: "AK Akemi Kakihara",
        album: "Blue Apple",
        duration: "0:45",
        iTunesQuery: "Blue Apple AK Akemi Kakihara",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/b8/d4/61/b8d4616a-95d5-b230-cc51-6dc17080416c/mzaf_13860280547001755412.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/be/20/e6/be20e6b4-0fd2-b253-7372-78110caf18a9/19UMGIM54406.rgb.jpg/500x500bb.jpg"
      },
      {
        id: "dont_mind",
        name: "Don't Mind",
        artist: "The Crane",
        album: "Don't Mind",
        duration: "0:45",
        iTunesQuery: "Don't Mind The Crane",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8b/f1/c4/8bf1c4e5-af1d-f9cf-fbaf-f4d59ee7f56e/mzaf_12290682609628206320.plus.aac.p.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/fb/2c/7d/fb2c7d94-905f-2674-3b42-2e1af2b4a63a/193017090925.jpg/500x500bb.jpg"
      }
    ];

    // Track List (Virtual Carousel tracks) - Loaded from localStorage or defaults
    const savedTracks = localStorage.getItem('cosmic_vinyl_tracks_v2');
    if (savedTracks) {
      try {
        const parsed = JSON.parse(savedTracks);
        // Map of default tracks for quick access
        const defaultMap = new Map(defaultTracks.map(t => [t.id, t]));
        
        // Build new tracks list preserving user custom tracks, but updating default tracks
        const mergedTracks = [];
        const seenIds = new Set();
        
        for (const track of parsed) {
          if (defaultMap.has(track.id)) {
            // It's a default track, merge/update it with pre-fetched properties
            const defTrack = defaultMap.get(track.id);
            mergedTracks.push({ ...track, ...defTrack });
            seenIds.add(track.id);
          } else {
            // It's a user-added custom track, keep it as is
            mergedTracks.push(track);
            seenIds.add(track.id);
          }
        }
        
        // Add any default tracks that were not in the saved tracks list
        for (const defTrack of defaultTracks) {
          if (!seenIds.has(defTrack.id)) {
            mergedTracks.push(defTrack);
          }
        }
        
        this.tracks = mergedTracks;
        // Resave the updated/merged track list to local storage
        this.saveTracksToLocalStorage();
      } catch (e) {
        console.error("Failed to parse saved tracks from localStorage:", e);
        this.tracks = defaultTracks;
        this.saveTracksToLocalStorage();
      }
    } else {
      this.tracks = defaultTracks;
      this.saveTracksToLocalStorage();
    }

    this.currentTrackIndex = 0;
    this.defaultTracksLoaded = false;
    
    // Synthesizer tuning (Adapted per-track for variation)
    this.chordsByTrack = [];
    const baseFreqs = [110.00, 116.54, 130.81, 146.83, 164.81];
    const defaultChords = [
      [[110.00, 130.81, 164.81, 196.00], [87.31, 110.00, 130.81, 164.81]] // Green Light chords
    ];

    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      if (track.id && track.id === "green_light") {
        this.chordsByTrack.push(defaultChords[0]);
      } else {
        const base = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];
        const isMinor = Math.random() > 0.35;
        const chords = isMinor ? [
          [base, base * 1.2, base * 1.5, base * 1.8],
          [base * 0.75, base * 0.75 * 1.2, base * 0.75 * 1.5, base * 0.75 * 1.8]
        ] : [
          [base, base * 1.25, base * 1.5, base * 1.875],
          [base * 1.125, base * 1.125 * 1.25, base * 1.125 * 1.5, base * 1.125 * 1.875]
        ];
        this.chordsByTrack.push(chords);
      }
    }
    
    this.chords = this.chordsByTrack[0] || [[[110.00, 130.81, 164.81, 196.00], [87.31, 110.00, 130.81, 164.81]]];
    this.chordIndex = 0;
    this.stepIndex = 0;
  }

  saveTracksToLocalStorage() {
    localStorage.setItem('cosmic_vinyl_tracks_v2', JSON.stringify(this.tracks));
  }

  // Initialize the Audio Context (must be user-triggered)
  init() {
    if (this.ctx) return;
    
    // Create audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Create Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    const bufferLength = this.analyser.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength);
    
    // Create Gain Node (Volume)
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    
    // Connect nodes
    this.gainNode.connect(this.ctx.destination);
    this.analyser.connect(this.gainNode);
    
    // Setup Synth Filter
    this.synthFilter = this.ctx.createBiquadFilter();
    this.synthFilter.type = 'lowpass';
    this.synthFilter.frequency.value = 600;
    this.synthFilter.Q.value = 1.0;
    this.synthFilter.connect(this.analyser);
    
    console.log("Audio Engine initialized. Context state:", this.ctx.state);
  }

  // Load preview URLs and artwork for all default tracks from iTunes API
  async loadDefaultTrackData(onTrackLoaded) {
    if (this.defaultTracksLoaded) return;
    this.defaultTracksLoaded = true;
    
    const promises = this.tracks.map(async (track, index) => {
      if (!track.iTunesQuery || track.previewUrl) return; // Skip if already loaded or no query
      
      try {
        const results = await this.searchiTunes(track.iTunesQuery);
        if (results.length > 0) {
          // Find the best match - prefer exact name match
          const match = results.find(r => 
            r.name.toLowerCase().includes(track.name.toLowerCase().split('(')[0].trim())
          ) || results[0];
          
          track.previewUrl = match.previewUrl;
          track.artworkUrl = match.artworkUrl;
          
          console.log(`Loaded iTunes data for "${track.name}": artwork=${!!match.artworkUrl}, preview=${!!match.previewUrl}`);
          
          // Notify main app to update textures for this track
          if (onTrackLoaded) {
            onTrackLoaded(index, track);
          }
        }
      } catch (err) {
        console.warn(`Failed to load iTunes data for "${track.name}":`, err);
      }
    });
    
    await Promise.allSettled(promises);
    console.log("All default track data loaded from iTunes.");
  }

  // Play or resume audio
  play() {
    if (!this.ctx) this.init();
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    
    if (this.isSynth) {
      this.startSynth();
    } else {
      // If we are in preview mode and playing a track from tracks list
      if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.tracks.length) {
        const track = this.tracks[this.currentTrackIndex];
        if (track.previewUrl) {
          if (this.loadedPreviewUrl === track.previewUrl && this.audioBuffer) {
            this.playBuffer();
          } else {
            this.loadAndPlayPreview(track.previewUrl);
          }
        } else if (track.isCustom) {
          if (this.audioBuffer) {
            this.playBuffer();
          } else {
            this.loadAndPlayCustomTrack(track);
          }
        } else {
          // No previewUrl available - don't play anything
          console.log("No preview URL available for this track yet.");
          this.isPlaying = false;
          return;
        }
      } else {
        // -1 (custom manual file) or -2 (search preview)
        this.playBuffer();
      }
    }
    
    // Update UI play state
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    
    if (iconPlay) iconPlay.classList.add('hidden');
    if (iconPause) iconPause.classList.remove('hidden');
    this.updateStatusUI();
  }

  // Pause audio
  pause() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    
    if (this.isSynth) {
      this.stopSynth();
    } else {
      this.pauseBuffer();
    }
    
    // Update UI pause state
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    
    if (iconPlay) iconPlay.classList.remove('hidden');
    if (iconPause) iconPause.classList.add('hidden');
    this.updateStatusUI();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(value) {
    this.volume = parseFloat(value);
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  // Transition to custom MP3 mode
  loadBuffer(arrayBuffer, name) {
    this.pause();
    this.isSynth = false;
    this.audioBuffer = null;
    this.pauseOffset = 0;
    this.currentTrackIndex = -1; // -1 represents custom track
    this.loadedPreviewUrl = null;
    
    // Update track display info
    document.getElementById('track-name').textContent = name;
    document.getElementById('track-artist').textContent = "Uploaded Local Track";
    document.getElementById('duration-time').textContent = "--:--";
    
    this.ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
      this.audioBuffer = decodedBuffer;
      const minutes = Math.floor(decodedBuffer.duration / 60);
      const seconds = Math.floor(decodedBuffer.duration % 60);
      document.getElementById('duration-time').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      this.play();
    }, (err) => {
      console.error("Error decoding audio data:", err);
      alert("Failed to load audio file. Please make sure it is a valid audio file (MP3/WAV/OGG).");
    });
  }

  // Switch back to Synth Mode
  setSynthMode() {
    this.pause();
    this.isSynth = true;
    this.loadedPreviewUrl = null;
    this.selectTrack(0);
    this.play();
  }

  // Set the active track and switch synthesizer tuning
  selectTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;
    
    const prevIndex = this.currentTrackIndex;
    this.currentTrackIndex = index;
    const track = this.tracks[index];
    
    // Reset playback offset if switching to a different track
    if (prevIndex !== index) {
      this.pauseBuffer();
      this.pauseOffset = 0;
    }
    
    // Always update HUD metadata
    const trackNameEl = document.getElementById('track-name');
    const trackArtistEl = document.getElementById('track-artist');
    const durationTimeEl = document.getElementById('duration-time');
    
    if (trackNameEl) trackNameEl.textContent = track.name;
    if (trackArtistEl) trackArtistEl.textContent = track.artist;
    if (durationTimeEl) durationTimeEl.textContent = track.duration;
    
    const wasSynth = this.isSynth;
    
    if (track.previewUrl) {
      // Online track with previewUrl
      this.isSynth = false;
      if (this.isPlaying) {
        if (wasSynth) {
          this.stopSynth();
        }
        if (this.loadedPreviewUrl !== track.previewUrl) {
          this.loadAndPlayPreview(track.previewUrl);
        }
      }
    } else if (track.isCustom) {
      this.isSynth = false;
      if (this.isPlaying) {
        if (wasSynth) {
          this.stopSynth();
        }
        this.loadAndPlayCustomTrack(track);
      } else {
        this.loadCustomTrack(track, false);
      }
    } else {
      // No preview URL available - don't auto-start synth (user asked for no background music)
      this.isSynth = false;
      if (this.isPlaying) {
        // Stop current playback silently
        if (wasSynth) {
          this.stopSynth();
        }
        this.pauseBuffer();
        this.audioBuffer = null;
        this.loadedPreviewUrl = null;
        this.isPlaying = false;
        
        // Update UI to paused state
        const iconPlay = document.getElementById('icon-play');
        const iconPause = document.getElementById('icon-pause');
        if (iconPlay) iconPlay.classList.remove('hidden');
        if (iconPause) iconPause.classList.add('hidden');
      }
    }
  }

  // Load custom track from IndexedDB and decode it
  async loadCustomTrack(track, autoPlay = false) {
    if (!this.ctx) this.init();
    
    this.pauseBuffer();
    this.pauseOffset = 0;
    this.audioBuffer = null;
    this.loadedPreviewUrl = null;
    
    try {
      const blob = await getAudioFile(track.id);
      if (!blob) {
        console.warn("Audio file not found in IndexedDB for track ID:", track.id);
        return;
      }
      
      const arrayBuffer = await blob.arrayBuffer();
      this.ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
        this.audioBuffer = decodedBuffer;
        const minutes = Math.floor(decodedBuffer.duration / 60);
        const seconds = Math.floor(decodedBuffer.duration % 60);
        const durationStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        const durationTimeEl = document.getElementById('duration-time');
        if (durationTimeEl) durationTimeEl.textContent = durationStr;
        
        // Save duration to track metadata
        if (track.duration !== durationStr) {
          track.duration = durationStr;
          this.saveTracksToLocalStorage();
        }
        
        if (autoPlay && this.isPlaying) {
          this.playBuffer();
        }
      }, (err) => {
        console.error("Error decoding custom track:", err);
      });
    } catch (e) {
      console.error("Error loading custom track from IndexedDB:", e);
    }
  }

  loadAndPlayCustomTrack(track) {
    this.loadCustomTrack(track, true);
  }

  // Load and play a preview URL helper
  async loadAndPlayPreview(url) {
    this.pauseBuffer();
    this.pauseOffset = 0;
    this.audioBuffer = null;
    this.loadedPreviewUrl = url;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch audio preview clip");
      const arrayBuffer = await response.arrayBuffer();
      
      if (this.loadedPreviewUrl !== url) return; // Song changed while loading
      
      this.ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
        if (this.loadedPreviewUrl !== url) return; // Song changed during decode
        this.audioBuffer = decodedBuffer;
        
        if (this.isPlaying) {
          this.playBuffer();
        }
      }, (err) => {
        console.error("Error decoding preview clip:", err);
      });
    } catch (error) {
      console.error("Error streaming preview clip:", error);
    }
  }

  // Appends a new song to the track list dynamically at runtime
  addTrack(name, artist, artworkUrl = null, previewUrl = null, fileBlob = null) {
    const id = previewUrl ? ("online_" + Math.random().toString(36).substr(2, 9)) : ("local_" + Date.now());
    const newTrack = {
      id: id,
      name: name,
      artist: artist,
      duration: previewUrl ? "0:45" : "--:--",
      artworkUrl: artworkUrl,
      previewUrl: previewUrl,
      isCustom: !previewUrl
    };
    this.tracks.push(newTrack);

    if (fileBlob) {
      saveAudioFile(id, fileBlob).catch(err => console.error("Error saving file to IndexedDB:", err));
    }
    
    this.saveTracksToLocalStorage();
    
    // Generate a randomized set of elegant minor/major chords for synth playback variation
    const baseFreqs = [110.00, 116.54, 130.81, 146.83, 164.81]; // A2, Bb2, C3, D3, E3
    const base = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];
    const isMinor = Math.random() > 0.35;
    
    const chords = isMinor ? [
      [base, base * 1.2, base * 1.5, base * 1.8], // Root minor 7
      [base * 0.75, base * 0.75 * 1.2, base * 0.75 * 1.5, base * 0.75 * 1.8] // Sub-V/IV minor 7
    ] : [
      [base, base * 1.25, base * 1.5, base * 1.875], // Root major 7
      [base * 1.125, base * 1.125 * 1.25, base * 1.125 * 1.5, base * 1.125 * 1.875]
    ];
    this.chordsByTrack.push(chords);
    
    return this.tracks.length - 1; // Return index of added track
  }

  // Removes a song from the library at runtime
  deleteTrack(index) {
    if (index < 0 || index >= this.tracks.length) return false;
    
    if (this.tracks.length <= 1) {
      alert("Your library must contain at least one track!");
      return false;
    }
    
    const track = this.tracks[index];
    if (track.isCustom && track.id) {
      deleteAudioFile(track.id).catch(err => console.error("Error deleting file from IndexedDB:", err));
    }
    
    // Remove track and chords
    this.tracks.splice(index, 1);
    this.chordsByTrack.splice(index, 1);
    this.saveTracksToLocalStorage();
    
    // Adjust active track index boundaries
    if (this.currentTrackIndex === index) {
      const nextIndex = Math.min(this.tracks.length - 1, index);
      this.selectTrack(nextIndex);
    } else if (this.currentTrackIndex > index) {
      this.currentTrackIndex--;
    }
    
    return true;
  }

  // Play the uploaded custom buffer
  playBuffer() {
    this.pauseBuffer(); // Ensure any existing buffer playback is stopped first
    if (!this.audioBuffer) return;
    
    this.audioSource = this.ctx.createBufferSource();
    this.audioSource.buffer = this.audioBuffer;
    this.audioSource.connect(this.analyser);
    
    // Setup loop
    this.audioSource.loop = true;
    
    this.startTime = this.ctx.currentTime;
    this.audioSource.start(0, this.pauseOffset % this.audioBuffer.duration);
  }

  // Pause buffer playback
  pauseBuffer() {
    if (this.audioSource) {
      try {
        this.audioSource.stop();
      } catch (e) {
        // Source might not have started
      }
      this.pauseOffset += (this.ctx.currentTime - this.startTime);
      this.audioSource = null;
    }
  }

  // Start the generative synthesizer sequencer
  startSynth() {
    this.stopSynth(); // Ensure any existing synth scheduler is stopped first
    this.synthScheduleTime = this.ctx.currentTime;
    this.stepIndex = 0;
    
    // Setup a clean background drone pad chord that plays continuously
    this.playPadChord();
    
    // Set a schedule loop interval (150ms step size for scheduling notes)
    this.synthInterval = setInterval(() => {
      this.scheduler();
    }, 150);
  }

  // Stop generative synth nodes
  stopSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    
    this.synthOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.synthOscillators = [];
  }

  // Synthesizer note scheduler using Web Audio clock
  scheduler() {
    const lookAhead = 0.2; // Schedule notes 200ms ahead
    const stepDuration = 0.25; // Duration of each 16th note (120 BPM)
    
    while (this.synthScheduleTime < this.ctx.currentTime + lookAhead) {
      this.scheduleStep(this.stepIndex, this.synthScheduleTime, stepDuration);
      
      this.stepIndex = (this.stepIndex + 1) % 16;
      this.synthScheduleTime += stepDuration;
      
      // Rotate chord every 4 bars (64 steps)
      if (this.stepIndex === 0 && Math.random() > 0.5) {
        this.chordIndex = (this.chordIndex + 1) % this.chords.length;
        this.playPadChord(); // Transition pad chord
      }
    }
  }

  // Schedule a specific sequencer step
  scheduleStep(step, time, duration) {
    const chord = this.chords[this.chordIndex];
    
    // 1. Bassline: Pulsing 8th notes, playing root or fifth notes
    if (step % 2 === 0) {
      const isRoot = step % 8 === 0;
      const noteFreq = isRoot ? chord[0] / 2 : chord[2] / 2; // Deep bass octave
      this.triggerBass(noteFreq, time, duration * 0.9);
    }
    
    // 2. Star Sparkle Arpeggiator: Random high frequencies on 16th beats
    if (Math.random() < 0.25) {
      const randomNote = chord[Math.floor(Math.random() * chord.length)] * 4; // High octave
      this.triggerArpeggio(randomNote, time, duration * 2.0);
    }
    
    // 3. Space Heartbeat: Pulsing soft sub-kick on beat 1 and 9
    if (step === 0 || step === 8) {
      this.triggerHeartbeat(time);
    }
  }

  // Trigger synth drone pad (chords)
  playPadChord() {
    const now = this.ctx.currentTime;
    
    // Fade out previous pad oscillators
    this.synthOscillators.forEach(osc => {
      if (osc.isPad) {
        try {
          osc.gainNode.gain.setValueAtTime(osc.gainNode.gain.value, now);
          osc.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
          osc.stop(now + 1.6);
        } catch (e) {}
      }
    });
    
    // Clear dead pads
    this.synthOscillators = this.synthOscillators.filter(osc => !osc.isPad || osc.endTime > now);

    const chord = this.chords[this.chordIndex];
    chord.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle'; // Soft triangle
      osc.frequency.setValueAtTime(freq, now);
      
      // Slightly detune to create chorus effect
      osc.detune.setValueAtTime((Math.random() - 0.5) * 15, now);
      
      gainNode.gain.setValueAtTime(0.001, now);
      // Gentle fade in
      gainNode.gain.exponentialRampToValueAtTime(0.05, now + 1.0);
      
      osc.connect(gainNode);
      gainNode.connect(this.synthFilter);
      
      osc.isPad = true;
      osc.gainNode = gainNode;
      osc.start(now);
      
      this.synthOscillators.push(osc);
    });
    
    // Add LFO modulation to filters to create sweep
    if (!this.synthLfo) {
      this.synthLfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.synthLfo.frequency.value = 0.08; // Super slow sweep (12 seconds)
      lfoGain.gain.value = 350; // Sweeps lowpass filter between 250Hz and 950Hz
      
      this.synthLfo.connect(lfoGain);
      lfoGain.connect(this.synthFilter.frequency);
      this.synthLfo.start(now);
    }
  }

  // Trigger synth deep bass note
  triggerBass(freq, time, duration) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    // Filter decay specifically for bass pluck
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + 0.02);
    filter.frequency.exponentialRampToValueAtTime(80, time + duration);
    
    gainNode.gain.setValueAtTime(0.001, time);
    gainNode.gain.linearRampToValueAtTime(0.18, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.analyser);
    
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  // Trigger high starry bell arpeggio note
  triggerArpeggio(freq, time, duration) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'sine'; // Pure bell
    osc.frequency.setValueAtTime(freq, time);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, time);
    filter.Q.value = 2.0;
    
    gainNode.gain.setValueAtTime(0.001, time);
    gainNode.gain.linearRampToValueAtTime(0.08, time + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.analyser);
    
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  // Trigger rhythmic sub-beat
  triggerHeartbeat(time) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    // Rapid pitch sweep from 100Hz down to 20Hz (creates kick impact)
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    gainNode.gain.setValueAtTime(0.001, time);
    gainNode.gain.linearRampToValueAtTime(0.4, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    
    osc.connect(gainNode);
    gainNode.connect(this.analyser);
    
    osc.start(time);
    osc.stop(time + 0.4);
  }

  // Fetch normalized audio analysis data for drawing visualizers and particle effects
  getAnalysisData() {
    if (!this.analyser || !this.isPlaying) {
      return {
        freq: new Uint8Array(256),
        bass: 0,
        mid: 0,
        high: 0,
        volume: 0
      };
    }
    
    this.analyser.getByteFrequencyData(this.frequencyData);
    
    let bassSum = 0;
    let midSum = 0;
    let highSum = 0;
    
    const len = this.frequencyData.length;
    const bassLimit = Math.floor(len * 0.08); // 0-20 bins (approx <150Hz)
    const midLimit = Math.floor(len * 0.45);  // 21-115 bins (approx 150Hz-2.5kHz)
    
    for (let i = 0; i < len; i++) {
      const val = this.frequencyData[i];
      if (i < bassLimit) {
        bassSum += val;
      } else if (i < midLimit) {
        midSum += val;
      } else {
        highSum += val;
      }
    }
    
    const bass = bassSum / bassLimit / 255;
    const mid = midSum / (midLimit - bassLimit) / 255;
    const high = highSum / (len - midLimit) / 255;
    
    // Overall volume intensity
    const totalVolume = (bass * 0.4 + mid * 0.4 + high * 0.2);
    
    return {
      freq: this.frequencyData,
      bass: Math.min(Math.pow(bass, 1.2) * 1.5, 1.0), // Boost scale for nicer visual response
      mid: Math.min(Math.pow(mid, 1.1), 1.0),
      high: Math.min(Math.pow(high, 1.3) * 1.8, 1.0),
      volume: totalVolume
    };
  }

  // Fetch track progress percentage
  getProgress() {
    if (this.isSynth) return 0;
    if (!this.audioBuffer || !this.isPlaying) return this.pauseOffset / (this.audioBuffer?.duration || 1);
    
    const elapsed = this.ctx.currentTime - this.startTime + this.pauseOffset;
    return (elapsed % this.audioBuffer.duration) / this.audioBuffer.duration;
  }

  // Seek to a specific percentage in current track
  seek(percent) {
    if (this.isSynth || !this.audioBuffer) return;
    const wasPlaying = this.isPlaying;
    this.pause();
    this.pauseOffset = percent * this.audioBuffer.duration;
    if (wasPlaying) {
      this.play();
    }
  }

  // Fetch current elapsed playback time string
  getElapsedTimeString() {
    if (this.isSynth) return "∞";
    
    let elapsed = this.pauseOffset;
    if (this.isPlaying && this.ctx && this.audioBuffer) {
      elapsed += (this.ctx.currentTime - this.startTime);
    }
    
    if (this.audioBuffer) {
      elapsed = elapsed % this.audioBuffer.duration;
    }
    
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  // Fetch search results from iTunes API (free, CORS-enabled, no API keys)
  async searchiTunes(query) {
    if (!query || query.trim() === '') return [];
    
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Search request failed");
      const data = await response.json();
      
      return data.results.map(track => ({
        id: track.trackId,
        name: track.trackName,
        artist: track.artistName,
        previewUrl: track.previewUrl,
        artworkUrl: track.artworkUrl100.replace('100x100bb', '500x500bb') // Fetch higher-resolution art
      }));
    } catch (error) {
      console.error("iTunes API search error:", error);
      return [];
    }
  }

  // Stream a selected 30s preview clip through the Web Audio context
  async playPreview(url, name, artist) {
    if (!this.ctx) this.init();
    
    this.pause();
    this.isSynth = false;
    this.audioBuffer = null;
    this.pauseOffset = 0;
    this.currentTrackIndex = -2; // -2 represents dynamic online search track
    this.loadedPreviewUrl = url;
    
    // Update player HUD details
    document.getElementById('track-name').textContent = name;
    document.getElementById('track-artist').textContent = artist;
    document.getElementById('duration-time').textContent = "0:45";
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch audio preview clip");
      const arrayBuffer = await response.arrayBuffer();
      
      if (this.loadedPreviewUrl !== url) return;
      
      this.ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
        if (this.loadedPreviewUrl !== url) return;
        this.audioBuffer = decodedBuffer;
        this.play();
      }, (err) => {
        console.error("Error decoding preview clip:", err);
      });
    } catch (error) {
      console.error("Error streaming preview clip:", error);
      alert("Failed to load music preview stream. Please check your internet connection.");
    }
  }
}

export const audio = new AudioEngine();
