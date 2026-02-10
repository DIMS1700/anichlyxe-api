import nodemailer from 'nodemailer';

// --- KONFIGURASI AKUN EMAIL ---
// CUSTOMER: Masukkan email dan App Password Gmail Anda di sini untuk fitur OTP
const mailAccounts = [
    { 
        user: 'EMAIL_GMAIL_ANDA@gmail.com', 
        pass: 'APP_PASSWORD_GMAIL_ANDA' // Buat di: Google Account -> Security -> App Passwords
    }
];

// Fungsi load balancer sederhana
const getRandomAccount = () => {
    const randomIndex = Math.floor(Math.random() * mailAccounts.length);
    return mailAccounts[randomIndex];
};

export async function onRequestPost(context) {
    const { request } = context;

    // CORS Headers Helper
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle Preflight request jika masuk ke sini (biasanya ditangani onRequestOptions)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { email, username } = await request.json();
        
        if (!email || !username) {
             return new Response(JSON.stringify({ success: false, error: 'Email dan Username wajib diisi' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 1. Pilih akun pengirim
        const activeAccount = getRandomAccount();
        console.log(`[Email System] Mengirim OTP menggunakan: ${activeAccount.user}`);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, 
            auth: {
                user: activeAccount.user,
                pass: activeAccount.pass
            }
        });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Template Email
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #000000; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #333; border-radius: 16px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 15px rgba(229, 9, 20, 0.2); }
                    .header { background-color: #111; padding: 20px; text-align: center; border-bottom: 2px solid #E50914; }
                    .logo { font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -1px; text-decoration: none; font-style: italic; }
                    .logo span { color: #E50914; }
                    .content { padding: 40px 30px; text-align: center; color: #cccccc; }
                    .otp-box { background-color: #1a1a1a; border: 2px dashed #333; color: #E50914; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px; margin: 30px 0; border-radius: 12px; display: inline-block; }
                    .footer { background-color: #111; padding: 20px; text-align: center; color: #555; font-size: 12px; border-top: 1px solid #333; }
                    .warning { color: #666; font-size: 13px; margin-top: 20px; line-height: 1.5; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <a href="#" class="logo">MIKU<span>NIME</span></a>
                    </div>
                    <div class="content">
                        <h2 style="color: #fff; margin-top: 0;">Verifikasi Akun</h2>
                        <p>Halo <strong>${username}</strong>,</p>
                        <p>Terima kasih sudah bergabung! Gunakan kode di bawah ini untuk menyelesaikan pendaftaran akun LyxeNime Anda.</p>
                        
                        <div class="otp-box">${otp}</div>
                        
                        <p style="color: #fff; font-weight: bold;">⏳ Kode ini kadaluarsa dalam 15 menit.</p>
                        
                        <div class="warning">
                            <p>Jangan berikan kode ini kepada siapapun, termasuk pihak yang mengaku sebagai admin LyxeNime.</p>
                        </div>
                    </div>
                    <div class="footer">
                        &copy; ${new Date().getFullYear()} LyxeNime Project. All rights reserved.<br>
                        Made with ❤️ for Wibu Indonesia.
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
        
        return new Response(JSON.stringify({ success: true, otp: otp }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Gagal kirim email:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}