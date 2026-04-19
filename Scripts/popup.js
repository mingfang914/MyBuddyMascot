document.addEventListener('DOMContentLoaded', async () => {
  const globalToggle = document.getElementById('global-toggle');
  const siteToggle = document.getElementById('site-toggle');
  const domainText = document.getElementById('current-domain');

  // Lấy domain hiện tại
  let currentDomain = '';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
      domainText.textContent = currentDomain;
    } else {
      domainText.textContent = 'Không hỗ trợ trên trang này';
      siteToggle.disabled = true;
    }
  } catch (err) {
    domainText.textContent = 'Không lấy được thông tin trang';
    siteToggle.disabled = true;
  }

  // Load state từ Chrome Storage
  chrome.storage.local.get(['isGlobalEnabled', 'disabledDomains'], (result) => {
    // Mặc định là bật (nếu chưa set thì undefined -> bật)
    globalToggle.checked = result.isGlobalEnabled !== false;

    const disabledDomains = result.disabledDomains || [];
    if (currentDomain && disabledDomains.includes(currentDomain)) {
      siteToggle.checked = true; // Bị chặn tức là check = true (Chặn trang này)
    } else {
      siteToggle.checked = false;
    }
  });

  // Lắng nghe sự kiện toggle Global
  globalToggle.addEventListener('change', () => {
    chrome.storage.local.set({ isGlobalEnabled: globalToggle.checked }, () => {
      // Báo cho content_script biết để tắt/bật ngay lập tức (nếu cần)
      sendMessageToTab({ action: "toggleMascot", state: globalToggle.checked });
    });
  });

  // Lắng nghe sự kiện toggle Site
  siteToggle.addEventListener('change', () => {
    if (!currentDomain) return;

    chrome.storage.local.get(['disabledDomains'], (result) => {
      let disabledDomains = result.disabledDomains || [];
      
      if (siteToggle.checked) {
        // Thêm vào danh sách chặn
        if (!disabledDomains.includes(currentDomain)) {
          disabledDomains.push(currentDomain);
        }
      } else {
        // Xóa khỏi danh sách chặn
        disabledDomains = disabledDomains.filter(d => d !== currentDomain);
      }

      chrome.storage.local.set({ disabledDomains }, () => {
        // Buộc load lại trang để áp dụng (cách dễ nhất để xóa sạch Mascot DOM)
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if(tabs[0]) chrome.tabs.reload(tabs[0].id);
        });
      });
    });
  });

  // Helper gửi message
  function sendMessageToTab(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, msg).catch(()=>console.log("Tab chưa load content script."));
      }
    });
  }
});
