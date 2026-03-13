// Thuật toán điều khiển Trình chiếu (Slider)

const storeAddress = "9.870225049474618, 106.34757420122392";

// TÍCH HỢP HỢP NHẤT: MỞ CỬA SỔ VÀ ĐO LƯỜNG DỮ LIỆU
function openModal(title, imageSrc) {
    // Kích hoạt giao diện cửa sổ
    document.getElementById('productModal').style.display = 'flex';
    document.getElementById('modalTitle').innerText = 'Chi tiết: ' + title;

    // Nạp phương tiện (Hình ảnh & Video)
    const mediaContainer = document.getElementById('modalMedia');
    mediaContainer.innerHTML = `
        <img src="${imageSrc}" alt="Góc 1">
        <img src="${imageSrc}" alt="Góc 2" style="filter: brightness(0.9);">
        <img src="${imageSrc}" alt="Góc 3" style="filter: brightness(1.1);">
        <iframe width="100%" height="300" src="https://www.youtube.com/embed/A1YxNYiyALg" frameborder="0" allowfullscreen style="border-radius: 12px; border: 2px solid #ccc;"></iframe>
    `;
    
    // Gọi thuật toán bản đồ
    autoGetLocation();

    // Ghi nhận dữ liệu hành vi người dùng (Nếu hệ thống tracking đã sẵn sàng)
    if (typeof trackUserAction === "function") {
        trackUserAction('view_item', { item_name: title });
    }
}

function autoGetLocation() {
    const inputField = document.getElementById('userAddress');
    inputField.value = "Nhập vị trí của bạn để tìm đường...";
    showStoreLocationOnly();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, { timeout: 10000 });
    } else {
        inputField.value = "";
        inputField.placeholder = "thiết bị không hỗ trợ, bạn hãy nhập vào đây nha!";
    }
}

function showPosition(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    document.getElementById('userAddress').value = "📍 vị trí đã bật";
    const mapUrl = `https://maps.google.com/maps?saddr=${userLat},${userLng}&daddr=${storeAddress}&hl=vi&output=embed`;
    document.getElementById('mapIframe').src = mapUrl;
}

function showError(error) {
    const inputField = document.getElementById('userAddress');
    inputField.value = "";
    inputField.placeholder = "Chưa bật định vị, nhập vị trí hiện tại của bạn";
}

function showStoreLocationOnly() {
    const mapUrl = `https://maps.google.com/maps?q=${storeAddress}&hl=vi&z=18&output=embed`;
    document.getElementById('mapIframe').src = mapUrl;
}

function getDirections() {
    const address = document.getElementById('userAddress').value;
    if(address.trim() === "" || address.includes("Đã bắt được") || address.includes("Đang tìm")) {
        alert("Hãy bật vị trí/GPS");
        return;
    }
    const mapUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(address)}&daddr=${storeAddress}&hl=vi&output=embed`;
    document.getElementById('mapIframe').src = mapUrl;
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('mapIframe').src = "";
}

function searchProducts() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const title = product.querySelector('.product-title').innerText.toLowerCase();
        if (title.includes(keyword)) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Mở hoặc đóng cửa sổ chat (Đã fix lỗi giật lag)
function toggleAIChat() {
    const chatWindow = document.getElementById('aiChatWindow');
    const aiBtn = document.getElementById('aiBtnToggle');
    
    if (chatWindow.style.display === 'flex') {
        // ĐÓNG CHAT: Ẩn khung chat, Hiện lại quả cầu to bên ngoài
        chatWindow.style.display = 'none';
        aiBtn.style.display = 'flex'; 
    } else {
        // MỞ CHAT: Hiện khung chat, Ẩn quả cầu to bên ngoài đi cho máy tính mát mẻ
        chatWindow.style.display = 'flex';
        aiBtn.style.display = 'none'; 
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        sendUserMessage();
    }
}

function sendUserMessage() {
    const inputField = document.getElementById('aiChatInput');
    const userText = inputField.value.trim();
    if (userText === "") return; 

    const chatBody = document.getElementById('aiChatBody');
    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'chat-msg msg-user';
    userMsgDiv.innerText = userText;
    chatBody.appendChild(userMsgDiv);

    inputField.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        aiReply(userText.toLowerCase(), chatBody);
    }, 1000);
}

// ĐÃ XÓA DÒNG CONST GEMINI_API_KEY CHO AN TOÀN

async function aiReply(text, chatBody) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-msg msg-ai';
    loadingDiv.innerText = "đang soạn tin nhắn...";
    chatBody.appendChild(loadingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
        // TÍNH NĂNG BẢO MẬT: Gọi vào trạm trung chuyển của Netlify (Backend)
        // Không còn gọi trực tiếp sang Google API nữa
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }) // Gửi câu hỏi của khách vào nhà kho
        });

        const data = await response.json();
        chatBody.removeChild(loadingDiv); 

        if (!response.ok) {
            throw new Error(data.error || "Lỗi máy chủ trung chuyển");
        }

        // Trích xuất và in câu trả lời ra màn hình
        let aiResponseText = data.candidates[0].content.parts[0].text;
        const aiMsgDiv = document.createElement('div');
        aiMsgDiv.className = 'chat-msg msg-ai';
        aiMsgDiv.innerHTML = aiResponseText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); 
        chatBody.appendChild(aiMsgDiv);

    } catch (error) {
        if (chatBody.contains(loadingDiv)) {
            chatBody.removeChild(loadingDiv);
        }
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-msg msg-ai';
        errorDiv.innerText = "Hệ thống bảo mật đang bận, vui lòng thử lại sau! 😢";
        chatBody.appendChild(errorDiv);
    }
    
    chatBody.scrollTop = chatBody.scrollHeight;
}
/* ========================================================
   TRÌNH XỬ LÝ SỰ KIỆN: THU THẬP DỮ LIỆU HÀNH VI (ANALYTICS)
   ======================================================== */
function trackUserAction(actionName, dataObj) {
    // Kiểm tra tính toàn vẹn của hệ thống gtag trước khi gửi
    if (typeof gtag !== 'undefined') {
        gtag('event', actionName, dataObj);
    }
}

// TÍCH HỢP VÀO NÚT TÌM KIẾM
function searchProducts() {
    const keyword = document.getElementById('searchInput').value;
    // ... (Giữ nguyên các đoạn code tìm kiếm cũ của bạn ở đây) ...
    
    // Bổ sung luồng gửi dữ liệu:
    if(keyword.trim() !== "") {
        trackUserAction('search_vehicle', { search_term: keyword });
    }
}

// HỢP NHẤT CHỨC NĂNG MỞ POPUP VÀ ĐO LƯỜNG DỮ LIỆU
function openModal(title, imageSrc) {
    // 1. Lệnh hiển thị cửa sổ
    document.getElementById('productModal').style.display = 'flex';
    document.getElementById('modalTitle').innerText = 'Chi tiết: ' + title;

    // 2. Lệnh hiển thị hình ảnh và video
    const mediaContainer = document.getElementById('modalMedia');
    mediaContainer.innerHTML = `
        <img src="${imageSrc}" alt="Góc 1">
        <img src="${imageSrc}" alt="Góc 2" style="filter: brightness(0.9);">
        <img src="${imageSrc}" alt="Góc 3" style="filter: brightness(1.1);">
        <iframe width="100%" height="300" src="https://www.youtube.com/embed/A1YxNYiyALg" frameborder="0" allowfullscreen style="border-radius: 12px; border: 2px solid #ccc;"></iframe>
    `;
    
    // 3. Lệnh gọi bản đồ
    autoGetLocation();

    // 4. Lệnh báo cáo dữ liệu về Google Analytics (Chạy ngầm)
    if (typeof trackUserAction === "function") {
        trackUserAction('view_item', { item_name: title });
    }
}