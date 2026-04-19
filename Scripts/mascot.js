class MascotManager {
  constructor() {
    this.mascots = [];
    this.maxMascots = 3;
    this.checkStorageAndInit();
    this.bindGlobalListeners();
  }

  checkStorageAndInit() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['isGlobalEnabled', 'disabledDomains'], (res) => {
        if (res.isGlobalEnabled === false) return;
        const host = window.location.hostname;
        if (res.disabledDomains && res.disabledDomains.includes(host)) return;
        this.addMascot(undefined, undefined, false);
      });
    } else {
      this.addMascot(undefined, undefined, false);
    }
  }

  addMascot(x, y, isClone = true) {
    // Chỉ đếm những mascot chưa ở trạng thái chuẩn bị biến mất
    if (this.mascots.length >= this.maxMascots) {
      if (this.mascots[0]) this.mascots[0].triggerAction('*tuc_gian*', "Chật chội quá rồi! Đừng có gọi đồng bọn tôi ra nữa!");
      return;
    }
    const id = 'mascot_' + Date.now() + Math.floor(Math.random() * 1000);
    const m = new Mascot(this, id, x, y, isClone);
    this.mascots.push(m);
  }

  removeMascot(id) {
    const idx = this.mascots.findIndex(m => m.id === id);
    if (idx !== -1) {
      const m = this.mascots[idx];
      m.isRemoving = true; // Chặn các xử lý vật lý và va chạm biên

      // Cho mascot nói lời cuối cùng từ data.js
      m.dispatchSimulatedEvent("[Sự kiện]: Người dùng cố gắng tắt extension hoặc đóng tab có linh vật.", true);

      // Chờ 2 giây cho người dùng đọc rồi mới biến mất
      setTimeout(() => {
        const r = Math.random();
        if (r < 0.5) {
          // Kiểu 1: Di chuyển ra biên rồi biến mất
          m.vx = m.x > (document.documentElement.clientWidth / 2) ? 5 : -5;
          m.container.style.transition = "opacity 1s";
          m.container.style.opacity = "0";
          setTimeout(() => { m.stop(); this.finalizeRemoval(id); }, 1500);
        } else {
          // Kiểu 2: Hiệu ứng nổ tung tại chỗ
          m.vx = 0;
          m.canvas.classList.add('shimeji-vanish');
          m.chatBubble.style.transition = "opacity 0.5s";
          m.chatBubble.style.opacity = "0";
          setTimeout(() => { m.stop(); this.finalizeRemoval(id); }, 1000);
        }
      }, 2500);
    }
  }

  finalizeRemoval(id) {
    const idx = this.mascots.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.mascots.splice(idx, 1);
    }
  }

  bindGlobalListeners() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'toggleMascot') {
          if (msg.state) {
            if (this.mascots.length === 0) this.addMascot();
          } else {
            this.mascots.forEach(m => m.stop());
            this.mascots = [];
          }
        }
      });
    }

    // --- NEW: CENTRALIZED GLOBAL EVENTS ---
    // These ensure only the primary mascot responds to environment changes

    const getLeader = () => this.mascots.find(m => !m.isRemoving);

    // 1. Scroll
    let scrollTimer;
    window.addEventListener('scroll', () => {
      const leader = getLeader();
      if (!leader) return;
      leader.lastActionTime = Date.now();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng cuộn trang (scroll) xuống quá nhanh.");
      }, 300);
    });

    // 2. Offline / Online
    window.addEventListener('offline', () => getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Kết nối internet bị mất"));
    window.addEventListener('online', () => getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Mạng trở lại"));

    // 3. Keys
    document.addEventListener('keydown', (e) => {
      const leader = getLeader();
      if (!leader) return;
      leader.lastActionTime = Date.now();
      if (e.key === 'F12') leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng nhấn F12");
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng nhấn F5 tải lại trang");
      if (e.key === 'Escape') leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng nhấn phím Esc");
      if (e.ctrlKey && e.key === 'f') leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng tìm kiếm trên trang");
      if (e.ctrlKey && e.key === 'p') leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng định in tài liệu");
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Người dùng chụp ảnh màn hình");
    });

    // 4. Input & Search
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'search') {
        getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Người dùng gõ một từ tìm kiếm (Search input).");
      }
    });

    // 5. URL/Site Context (Heuristic)
    this.watchUrlChangesGlobal();

    // 6. Clipboard
    document.addEventListener('copy', () => getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Người dùng sao chép văn bản"));
    document.addEventListener('cut', () => getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Người dùng cắt (cut) dữ liệu"));
    document.addEventListener('paste', () => getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Người dùng dán (paste) dữ liệu"));

    // 7. Visibility
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Người dùng quay lại tab sau khi bỏ đi");
    });

    // 8. Heuristic HTML Element Interactions
    this.elementCooldownsGlobal = {};
    document.addEventListener('mouseover', (e) => {
      const target = e.target;
      const leader = getLeader();
      if (!leader) return;
      const now = Date.now();

      clearTimeout(this.hoverDebounceTimerGlobal);
      this.hoverDebounceTimerGlobal = setTimeout(() => {
        // Skip link/button detection if hovering the mascot itself
        if (target.dataset && target.dataset.shimeji) return;
        if (target.closest('.shimeji-container') || target.closest('.shimeji-control-panel')) return;

        // Check for Links
        const link = target.closest('a, [role="link"]');
        if (link && (!this.elementCooldownsGlobal.link || now - this.elementCooldownsGlobal.link > 15000)) {
          leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng phân vân trước một liên kết");
          this.elementCooldownsGlobal.link = now;
          return;
        }

        // Check for Images/Media
        const media = target.closest('img, [role="img"], picture, canvas');
        if (media && (!this.elementCooldownsGlobal.media || now - this.elementCooldownsGlobal.media > 15000)) {
          leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng ngắm nhìn một bức ảnh");
          this.elementCooldownsGlobal.media = now;
          return;
        }

        // Check for Buttons
        const btn = target.closest('button, [role="button"], .btn, .button, [type="submit"], [type="reset"]');
        if (btn && (!this.elementCooldownsGlobal.btn || now - this.elementCooldownsGlobal.btn > 15000)) {
          if (btn.type === 'submit' || btn.classList.contains('btn-primary')) {
            leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng chuẩn bị ấn nút gửi");
          } else if (btn.type === 'reset' || btn.classList.contains('btn-danger')) {
            leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng định xóa sạch biểu mẫu");
          }
          this.elementCooldownsGlobal.btn = now;
          return;
        }
      }, 600);
    });

    document.addEventListener('mouseout', () => clearTimeout(this.hoverDebounceTimerGlobal));

    // 9. Input & Password Focus
    document.addEventListener('focusin', (e) => {
      const target = e.target;
      const leader = getLeader();
      if (!leader) return;

      if (target.tagName === 'INPUT' && target.type === 'password') {
        leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng tập trung nhập mật khẩu");
      } else if (target.closest('input:not([type="password"]), textarea, [contenteditable="true"]')) {
        leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng đang gõ văn bản");
      }
    });

    // 10. Highlighting / Selection
    document.addEventListener('mouseup', () => {
      const leader = getLeader();
      if (!leader) return;
      setTimeout(() => {
        const selection = window.getSelection().toString();
        if (selection.length > 50) {
          leader.dispatchSimulatedEvent("[Sự kiện]: Người dùng bôi đen (highlight) một đoạn văn bản dài.");
        }
      }, 10);
    });

    // 11. Drag & Drop
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].type.startsWith('image/')) {
        getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Người dùng kéo thả một tệp ảnh vào cửa sổ trình duyệt (Image Drop).");
      }
    });

    // 12. Media Playback
    document.addEventListener('play', () => {
      getLeader()?.dispatchSimulatedEvent("[Sự kiện]: Người dùng bắt đầu xem video/nghe nhạc");
    }, true);
  }

  watchUrlChangesGlobal() {
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        const leader = this.mascots.find(m => !m.isRemoving);
        if (leader) leader.detectSiteContext();
      }
    }, 3000);
  }

  getBubbleStackOffset(requestingMascot) {
    let offset = 0;
    // Check other mascots that ARE ALREADY speaking
    this.mascots.forEach(m => {
      if (m.id !== requestingMascot.id && m.isCurrentlySpeaking) {
        const dx = Math.abs(m.x - requestingMascot.x);
        // If mascots are closer than 200px horizontally
        if (dx < 200) {
          offset -= 60; // Push new bubble 60px higher
        }
      }
    });
    return offset;
  }

  checkCollisions() {
    for (let i = 0; i < this.mascots.length; i++) {
      for (let j = i + 1; j < this.mascots.length; j++) {
        const m1 = this.mascots[i];
        const m2 = this.mascots[j];

        // Skip collision check if either mascot is in the process of leaving
        if (m1.isRemoving || m2.isRemoving) continue;

        if (Math.abs(m1.x - m2.x) < 80 && Math.abs(m1.y - m2.y) < 80) {
          if (m1.x < m2.x) { m1.x -= 5; m2.x += 5; m1.vx = -1; m2.vx = 1; }
          else { m1.x += 5; m2.x -= 5; m1.vx = 1; m2.vx = -1; }
          if ((Date.now() - m1.globalLastDialogueTime > 10000) && Math.random() < 0.2) {
            m1.dispatchSimulatedEvent("[Sự kiện]: Linh vật va chạm với linh vật khác (Collision)", true);
            m1.globalLastDialogueTime = Date.now();
          }
        }
      }
    }
  }
}

class Mascot {
  constructor(manager, id, startX, startY, isClone = false) {
    this.manager = manager;
    this.id = id;
    this.createDOM();
    this.ctx = this.canvas.getContext('2d');

    // Physics & State
    this.x = startX !== undefined ? startX : (document.documentElement.clientWidth || window.innerWidth) - 150;
    this.y = startY !== undefined ? startY : (isClone ? 50 : (document.documentElement.clientHeight || window.innerHeight) - 130);
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0.5;
    this.isDragging = false;
    this.isGliding = false;
    this.isRemoving = false; // Trạng thái đang bị đuổi đi
    this.isAlive = true;    // Trạng thái hoạt động của loop
    this.currentState = 'idle';
    this.groundY = (document.documentElement.clientHeight || window.innerHeight) - 130;

    // Load saved position only if not a clone
    if (!isClone) {
      this.loadPosition();
    }

    // Idle tracking
    this.idleTimer = null;
    this.lastActionTime = Date.now();

    this.bindEvents();
    this.appLoop();
    this.setupDatasetTriggers();
    this.startWandering();
    this.detectSiteContext(); // Check URL on startup

    this.globalLastDialogueTime = 0;
    this.hoverDebounceTimer = null;
    this.isCurrentlySpeaking = false;
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.id = `shimeji-container-${this.id}`;
    this.container.className = 'shimeji-container';

    this.chatBubble = document.createElement('div');
    this.chatBubble.id = `shimeji-chat-bubble-${this.id}`;
    this.chatBubble.className = 'shimeji-chat-bubble';
    this.container.appendChild(this.chatBubble);

    this.canvasWrapper = document.createElement('div');
    this.canvasWrapper.id = `shimeji-canvas-wrapper-${this.id}`;
    this.canvasWrapper.className = 'shimeji-canvas-wrapper';
    this.container.appendChild(this.canvasWrapper);

    this.canvas = document.createElement('canvas');
    this.canvas.id = `shimeji-canvas-${this.id}`;
    this.canvas.width = 128;
    this.canvas.height = 128;
    this.canvas.setAttribute('draggable', 'false');
    this.canvasWrapper.appendChild(this.canvas);

    document.body.appendChild(this.container);
    this.createControlPanel();
    this.updatePosition();
  }

  createControlPanel() {
    this.panel = document.createElement('div');
    this.panel.id = `shimeji-control-panel-${this.id}`;
    this.panel.className = 'shimeji-control-panel';

    this.panel.innerHTML = `
      <div class="shimeji-panel-title">Hệ thống</div>
      <div class="shimeji-panel-item" id="clone-${this.id}">🌀 Nhân bản</div>
      <div class="shimeji-panel-item" id="dismiss-${this.id}">💨 Đuổi đi</div>
      <div class="shimeji-panel-title">Điều khiển thời tiết</div>
    `;

    const seasons = [
      { id: 'spring', name: 'Mùa Xuân', icon: '🌸', event: '[Sự kiện]: Kích hoạt hiệu ứng Mùa Xuân' },
      { id: 'summer', name: 'Mùa Hạ', icon: '☀️', event: '[Sự kiện]: Kích hoạt hiệu ứng Mùa Hạ' },
      { id: 'autumn', name: 'Mùa Thu', icon: '🍂', event: '[Sự kiện]: Kích hoạt hiệu ứng Mùa Thu' },
      { id: 'winter', name: 'Mùa Đông', icon: '❄️', event: '[Sự kiện]: Kích hoạt hiệu ứng Mùa Đông' }
    ];

    seasons.forEach(s => {
      const item = document.createElement('div');
      item.className = 'shimeji-panel-item';
      item.innerHTML = `<span style="font-size: 18px">${s.icon}</span> ${s.name}`;
      item.onclick = (e) => {
        e.stopPropagation();
        this.startWeather(s.id);
        this.dispatchSimulatedEvent(s.event, true);
        this.closeControlPanel();
      };
      this.panel.appendChild(item);
    });

    const actionTitle = document.createElement('div');
    actionTitle.className = 'shimeji-panel-title';
    actionTitle.innerText = 'Tương tác';
    this.panel.appendChild(actionTitle);

    const actions = [
      { id: 'pet', name: 'Xoa đầu', icon: '🌟', event: '[Sự kiện]: Kích hoạt hiệu ứng Xoa đầu' },
      { id: 'scare', name: 'Hù dọa', icon: '👻', event: '[Sự kiện]: Kích hoạt hiệu ứng Hù dọa' },
      { id: 'ghost', name: 'Biến mất', icon: '💣', event: '[Sự kiện]: Kích hoạt hiệu ứng Biến mất' }
    ];

    actions.forEach(a => {
      const item = document.createElement('div');
      item.className = 'shimeji-panel-item';
      item.innerHTML = `<span style="font-size: 18px">${a.icon}</span> ${a.name}`;
      item.onclick = (e) => {
        e.stopPropagation();
        if (a.id === 'pet') this.triggerPetting();
        if (a.id === 'scare') this.triggerScare();
        if (a.id === 'ghost') this.triggerGhostMode();

        this.dispatchSimulatedEvent(a.event, true);
        this.closeControlPanel();
      };
      this.panel.appendChild(item);
    });

    document.body.appendChild(this.panel);

    // Bind clone and dismiss explicitly
    this.panel.querySelector(`#clone-${this.id}`).onclick = (e) => {
      e.stopPropagation();
      const spawnX = Math.random() < 0.5 ? this.x + 80 : Math.random() * (window.innerWidth - 150);
      const spawnY = Math.random() < 0.5 ? this.y : 10;
      this.manager.addMascot(spawnX, spawnY, true);
      this.closeControlPanel();
    };

    this.panel.querySelector(`#dismiss-${this.id}`).onclick = (e) => {
      e.stopPropagation();
      this.manager.removeMascot(this.id);
      this.closeControlPanel();
    };
  }

  getClientPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  loadPosition() {
    chrome.storage.local.get(['shimejiPos'], (result) => {
      if (result.shimejiPos && !isNaN(result.shimejiPos.x)) {
        this.x = result.shimejiPos.x;
        this.y = result.shimejiPos.y;
        this.updatePosition();
      }
    });
  }

  savePosition() {
    chrome.storage.local.set({ shimejiPos: { x: this.x, y: this.y } });
  }

  // Render current frame to canvas
  renderFrame() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let frames = window.SPRITES[this.currentState] || window.SPRITES['idle'];

    // Tốc độ Frame: 1 frame mỗi ~250ms (4 FPS) 
    let frameIndex = Math.floor(Date.now() / 250) % frames.length;
    let matrix = frames[frameIndex];

    const scale = 4; // 32x32 -> 128x128

    for (let r = 0; r < 32; r++) {
      for (let c = 0; c < 32; c++) {
        let val = matrix[r][c];
        if (val !== '0' && window.PALETTE[val]) {
          this.ctx.fillStyle = window.PALETTE[val];
          this.ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
    }
  }

  updatePosition() {
    // 1. Kiểm tra an toàn NaN
    if (isNaN(this.x) || isNaN(this.y)) {
      this.x = (document.documentElement.clientWidth || window.innerWidth) - 150;
      this.y = (document.documentElement.clientHeight || window.innerHeight) - 150;
    }

    // 2. Chốt biên giới hạn (Clamping)
    // Nếu đang trong quá trình bị đuổi đi, cho phép đi xuyên biên để ra ngoài màn hình
    if (!this.isRemoving) {
      const maxX = (document.documentElement.clientWidth || window.innerWidth) - 128;
      const maxY = (document.documentElement.clientHeight || window.innerHeight) - 128;
      this.x = Math.max(0, Math.min(this.x, maxX));
      this.y = Math.max(0, Math.min(this.y, maxY));
    }

    // 3. PHYSICAL MOVE (Container)
    this.container.style.transform = `translate(${this.x}px, ${this.y}px)`;

    // 4. VISUAL FLIP (Wrapper)
    let dir = this.vx > 0 ? -1 : 1;
    this.canvasWrapper.style.setProperty('--shimeji-dir', dir);
    this.canvasWrapper.style.transform = `scaleX(${dir})`;
  }

  appLoop = () => {
    // Physics & AI Loop
    if (!this.isDragging) {
      if (this.currentState === '*leo_treo*') {
        // Leo tường (Bypass gravity)
        this.y -= 2;
        if (this.y <= 0) {
          // Lên tới đỉnh, trượt tay rớt xuống
          this.y = 10;
          this.setState('*roi_xuong*');
          this.dispatchSimulatedEvent("[Sự kiện]: Linh vật đang leo tường thì bị trượt tay rơi xuống.", true);
        }
      } else {
        // Normal Gravity
        if (this.y < this.groundY) {
          if (this.isGliding) {
            this.vy = 1; // Rơi chậm
          } else {
            this.vy += 0.5; // Fixed Gravity
          }
          this.y += this.vy;

          if (this.vy > 2 && this.currentState === 'idle') {
            this.setState('*roi_xuong*');
          }
        } else {
          if (this.y > this.groundY) {
            this.y = this.groundY;
            this.isGliding = false; // Reset glide
            if (this.vy > 3) {
              // Nhảy hoặc rớt mạnh
              this.dispatchSimulatedEvent("[Sự kiện]: Linh vật vừa rơi chạm xuống đáy màn hình (Land).", true);
              this.vx = 0;
            } else if (this.currentState === '*roi_xuong*') {
              this.setState('idle');
              this.savePosition(); // Lưu vị trí sau khi tiếp đất
            }
            this.vy = 0;
          }

          // Horizontal movement rules
          if (this.vx !== 0 && this.currentState === '*chay_loan*') {
            this.x += this.vx;

            // Chỉ kiểm tra va chạm biên nếu không phải đang trong quá trình bị đuổi đi
            if (!this.isRemoving) {
              const maxX = (document.documentElement.clientWidth || window.innerWidth) - 128;
              // Va chạm lề trái
              if (this.x <= 0) {
                this.x = 0;
                if (Math.random() < 0.5) {
                  this.vx = 0;
                  this.setState('*leo_treo*');
                } else {
                  this.vx = 1;
                }
              }
              // Va chạm lề phải
              else if (this.x >= maxX) {
                this.x = maxX;
                if (Math.random() < 0.5) {
                  this.vx = 0;
                  this.setState('*leo_treo*');
                } else {
                  this.vx = -1;
                }
              }
            }
          }
        }
      }
    }

    this.updatePosition();
    this.renderFrame();

    // Check collisions with other mascots
    if (this.manager && this.manager.mascots[0] === this) {
      this.manager.checkCollisions();
    }

    // Idle check
    if (Date.now() - this.lastActionTime > 180000) { // 3 minutes
      if (this.currentState !== '*ngoi_xom*') {
        this.dispatchSimulatedEvent("[Sự kiện]: Người dùng để tab nhàn rỗi (idle) quá 3 phút.");
      }
      this.lastActionTime = Date.now(); // reset to avoid spam
    }

    if (!this.isAlive) return;
    requestAnimationFrame(this.appLoop);
  }

  setState(tag) {
    if (window.SPRITES[tag]) {
      this.currentState = tag;
    } else {
      this.currentState = 'idle';
    }
    if (tag === '*giat_minh*' || tag === '*roi_xuong*') {
      this.container.classList.add('shimeji-shake');
      setTimeout(() => this.container.classList.remove('shimeji-shake'), 400);
    }
  }

  triggerAction(tag, message) {
    this.setState(tag);
    this.lastActionTime = Date.now();
    this.vx = 0; // Ngừng di chuyển khi có thoại

    if (message) {
      this.chatBubble.innerText = message;

      // Dynamic positioning based on screen edge
      this.chatBubble.className = 'shimeji-chat-bubble'; // Xoá class cũ

      const screenWidth = document.documentElement.clientWidth || window.innerWidth;
      const screenHeight = document.documentElement.clientHeight || window.innerHeight;

      // 1. Horizontal Position
      if (this.x > screenWidth - 250) {
        this.chatBubble.classList.add('bubble-left');
      } else if (this.x < 100) {
        this.chatBubble.classList.add('bubble-right');
      } else {
        this.chatBubble.classList.add('bubble-center');
      }

      // 2. Vertical Position (Awareness of Top Edge)
      if (this.y < 160) {
        this.chatBubble.classList.add('bubble-bottom');
      }

      // 3. Stacking Logic (Avoid overlap with neighbors)
      const stackOffset = this.manager.getBubbleStackOffset(this);
      this.chatBubble.style.setProperty('--bubble-stack-offset', `${stackOffset}px`);
      this.chatBubble.style.transform = `translateX(-50%) translateY(var(--bubble-stack-offset, 0px))`;

      this.chatBubble.style.opacity = '1';
      this.isCurrentlySpeaking = true;

      clearTimeout(this.chatTimeout);
      this.chatTimeout = setTimeout(() => {
        this.chatBubble.style.opacity = '0';
        this.isCurrentlySpeaking = false;
        // Revert to idle if it wasn't a permanent pose
        if (this.currentState !== '*ngoi_xom*') {
          this.setState('idle');
        }
      }, 5000);
    }
  }

  pickWeightedResponse(responses) {
    if (!Array.isArray(responses) || responses.length === 0) return null;

    // Calculate total weight
    const totalWeight = responses.reduce((sum, r) => sum + (r.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const response of responses) {
      const weight = response.weight || 1;
      if (random < weight) return response;
      random -= weight;
    }

    return responses[0];
  }

  // Find match in our dataset
  dispatchSimulatedEvent(userText, force = false) {
    if (typeof mascotData === 'undefined') return;

    const now = Date.now();
    // Global Cooldown (3s)
    if (!force && now - this.globalLastDialogueTime < 3000) return;

    // Find matching event entry
    const entry = mascotData.find(item =>
      item.user.toLowerCase().includes(userText.toLowerCase()) ||
      userText.toLowerCase().includes(item.user.toLowerCase())
    );

    if (entry) {
      let chosenResponse = "";

      // Handle new weighted structure or legacy flat structure
      if (entry.responses && Array.isArray(entry.responses)) {
        const picked = this.pickWeightedResponse(entry.responses);
        chosenResponse = picked ? picked.text : "";
      } else if (entry.assistant) {
        chosenResponse = entry.assistant;
      }

      if (chosenResponse) {
        // Extract *action_tag*
        const regex = /\*([^*]+)\*/;
        const tagMatch = chosenResponse.match(regex);
        let action = 'idle';
        let cleanMsg = chosenResponse;

        if (tagMatch) {
          action = `*${tagMatch[1]}*`;
          cleanMsg = chosenResponse.replace(regex, '').trim();
        }
        this.triggerAction(action, cleanMsg);
        this.globalLastDialogueTime = now;
      }
    }
  }

  bindEvents() {
    let offsetX, offsetY;

    // Canvas drag & drop handler (Hỗ trợ cả Mouse và Touch Screen - Cơ chế Delta Movement)
    const onDown = (e) => {
      if (e.type === 'mousedown' && e.button !== 0) return;
      this.isDragging = true;
      const pos = this.getClientPos(e);
      this.dragOffsetX = pos.x - this.x;
      this.dragOffsetY = pos.y - this.y;
      this.vy = 0;
      this.vx = 0;
      this.isGliding = false; // Reset trạng thái rơi chậm
      this.dispatchSimulatedEvent("[Sự kiện]: Người dùng nhấn giữ chuột và kéo linh vật lên cao (Drag).", true);
      this.lastActionTime = Date.now();
      e.preventDefault();
      e.stopPropagation();
    };

    const onMove = (e) => {
      const pos = this.getClientPos(e);
      this.lastActionTime = Date.now();

      // Mouse Shaking Detection Logic
      if (pos.x !== undefined && this.lastPos) {
        const now = Date.now();
        const dt = now - (this.lastMoveTime || now);
        if (dt > 0) {
          const speed = Math.abs(pos.x - this.lastPos.x) / dt;
          if (speed > 5) { // Vận tốc nhanh
            this.shakeIntensity = (this.shakeIntensity || 0) + 1;
            if (this.shakeIntensity > 20) {
              this.dispatchSimulatedEvent("[Sự kiện]: Người dùng lắc chuột quá nhanh");
              this.shakeIntensity = 0;
            }
          } else {
            this.shakeIntensity = Math.max(0, (this.shakeIntensity || 0) - 0.5);
          }
        }
        this.lastMoveTime = now;
      }

      if (this.isDragging) {
        this.x = pos.x - this.dragOffsetX;
        this.y = pos.y - this.dragOffsetY;
      }
      this.lastPos = pos;
    };

    const onUp = (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        // Check if dropped very high
        if (this.y < this.groundY - 100) {
          this.dispatchSimulatedEvent("[Sự kiện]: Người dùng thả chuột ra khi linh vật đang ở trên cao (Drop).", true);
          // 30% chane to glide down slowly
          if (Math.random() < 0.3) {
            this.isGliding = true;
          }
        } else {
          this.savePosition(); // Lưu vị trí khi được đặt xuống thấp
        }
      }
    };

    this.canvas.addEventListener('mousedown', onDown);
    this.canvas.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    // Context Menu (Right Click)
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showControlPanel(e.clientX, e.clientY);
    });

    // Close panel on click outside
    document.addEventListener('mousedown', (e) => {
      if (this.panel && !this.panel.contains(e.target) && !this.canvas.contains(e.target)) {
        this.closeControlPanel();
      }
    });

    // Make sure global listeners only fire ONCE for the manager's first mascot, not all 3
    // We attach them to 'window' but only let Mascot[0] respond.
    window.addEventListener('resize', () => {
      this.groundY = (document.documentElement.clientHeight || window.innerHeight) - 130;
      this.updatePosition();
    });
  }

  detectSiteContext() {
    const host = window.location.hostname;
    const path = window.location.pathname;

    if (host.includes('youtube.com')) {
      this.dispatchSimulatedEvent("[Sự kiện]: Người dùng mở tab YouTube.");
    } else if (host.includes('facebook.com')) {
      this.dispatchSimulatedEvent("[Sự kiện]: Người dùng mở trang Facebook hoặc mạng xã hội.");
    } else if (host.includes('github.com')) {
      this.dispatchSimulatedEvent("[Sự kiện]: Người dùng mở trang Github để làm việc.");
    } else if (host.includes('stackoverflow.com')) {
      this.dispatchSimulatedEvent("[Sự kiện]: Người dùng tìm kiếm giải pháp code (StackOverflow).");
    } else if (host.includes('google.com') && path.includes('search')) {
      this.dispatchSimulatedEvent("[Sự kiện]: Người dùng gõ một từ tìm kiếm (Search input).");
    } else if (host.includes('chatgpt.com') || host.includes('gemini.google') || host.includes('claude.ai')) {
      this.dispatchSimulatedEvent("[Sự kiện]: Người dùng đang hỏi AI.");
    }
  }

  startWandering() {
    setInterval(() => {
      // Bỏ qua nếu đang di chuột, rơi rớt, hoặc không phải lúc rảnh rỗi
      if (this.isDragging || this.y < this.groundY) return;
      if (!['idle', '*ngoi_xom*', '*chay_loan*'].includes(this.currentState)) return;

      // Chờ ít nhất 3 giây kể từ user action cuối
      if (Date.now() - this.lastActionTime < 3000) return;

      const actions = ['walk_left', 'walk_right', 'walk_left', 'sit', 'idle', 'chat', 'jump'];
      const action = actions[Math.floor(Math.random() * actions.length)];

      this.vx = 0;

      switch (action) {
        case 'walk_left':
          this.vx = -1;
          this.setState('*chay_loan*');
          break;
        case 'walk_right':
          this.vx = 1;
          this.setState('*chay_loan*');
          break;
        case 'sit':
          this.setState('*ngoi_xom*');
          break;
        case 'jump':
          this.vy = -10; // Nhảy múa
          this.setState('*giat_minh*');
          break;
        case 'idle':
          this.setState('idle');
          break;
      case 'chat':
          this.dispatchSimulatedEvent("[Sự kiện]: Người dùng để tab nhàn rỗi (idle) quá 3 phút.", false);
          break;
      }
    }, 8000); // 8 giây kích hoạt một lần
  }

  setupDatasetTriggers() {
    // 1. Local interactions (Poke/Self-hover) only
    let clicks = 0;
    let clickTimer;
    this.canvas.addEventListener('click', () => {
      clicks++;
      clearTimeout(clickTimer);
      if (clicks >= 3) {
        this.dispatchSimulatedEvent("[Sự kiện]: Người dùng click chuột liên tục (poke)", true);
        clicks = 0;
      }
      clickTimer = setTimeout(() => { clicks = 0; }, 1000);
    });

    this.canvas.addEventListener('mouseover', (e) => {
      if (!this.isRemoving) {
        this.dispatchSimulatedEvent("[Sự kiện]: Người dùng vuốt ve bằng cách di chuột nhẹ nhàng qua đầu linh vật (Hover).", true);
      }
    });

    // Note: Global events (keyboard, scroll, heuristic mouseover on page elements) 
    // are now handled once by MascotManager to avoid duplicate dialogues.
  }

  showControlPanel(x, y) {
    if (!this.panel) return;

    // Reset position slightly off-screen to measure
    this.panel.style.left = '-1000px';
    this.panel.style.top = '-1000px';
    this.panel.classList.add('active');

    // Wait for the next tick to get measurements
    requestAnimationFrame(() => {
      const pWidth = this.panel.offsetWidth;
      const pHeight = this.panel.offsetHeight;
      const padding = 20;

      let finalX = x + 10;
      let finalY = y - pHeight / 2; // Default: centered vertically to cursor

      // Right edge check
      if (finalX + pWidth > window.innerWidth - padding) {
        finalX = x - pWidth - 10;
      }

      // Left edge check
      if (finalX < padding) {
        finalX = padding;
      }

      // Bottom edge check
      if (finalY + pHeight > window.innerHeight - padding) {
        finalY = window.innerHeight - pHeight - padding;
      }

      // Top edge check
      if (finalY < padding) {
        finalY = padding;
      }

      this.panel.style.left = `${finalX}px`;
      this.panel.style.top = `${finalY}px`;
    });
  }

  closeControlPanel() {
    if (this.panel) this.panel.classList.remove('active');
  }

  triggerPetting() {
    this.setState('*do_mat*');
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.className = 'shimeji-heart';
        heart.innerText = '❤';
        heart.style.left = `${this.x + 40 + Math.random() * 40}px`;
        heart.style.top = `${this.y + 20}px`;
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1500);
      }, i * 200);
    }
  }

  triggerScare() {
    this.setState('*giat_minh*');
    this.vy = -8; // Jump up in fright
  }

  triggerGhostMode() {
    this.container.classList.add('shimeji-ghost');
    setTimeout(() => {
      this.container.classList.remove('shimeji-ghost');
      this.x = Math.random() * (window.innerWidth - 150); // Reappear in a random spot
      this.y = this.groundY;
      this.updatePosition();
    }, 5000);
  }

  startWeather(season) {
    if (this.currentWeather) this.currentWeather.stop();
    this.currentWeather = new WeatherEngine(season);
  }

  stop() {
    this.isAlive = false;
    if (this.currentWeather) this.currentWeather.stop();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}

class WeatherEngine {
  constructor(season) {
    this.season = season;
    this.particles = [];
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'shimeji-weather-layer';
    this.ctx = this.canvas.getContext('2d');
    this.isRunning = true;

    this.init();
  }

  init() {
    this.resize = this.resize.bind(this);
    this.resize();
    document.body.appendChild(this.canvas);
    window.addEventListener('resize', this.resize);

    // Create particles based on season
    const count = this.season === 'winter' ? 100 : 60;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }

    this.loop();
    setTimeout(() => this.stop(), 10000); // 10s duration
  }

  resize() {
    this.canvas.width = document.documentElement.clientWidth;
    this.canvas.height = document.documentElement.clientHeight;
  }

  createParticle() {
    const isSpring = this.season === 'spring';
    const isSummer = this.season === 'summer';
    const isAutumn = this.season === 'autumn';
    const isWinter = this.season === 'winter';

    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height - this.canvas.height, // Start off-screen top
      size: Math.random() * (isWinter ? 4 : 8) + 2,
      vx: (Math.random() - 0.5) * (isAutumn ? 2 : 1),
      vy: Math.random() * 2 + (isSummer ? 3 : 1),
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.1,
      color: isSpring ? `rgba(255, 182, 193, ${Math.random() * 0.6 + 0.4})` :
        isSummer ? `rgba(255, 223, 0, ${Math.random() * 0.3 + 0.2})` :
          isAutumn ? `rgba(${200 + Math.random() * 55}, ${50 + Math.random() * 100}, 0, 0.8)` :
            `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`
    };
  }

  drawParticle(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);
    this.ctx.fillStyle = p.color;

    if (this.season === 'spring' || this.season === 'autumn') {
      // Leaf/Petal shape
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.quadraticCurveTo(p.size, p.size / 2, 0, p.size);
      this.ctx.quadraticCurveTo(-p.size, p.size / 2, 0, 0);
      this.ctx.fill();
    } else if (this.season === 'summer') {
      // Golden rays/sparkles
      this.ctx.beginPath();
      this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = 'gold';
      this.ctx.fill();
    } else {
      // Snow (Circular)
      this.ctx.beginPath();
      this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  update() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;

      if (p.y > this.canvas.height) {
        p.y = -20;
        p.x = Math.random() * this.canvas.width;
      }
    });
  }

  loop = () => {
    if (!this.isRunning) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => this.drawParticle(p));
    this.update();
    requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    window.removeEventListener('resize', this.resize);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Initialize when ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  window.mascotManager = new MascotManager();
} else {
  window.addEventListener('DOMContentLoaded', () => {
    window.mascotManager = new MascotManager()
  });
}
