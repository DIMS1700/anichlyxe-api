import nodemailer from 'nodemailer';

// --- KONFIGURASI AKUN EMAIL ---
const mailAccounts = [
    { 
        user: 'brdimas4@gmail.com', 
        pass: 'llci rzyx sbgs dpwu' 
    }
];

const getRandomAccount = () => {
    const randomIndex = Math.floor(Math.random() * mailAccounts.length);
    return mailAccounts[randomIndex];
};

export default async function handler(req, res) {
    // CORS Setup yang lebih aman
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email, username } = req.body;
        const activeAccount = getRandomAccount();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, 
            auth: {
                user: activeAccount.user,
                pass: activeAccount.pass
            }
        });

        // Template Email Premium (Responsive Fix)
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verifikasi LyxeNime</title>
                <style>
                    /* Reset CSS */
                    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { -ms-interpolation-mode: bicubic; }
                    
                    /* Main Styles */
                    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #ffffff; }
                    .wrapper { background-color: #020617; padding: 20px 10px; width: 100%; table-layout: fixed; }
                    
                    /* Container responsive */
                    .container { 
                        max-width: 500px; 
                        width: 100%;
                        margin: 0 auto; 
                        background-color: #0f172a; 
                        border: 1px solid #1e293b; 
                        border-radius: 16px; 
                        overflow: hidden; 
                        box-shadow: 0 10px 25px rgba(0,0,0,0.5); 
                    }
                    
                    .header { background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 30px 20px; text-align: center; border-bottom: 1px solid #1e293b; }
                    .logo { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -1px; text-decoration: none; text-transform: uppercase; display: block; }
                    .logo span { color: #8b5cf6; }
                    
                    .content { padding: 30px 20px; text-align: center; }
                    .welcome-text { color: #94a3b8; font-size: 15px; margin-bottom: 25px; line-height: 1.6; }
                    
                    /* OTP Box Styling - Fixed for Mobile */
                    .otp-box { 
                        background-color: #1e1b4b; 
                        border: 1px solid #8b5cf6; 
                        color: #ffffff; 
                        font-size: 32px; /* Ukuran font lebih aman */
                        font-weight: 800; 
                        letter-spacing: 6px; /* Spasi antar huruf dikecilkan agar muat */
                        padding: 20px 10px; 
                        margin: 20px auto; 
                        border-radius: 12px; 
                        display: block; /* Supaya bisa di-center dengan margin auto */
                        width: fit-content;
                        min-width: 200px;
                        max-width: 90%;
                        box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); 
                        word-break: break-all;
                    }
                    
                    .timer { color: #8b5cf6; font-size: 13px; font-weight: bold; margin-top: 15px; display: block; }
                    
                    .footer { background-color: #020617; padding: 20px; text-align: center; color: #475569; font-size: 11px; border-top: 1px solid #1e293b; line-height: 1.6; }
                    .warning-card { background-color: #020617; border-radius: 8px; padding: 12px; margin-top: 25px; border-left: 3px solid #8b5cf6; text-align: left; }
                    .warning-card p { margin: 0; font-size: 11px; color: #64748b; }

                    /* Mobile Specific Adjustments */
                    @media only screen and (max-width: 480px) {
                        .logo { font-size: 24px; }
                        .content { padding: 20px 15px; }
                        .otp-box { 
                            font-size: 28px !important; 
                            letter-spacing: 4px !important; 
                            padding: 15px 5px !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <div class="logo">LYXE<span>NIME</span></div>
                        </div>
                        <div class="content">
                            <h2 style="color: #ffffff; font-size: 22px; margin-top: 0; font-weight: 800;">Konfirmasi Identitas</h2>
                            
                            <p class="welcome-text">Halo <strong>${username}</strong>,<br>
                            Satu langkah lagi untuk menikmati ribuan koleksi <strong>Anime & Donghua</strong> terbaik. Gunakan kode verifikasi di bawah ini:</p>
                            
                            <center>
                                <div class="otp-box">${otp}</div>
                            </center>
                            
                            <div class="timer">⏳ Berlaku selama 15 menit</div>
                            
                            <div class="warning-card">
                                <p><strong>Penting:</strong> Jangan bagikan kode ini kepada siapapun. Tim LyxeNime tidak akan pernah meminta kode akun Anda demi keamanan data pribadi.</p>
                            </div>
                        </div>
                        <div class="footer">
                            &copy; ${new Date().getFullYear()} LyxeNime Project &bull; Bandung, Indonesia<br>
                            Made with 💜 for Wibu Lovers.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"LyxeNime Security" <${activeAccount.user}>`,
            to: email,
            subject: `🔐 ${otp} - Kode Verifikasi LyxeNime`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, otp: otp });

    } catch (error) {
        console.error("Gagal kirim email:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}