export default async function handler(req, res) {
    // 1. Chỉ chấp nhận phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Lấy chìa khóa từ Két sắt của Vercel
    const API_KEY = process.env.GEMINI_API_KEY;
    
    // Lấy tin nhắn của khách hàng
    const userMessage = req.body.message;
    const systemPrompt = `Bạn là nhân viên tư vấn chuyên nghiệp của cửa hàng "Xe Điện HS". Trả lời trực tiếp câu hỏi: "${userMessage}"`;

    try {
        // 3. Giao tiếp với Google Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });

        const data = await response.json();
        
        // 4. Trả kết quả về cho mặt tiền
        return res.status(200).json(data);
        
    } catch (error) {
        return res.status(500).json({ error: "Lỗi hệ thống máy chủ." });
    }
}