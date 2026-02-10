// --- GOOGLE ANALYTICS HARDCODED CREDENTIALS ---
// WARNING: This file contains SENSITIVE KEYS. Do not share publicly.
// Credentials extracted from: api/ga-credentials.json

const CLIENT_EMAIL = "analytics-viewer@database-a5461.iam.gserviceaccount.com";
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDKMilUFbveCdHu
kKbBFQokhVyGlJ8vf0mXLChvdQQmX+qRaRApWc5mAgG7uMhkAwR0v4R7/z204zT9
PSgLVf01jJw1lPEmNsyvURCALrlfKipK+LKq+nOakkl6Zx9mVA+C0yy6NxuYPmYq
tneGD+650l0GZip5oPwh+4yryiZUItp/A/YLiTv9UX9dl2uM+ZhL9FIZx0kXsBYf
rxik3N1TmRhZcHJqFLlA9zytjQKnp23ahzUYZNBnqyHYKTd03nVO9VB2PuLHjYFC
lmm3Dx0Ww5RObYXZNOTy18K7lobpg5KlEUbI8iKIaKEqrJncKXmenQIjwJKXb4T+
bPPh7JULAgMBAAECggEANY+ZHBGPzQ8b4c7GpZIduDPtoSbgjjPxOg7z/SZpvYKd
//vtUI7eGm6AqAoYZ0nXVdffz/r6jR68zDJ1l58lLpi7ToRQZxeQHAbk0JfP+hIQ
1wBPT/R9SB5lQXvsuO4el8C58fAkKq2o4bqpKcWxrt63TrkkmkiXUacxidZIVfPW
vbEGuo4VrYanCRdJjmjz61xXfp8C1w0QUHPBnMkOl1E0qvkuOVTJgLyOvB0kMeoE
+awuHOK5GVLBsWjfK0ja0bFktc1tAxBB2Fm7UomvIEfX5vyboAE1PBMZUJ75O2bs
OaI6y1VFr6XjfqtHY84fBYFPxVn3kawSxnfGfWM2YQKBgQD1SSLJawmHPGQWODdJ
2dQ1WTzzY4tcV3w4DocmnVx93lvdqtRkcju24qnFVIspZOTtBBgeK+X8KC71E4FZ
iWbwyzyU2zLlcKbxaIJrZl7tw1JMD1cgi14SeL2A2/Ta9vOoS6w90PKVv//km33E
JznV60Ixi04FyxVHn8CWVZqzawKBgQDTBy6bfLDOpWvG1PXNda081up/NJnSQEgM
rAEFp+C0J3a5fRoK4PB+sUr5esrbGInZrh+FzIVY2/GJ+7tFh/WvFBkE4FCRtSsp
hubHfhWEjTnCqA69p12EXrbPpZnun7k7b/EwyiqULeBGHDm9GgVEZuYJRvT3QXx3
W7sPgHus4QKBgQCXZmE2ef8Tnk8Y9/IIf4/grghVIuhuQwHFiBIb352rg4iotj0L
EweQxy+LQbf0APbc5V4NoYL/tb3mP/fjUFBd6NSn/PTZckNZVuzJZhLKJ3mwwPdC
e0PBmw09cIcecLfM9YiHT2Ws0Sod7Wwfmyazx9a/xgCOyt+DqjOxl305qQKBgD7q
Tj/3LfN+KCLQjTQjWHHiFWm1cgLYPWLhyTA5e+naNjBZFvGVXL4494Rn0qD9sOOg
YS+P6VWzxVCBJ7U0MtBu6oKkqgC3BdZMrPNfKOUrAcSCPFrY0i3L2y8PTVRydFQ/
LKaCL62b+9iLQ7+YSWe6Ue0EJbat5IDlbWDSyoyhAoGAQjzp8i7Fch2w8kPUUz1t
aD50LPAyKglCYH/GL7dE5NPshIpgLKzNI9bd6AQqslAW0a9DCwVSwXi4KaQZB4Aa
no03RKG0OsTGdOpdlODBrQu3xjVQPpPWR9lFpOq/MisILT6vdPJmM5u+YUvpGVu9k
/5BNXZ2AM8ZNDh+it9eqT68=
-----END PRIVATE KEY-----`;

const PROPERTY_ID = '494778207'; // Tracking ID

// --- HELPER FUNCTIONS FOR JWT SIGNING (Edge Compatible) ---
function pemToBinary(pem) {
    const b64 = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s/g, "");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function arrayBufferToBase64Url(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return base64UrlEncode(binary);
}

async function createSignedJWT(clientEmail, privateKeyPem) {
    const header = {
        alg: "RS256",
        typ: "JWT"
    };
    
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/analytics.readonly",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
    const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

    // Import Key
    const binaryKey = pemToBinary(privateKeyPem);
    const key = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256"
        },
        false,
        ["sign"]
    );

    // Sign
    const signatureBuffer = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        new TextEncoder().encode(unsignedToken)
    );

    const signature = arrayBufferToBase64Url(signatureBuffer);
    return `${unsignedToken}.${signature}`;
}

async function getAccessToken() {
    const jwt = await createSignedJWT(CLIENT_EMAIL, PRIVATE_KEY_PEM);
    
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt
        })
    });

    const data = await response.json();
    if (!data.access_token) {
        throw new Error("Failed to get access token from Google: " + JSON.stringify(data));
    }
    return data.access_token;
}

// --- MAIN HANDLER ---
export async function onRequest(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const accessToken = await getAccessToken();
        
        // 1. Fetch Realtime (Active Users)
        const realtimeResp = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runRealtimeReport`, 
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    metrics: [{ name: 'activeUsers' }],
                    dimensions: [{ name: 'country' }] // Optional, but structure needs it sometimes
                })
            }
        );
        const realtimeData = await realtimeResp.json();
        const activeUsers = realtimeData.rows 
            ? realtimeData.rows.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0)
            : 0;

        // 2. Fetch Report (Total Views & Users - Last 28 Days)
        // Note: Using hardcoded dateRanges equivalent to Node version
        const reportResp = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    dateRanges: [{ startDate: '2023-01-01', endDate: 'today' }],
                    metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }]
                })
            }
        );
        const reportData = await reportResp.json();
        const totalViews = reportData.rows && reportData.rows[0] 
            ? reportData.rows[0].metricValues[0].value 
            : 0;
        const totalUsers = reportData.rows && reportData.rows[0]
            ? reportData.rows[0].metricValues[1].value
            : 0;

        return new Response(JSON.stringify({
            success: true,
            data: {
                activeUsers,
                totalViews,
                totalUsers
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}