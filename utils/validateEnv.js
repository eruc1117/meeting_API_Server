require('dotenv').config();

// C-01 修正：JWT 密鑰強度檢查 — 弱密鑰直接拒絕啟動（fail-fast）
const WEAK_SECRETS = ['secret', 'changeme', 'password', 'jwt_secret', 'your_secret_here'];
const MIN_SECRET_LENGTH = 32;

function validateEnv() {
  const secret = process.env.SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH || WEAK_SECRETS.includes(secret.toLowerCase())) {
    console.error(`[FATAL] 環境變數 SECRET 未設定或強度不足（需至少 ${MIN_SECRET_LENGTH} 字元隨機字串），伺服器拒絕啟動。`);
    console.error('        產生方式：node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
    process.exit(1);
  }
}

module.exports = validateEnv;
