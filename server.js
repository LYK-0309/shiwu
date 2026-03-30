const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// 百度AI配置
const API_KEY = "FSv88oAR18bu1aQNSsvD8syO";
const SECRET_KEY = "RXleCZrP8L253crircs2hFZLJr49RDwE";
let accessToken = null;
let tokenExpireTime = null;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 根路径
app.get('/', (req, res) => {
    res.json({ 
        message: '百度AI看图识万物 API 服务', 
        status: 'running',
        endpoints: {
            recognize: 'POST /api/recognize'
        }
    });
});

// 获取百度Access Token
async function getAccessToken() {
    if (accessToken && tokenExpireTime > Date.now()) {
        return accessToken;
    }
    
    try {
        const response = await axios.post(
            'https://aip.baidubce.com/oauth/2.0/token',
            null,
            {
                params: {
                    grant_type: 'client_credentials',
                    client_id: API_KEY,
                    client_secret: SECRET_KEY
                }
            }
        );
        
        accessToken = response.data.access_token;
        tokenExpireTime = Date.now() + (response.data.expires_in * 1000);
        console.log('✅ 百度AI Token获取成功');
        return accessToken;
    } catch (error) {
        console.error('获取Token失败:', error.response?.data || error.message);
        throw error;
    }
}

// 图片识别接口
app.post('/api/recognize', async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: '缺少图片数据' });
        }
        
        const token = await getAccessToken();
        
        const response = await axios.post(
            `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general`,
            `image=${encodeURIComponent(image)}&baike_num=0`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                params: {
                    access_token: token
                }
            }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error('识别失败:', error.response?.data || error.message);
        res.status(500).json({ 
            error: '识别失败',
            details: error.response?.data || error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 百度AI代理服务运行在端口 ${port}`);
    console.log(`📡 API地址: http://localhost:${port}/api/recognize`);
});